import { useState } from 'react'
import { saveLicense, MASTER_CODE } from '../lib/codes.js'
import { verifySignedCode } from '../lib/signedLicense.js'
import { SUPABASE_ENABLED, supabase } from '../lib/supabase.js'

const DEVICE_FP_KEY = 'kbc_device_fp_v1'

// Generate / load device fingerprint stabil di browser ini.
// Kombinasi random ID + UA + screen size, simpan di localStorage.
function getDeviceFingerprint() {
  try {
    let fp = localStorage.getItem(DEVICE_FP_KEY)
    if (fp) return fp
    const rand = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
    const ua = (navigator.userAgent || '').slice(0, 80)
    const screen = `${window.screen?.width || 0}x${window.screen?.height || 0}`
    fp = `${rand}-${btoa(ua + '|' + screen).slice(0, 24)}`.replace(/[^a-zA-Z0-9-]/g, '')
    localStorage.setItem(DEVICE_FP_KEY, fp)
    return fp
  } catch {
    return 'fp-' + Math.random().toString(36).slice(2)
  }
}

export default function ActivationPage({ onActivated }) {
  const [code, setCode] = useState('')
  const [nama, setNama] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const setupLocalUser = (namaUser, role = 'pengawas') => {
    const userObj = {
      id: 'local-' + role + '-' + Date.now(),
      username: role,
      nama: namaUser || 'Pengguna',
      role,
      pengawasId: null,
      madrasahId: null,
      isLocalAdmin: role === 'admin'
    }
    try {
      localStorage.setItem('kbc_local_user_v1', JSON.stringify(userObj))
    } catch {}
  }

  const handleActivate = async (e) => {
    e.preventDefault()
    const cleanCode = String(code).trim().toUpperCase()
    const cleanNama = String(nama).trim()
    if (!cleanCode) {
      setError('Masukkan kode aktivasi')
      return
    }
    if (!cleanNama) {
      setError('Isi nama Bapak/Ibu')
      return
    }

    setLoading(true)
    setError('')

    try {
      let validatedTier = null
      let validatedExpiresAt = 0
      let licenseLabel = ''
      let userRole = 'pengawas' // default customer = pengawas

      // 1. Master code: admin penuh, no single-use check
      if (cleanCode === MASTER_CODE) {
        validatedTier = 'pro'
        licenseLabel = 'Master (Owner)'
        userRole = 'admin'
      } else {
        // 2. Verifikasi signature HMAC offline
        const result = await verifySignedCode(cleanCode)
        if (!result.valid) {
          setError(result.error || 'Kode aktivasi tidak valid')
          setLoading(false)
          return
        }
        validatedTier = result.tier
        licenseLabel = result.label
        if (result.expiryDays > 0) {
          validatedExpiresAt = Date.now() + result.expiryDays * 86400000
        }

        // 3. Single-use check via Supabase RPC (kalau Supabase tersedia)
        if (SUPABASE_ENABLED) {
          const fp = getDeviceFingerprint()
          try {
            const { data, error: rpcErr } = await supabase.rpc('claim_signed_code', {
              p_code: cleanCode,
              p_device_fp: fp,
              p_nama: cleanNama,
              p_tier: result.tier
            })
            if (rpcErr) {
              // Kalau RPC belum di-deploy, fallback warn tapi tetap allow (degraded)
              console.warn('claim_signed_code RPC error, allow tanpa single-use check:', rpcErr.message)
            } else if (data && data.ok === false) {
              setError(data.error || 'Kode tidak bisa dipakai')
              setLoading(false)
              return
            }
          } catch (rpcCatchErr) {
            console.warn('RPC claim_signed_code failed:', rpcCatchErr)
            // Allow degraded mode (kalau Supabase down, jangan block customer)
          }
        }
      }

      // 4. Simpan lisensi + setup user lokal
      saveLicense(cleanCode, validatedTier, {
        via: 'signed-license',
        label: licenseLabel,
        expiresAt: validatedExpiresAt,
        nama: cleanNama,
        role: userRole
      })
      setupLocalUser(cleanNama, userRole)
      onActivated({ code: cleanCode, tier: validatedTier })
      setTimeout(() => window.location.reload(), 100)
    } catch (err) {
      console.error(err)
      setError('Gagal memvalidasi kode: ' + (err.message || 'unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleTrial = () => {
    saveLicense('TRIAL-AUTO', 'demo', {
      label: 'Trial 5 Hari',
      expiresAt: Date.now() + 5 * 86400000,
      role: 'pengawas'
    })
    setupLocalUser('Pengguna Trial', 'pengawas')
    try {
      localStorage.setItem('kbc_trial_user_v1', JSON.stringify({
        id: 'trial-user', username: 'trial', nama: 'Pengguna Trial',
        role: 'pengawas', isTrial: true
      }))
    } catch {}
    onActivated({ code: 'TRIAL-AUTO', tier: 'demo' })
    setTimeout(() => window.location.reload(), 100)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-toska-500/20 ring-4 ring-toska-400/10 mb-4">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-2xl font-serif font-semibold text-white">Aktivasi Aplikasi</h1>
          <p className="text-sm text-slate-300 mt-2">
            Pendampingan Piloting Kurikulum Berbasis Cinta
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Masukkan kode aktivasi yang sudah dibeli
          </p>
        </div>

        <form onSubmit={handleActivate} className="bg-white rounded-xl shadow-2xl p-6 space-y-4">
          <div>
            <label className="label text-navy-900">Nama Bapak/Ibu</label>
            <input
              className="input"
              placeholder="Contoh: Subariyanto, S.Pd, M.Pd.I"
              value={nama}
              onChange={(e) => { setNama(e.target.value); setError('') }}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="label text-navy-900">Kode Aktivasi</label>
            <input
              className="input text-center text-base tracking-wider font-mono uppercase"
              placeholder="KBC-PRO-XXXXXXXX-XXXXXX-XXXXXXXXXXXX"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-3 text-base"
            disabled={loading}
          >
            {loading ? 'Memvalidasi…' : 'Aktivasi & Masuk'}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">atau</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTrial}
            className="btn-outline w-full py-3 text-base border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            🎁 Coba Gratis 5 Hari
          </button>

          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Kode aktivasi terikat ke 1 device. Untuk pindah device, gunakan menu Pengaturan → Backup & Restore JSON.
          </p>

          <p className="text-xs text-slate-400 text-center">
            Belum punya kode?{' '}
            <a
              href="https://wa.me/6282330647698?text=Saya%20butuh%20kode%20aktivasi%20KBC%20Pendampingan%20Piloting"
              target="_blank"
              rel="noreferrer"
              className="text-toska-700 hover:underline"
            >
              Hubungi Admin via WhatsApp
            </a>
          </p>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Pokjawas Madrasah Kemenag Kab. Jember
        </p>
      </div>
    </div>
  )
}
