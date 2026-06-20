import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { SUPABASE_ENABLED } from '../lib/supabase.js'
import { getStoredLicense, saveLicense, validateCode, fetchRemoteCodes, saveLocalCodes, tryLoadLocalCodes, clearLicense } from '../lib/codes.js'

const DEMO = [
  { role: 'Admin', user: 'admin', pass: 'admin123' },
  { role: 'Pengawas', user: 'pengawas', pass: 'pengawas123' },
  { role: 'Kepala Madrasah', user: 'kepala', pass: 'kepala123' },
  { role: 'Viewer', user: 'viewer', pass: 'viewer123' }
]

export default function LoginPage() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { state } = useData()
  const settings = state.settings
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activationCode, setActivationCode] = useState('')
  const [activationError, setActivationError] = useState('')
  const [activationLoading, setActivationLoading] = useState(false)
  const [showActivation, setShowActivation] = useState(false)

  const license = getStoredLicense()
  const licenseExpired = license?.tier === 'demo' && license.expiresAt && Date.now() > license.expiresAt
  const isTrial = license?.tier === 'demo' && !licenseExpired
  const daysLeft = isTrial && license.expiresAt ? Math.max(0, Math.ceil((license.expiresAt - Date.now()) / 86400000)) : 0

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await login(username.trim(), password)
    setLoading(false)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success(`Selamat datang${res.user?.nama ? ', ' + res.user.nama : ''}`)
    navigate('/', { replace: true })
  }

  const fillDemo = (u, p) => {
    setUsername(u)
    setPassword(p)
  }

  const handleActivation = async (e) => {
    e.preventDefault()
    const clean = String(activationCode).trim()
    if (!clean) {
      setActivationError('Masukkan kode aktivasi')
      return
    }
    setActivationLoading(true)
    setActivationError('')
    try {
      let bundledCodes = tryLoadLocalCodes()
      try {
        const remote = await fetchRemoteCodes()
        if (Array.isArray(remote)) { bundledCodes = remote; saveLocalCodes(remote) }
      } catch {}
      const result = validateCode(clean, bundledCodes)
      if (!result.valid) {
        setActivationError(result.error || 'Kode aktivasi tidak valid')
        setActivationLoading(false)
        return
      }
      saveLicense(clean, result.tier)
      toast.success('Aktivasi berhasil! Silakan login.')
      setActivationCode('')
      setShowActivation(false)
      // Refresh license info
      window.location.reload()
    } catch {
      setActivationError('Gagal memvalidasi kode')
      setActivationLoading(false)
    }
  }

  const handleTrial = () => {
    saveLicense('TRIAL-AUTO', 'demo', {})
    toast.success('Trial 5 hari diaktifkan! Silakan login.')
    window.location.reload()
  }

  const handleClearLicense = () => {
    if (confirm('Hapus lisensi yang tersimpan? Anda akan diarahkan ke halaman aktivasi.')) {
      clearLicense()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-toska-700 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid lg:grid-cols-5">
        {/* Left visual */}
        <div className="hidden lg:flex flex-col justify-between bg-navy-950 text-white p-10 lg:col-span-2 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-950 to-toska-700 opacity-90" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-toska-200">Pokjawas Madrasah</p>
            <h1 className="text-3xl font-serif font-bold mt-3 leading-snug !text-white drop-shadow-sm">
              <span className="text-white">Pendampingan</span><br />
              <span className="text-white">Madrasah Piloting</span><br />
              <span className="text-gold-300">Kurikulum Berbasis Cinta</span>
            </h1>
            <p className="text-sm text-slate-200 mt-4 leading-relaxed">
              Sistem pendampingan, monitoring, penilaian, dan pelaporan implementasi KBC
              untuk madrasah piloting binaan Pokjawas Kemenag Kabupaten Jember.
            </p>
          </div>
          <div className="relative space-y-2 text-sm text-slate-100">
            <p className="text-toska-200 font-semibold">5 Aspek Penilaian</p>
            <ul className="space-y-1 text-xs">
              <li>· Perencanaan Implementasi KBC</li>
              <li>· Pelaksanaan Pembelajaran Berbasis Cinta</li>
              <li>· Budaya Madrasah Berbasis Cinta</li>
              <li>· Panca Cinta KBC</li>
              <li>· Evaluasi dan Tindak Lanjut</li>
            </ul>
          </div>
        </div>

        {/* Right form */}
        <div className="p-8 sm:p-10 lg:col-span-3">
          <div className="flex items-center gap-3 mb-6">
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt="logo" className="w-12 h-12 rounded" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-toska-500 to-navy-700 flex items-center justify-center text-white font-bold">
                KBC
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Selamat datang di</p>
              <p className="text-base font-semibold text-navy-900 leading-tight">
                Aplikasi Pendampingan KBC<br />
                <span className="text-xs font-normal text-slate-500">{settings.subInstansi}</span>
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-navy-900">Masuk ke Aplikasi</h2>
          <p className="text-sm text-slate-500 mb-6">Gunakan akun yang diberikan admin Pokjawas.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">{SUPABASE_ENABLED ? 'Email' : 'Username'}</label>
              <input
                className="input"
                type={SUPABASE_ENABLED ? 'email' : 'text'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete={SUPABASE_ENABLED ? 'email' : 'username'}
                placeholder={SUPABASE_ENABLED ? 'nama@email.com' : 'contoh: admin'}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          {!SUPABASE_ENABLED && (
            <div className="mt-7">
              <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-2">Akun Demo</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO.map((d) => (
                  <button
                    key={d.user}
                    type="button"
                    onClick={() => fillDemo(d.user, d.pass)}
                    className="text-left rounded-lg border border-slate-200 hover:border-toska-400 hover:bg-toska-50 px-3 py-2 transition"
                  >
                    <p className="text-xs text-slate-500">{d.role}</p>
                    <p className="text-sm font-mono text-navy-900">{d.user} / {d.pass}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {SUPABASE_ENABLED && (
            <p className="text-xs text-slate-500 mt-6">
              Akun terhubung ke Supabase Auth. Jika belum punya akun, hubungi admin Pokjawas untuk diundang.
            </p>
          )}

          {/* License section */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            {isTrial ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎁</span>
                  <p className="text-sm font-semibold text-amber-800">Trial Aktif — {daysLeft} hari tersisa</p>
                </div>
                <p className="text-xs text-amber-600 mb-3">
                  Ingin akses penuh tanpa batas? Masukkan kode aktivasi yang sudah dibeli.
                </p>
                {!showActivation ? (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowActivation(true)}
                      className="text-xs px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 font-medium"
                    >
                      🔑 Upgrade ke Full
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLicense}
                      className="text-xs px-3 py-1.5 rounded bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                    >
                      Hapus Lisensi
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleActivation} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        className="input text-xs py-1.5 flex-1 font-mono uppercase tracking-wider"
                        placeholder="KBC-XXXX-XXXX"
                        value={activationCode}
                        onChange={(e) => { setActivationCode(e.target.value.toUpperCase()); setActivationError('') }}
                        autoFocus
                        autoComplete="off"
                      />
                      <button type="submit" className="btn-primary text-xs px-3 py-1.5" disabled={activationLoading}>
                        {activationLoading ? '…' : 'Aktivasi'}
                      </button>
                    </div>
                    {activationError && (
                      <p className="text-xs text-rose-600">{activationError}</p>
                    )}
                  </form>
                )}
              </div>
            ) : licenseExpired ? (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-rose-700 mb-1">Trial Sudah Berakhir ⏰</p>
                <p className="text-xs text-rose-600 mb-3">
                  Masa trial Anda telah habis. Beli kode aktivasi untuk melanjutkan.
                </p>
                {!showActivation ? (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowActivation(true)}
                      className="text-xs px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 font-medium"
                    >
                      🔑 Beli & Aktivasi
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLicense}
                      className="text-xs px-3 py-1.5 rounded bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                    >
                      Hapus Lisensi
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleActivation} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        className="input text-xs py-1.5 flex-1 font-mono uppercase tracking-wider"
                        placeholder="KBC-XXXX-XXXX"
                        value={activationCode}
                        onChange={(e) => { setActivationCode(e.target.value.toUpperCase()); setActivationError('') }}
                        autoFocus
                        autoComplete="off"
                      />
                      <button type="submit" className="btn-primary text-xs px-3 py-1.5" disabled={activationLoading}>
                        {activationLoading ? '…' : 'Aktivasi'}
                      </button>
                    </div>
                    {activationError && (
                      <p className="text-xs text-rose-600">{activationError}</p>
                    )}
                  </form>
                )}
              </div>
            ) : license ? (
              <div className="bg-toska-50 border border-toska-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <p className="text-xs text-toska-800">
                    <span className="font-medium">Lisensi Pro Aktif</span> — akses penuh
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearLicense}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-xs text-slate-500">
                  Aplikasi memerlukan lisensi untuk digunakan.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={handleTrial}
                    className="text-sm px-4 py-2 rounded-lg border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-medium"
                  >
                    🎁 Coba Gratis 5 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowActivation(true)}
                    className="text-sm px-4 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 font-medium"
                  >
                    🔑 Aktivasi
                  </button>
                </div>
                {showActivation && (
                  <form onSubmit={handleActivation} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        className="input text-xs py-2 flex-1 font-mono uppercase tracking-wider text-center"
                        placeholder="KBC-XXXX-XXXX"
                        value={activationCode}
                        onChange={(e) => { setActivationCode(e.target.value.toUpperCase()); setActivationError('') }}
                        autoFocus
                        autoComplete="off"
                      />
                      <button type="submit" className="btn-primary text-sm px-4" disabled={activationLoading}>
                        {activationLoading ? '…' : 'Aktivasi'}
                      </button>
                    </div>
                    {activationError && (
                      <p className="text-xs text-rose-600">{activationError}</p>
                    )}
                  </form>
                )}
                <p className="text-[10px] text-slate-400">
                  Belum punya kode?{' '}
                  <a href="https://wa.me/6282330647698" target="_blank" rel="noreferrer" className="text-toska-700 hover:underline">
                    Hubungi Admin
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
