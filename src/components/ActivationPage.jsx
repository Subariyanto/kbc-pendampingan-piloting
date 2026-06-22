import { useState, useEffect } from 'react'
import { saveLicense, MASTER_CODE } from '../lib/codes.js'
import { verifySignedCode } from '../lib/signedLicense.js'

export default function ActivationPage({ onActivated }) {
  const [code, setCode] = useState('')
  const [nama, setNama] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const setupLocalAdmin = (namaUser) => {
    const adminUser = {
      id: 'local-admin-' + Date.now(),
      username: 'admin',
      nama: namaUser || 'Pengawas',
      role: 'admin',
      pengawasId: null,
      madrasahId: null,
      isLocalAdmin: true
    }
    try {
      localStorage.setItem('kbc_local_user_v1', JSON.stringify(adminUser))
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

      // 1. Master code
      if (cleanCode === MASTER_CODE) {
        validatedTier = 'pro'
        licenseLabel = 'Master (Owner)'
      } else {
        // 2. Verifikasi signed code (offline, HMAC)
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
      }

      // 3. Simpan lisensi + setup admin lokal
      saveLicense(cleanCode, validatedTier, {
        via: 'signed-license',
        label: licenseLabel,
        expiresAt: validatedExpiresAt,
        nama: cleanNama
      })
      setupLocalAdmin(cleanNama)
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
      expiresAt: Date.now() + 5 * 86400000
    })
    setupLocalAdmin('Pengguna Trial')
    try {
      localStorage.setItem('kbc_trial_user_v1', JSON.stringify({
        id: 'trial-user', username: 'trial', nama: 'Pengguna Trial',
        role: 'admin', isTrial: true
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
            Data tersimpan di browser ini saja. Bisa backup ke file JSON di menu Pengaturan untuk pindah device.
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
