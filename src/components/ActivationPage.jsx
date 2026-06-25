import { useState } from 'react'
import { saveLicense, MASTER_CODE } from '../lib/codes.js'
import { verifySignedCode } from '../lib/signedLicense.js'
import { SUPABASE_ENABLED, supabase } from '../lib/supabase.js'

const REGISTERED_USERS_KEY = 'kbc_registered_users_v1'

// Simpan user ke registered list (nama+password, bisa login)
function saveRegisteredUser(nama, password, role) {
  try {
    const list = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]')
    const idx = list.findIndex((u) => u.nama.toLowerCase() === nama.toLowerCase())
    const userObj = {
      id: idx >= 0 ? list[idx].id : 'reg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      nama, password, role,
      createdAt: idx >= 0 ? list[idx].createdAt : new Date().toISOString(),
      activatedAt: new Date().toISOString()
    }
    if (idx >= 0) list[idx] = userObj; else list.unshift(userObj)
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list))
  } catch {}
}

export default function ActivationPage({ onActivated }) {
  const [code, setCode] = useState('')
  const [nama, setNama] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleActivate = async (e) => {
    e.preventDefault()
    const cleanCode = String(code).trim().toUpperCase()
    const cleanNama = String(nama).trim()
    if (!cleanCode) { setError('Masukkan kode aktivasi'); return }
    if (!cleanNama) { setError('Isi nama Bapak/Ibu'); return }
    if (password.length < 4) { setError('Password minimal 4 karakter'); return }
    if (password !== password2) { setError('Konfirmasi password tidak cocok'); return }

    setLoading(true); setError('')
    try {
      let tier, label = '', exp = 0, role = 'pengawas'
      if (cleanCode === MASTER_CODE) {
        tier = 'pro'; label = 'Master (Owner)'; role = 'admin'
      } else {
        const r = await verifySignedCode(cleanCode)
        if (!r.valid) { setError(r.error || 'Kode tidak valid'); setLoading(false); return }
        tier = r.tier; label = r.label
        if (r.expiryDays > 0) exp = Date.now() + r.expiryDays * 86400000
      }

      // Simpan lisensi
      saveLicense(cleanCode, tier, { via: 'signed-license', label, expiresAt: exp, nama: cleanNama, role })

      // Simpan user terdaftar (nama+password → bisa login)
      saveRegisteredUser(cleanNama, password, role)

      // Auto-login: simpan local user supaya langsung masuk
      const uObj = {
        id: 'local-' + role + '-' + Date.now(),
        username: role, nama: cleanNama, role, password,
        pengawasId: null, madrasahId: null,
        isLocalAdmin: role === 'admin'
      }
      try { localStorage.setItem('kbc_local_user_v1', JSON.stringify(uObj)) } catch {}

      onActivated({ code: cleanCode, tier })
      setTimeout(() => window.location.reload(), 100)
    } catch (err) {
      setError('Gagal: ' + (err.message || 'Coba lagi'))
    } finally { setLoading(false) }
  }

  const goToLogin = () => {
    try { localStorage.setItem('kbc_show_login_v1', '1') } catch {}
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-toska-500/20 ring-4 ring-toska-400/10 mb-4">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-2xl font-serif font-semibold text-white">Aktivasi Aplikasi</h1>
          <p className="text-sm text-slate-300 mt-2">Pendampingan Piloting KBC</p>
          <p className="text-xs text-slate-400 mt-1">Masukkan kode aktivasi & buat password login</p>
        </div>

        <form onSubmit={handleActivate} className="bg-white rounded-xl shadow-2xl p-6 space-y-4">
          <div>
            <label className="label text-navy-900">Nama Bapak/Ibu</label>
            <input className="input" placeholder="Contoh: Subariyanto, S.Pd, M.Pd.I"
              value={nama} onChange={(e) => { setNama(e.target.value); setError('') }} autoComplete="name" />
            <p className="text-[10px] text-slate-400 mt-1">Nama ini dipakai untuk login.</p>
          </div>

          <div>
            <label className="label text-navy-900">Kode Aktivasi</label>
            <input className="input text-center text-base tracking-wider font-mono uppercase"
              placeholder="KBC-XXXX-XXXXXXX"
              value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
              autoComplete="off" spellCheck={false} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-navy-900">Password</label>
              <input className="input" type="password" placeholder="Min 4 karakter"
                value={password} onChange={(e) => { setPassword(e.target.value); setError('') }}
                autoComplete="new-password" />
            </div>
            <div>
              <label className="label text-navy-900">Ulangi Password</label>
              <input className="input" type="password" placeholder="Konfirmasi"
                value={password2} onChange={(e) => { setPassword2(e.target.value); setError('') }}
                autoComplete="new-password" />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-2">{error}</div>
          )}

          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
            {loading ? 'Memvalidasi…' : 'Aktivasi & Masuk'}
          </button>

          <p className="text-xs text-slate-400 text-center">
            Belum punya kode?{' '}
            <a href="https://wa.me/6282330647698" target="_blank" rel="noreferrer" className="text-toska-700 hover:underline">
              Hubungi Admin
            </a>
          </p>
        </form>

        <div className="text-center mt-6">
          <button type="button" onClick={goToLogin} className="text-sm text-toska-300 hover:text-white hover:underline">
            ← Sudah punya akun? Login di sini
          </button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">Pokjawas Madrasah Kemenag Kab. Jember</p>
      </div>
    </div>
  )
}
