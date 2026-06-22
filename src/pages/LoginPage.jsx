import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { SUPABASE_ENABLED } from '../lib/supabase.js'
import {
  getStoredLicense, saveLicense, validateCode, fetchRemoteCodes,
  saveLocalCodes, tryLoadLocalCodes, clearLicense
} from '../lib/codes.js'
import { registerWithEmailAndCode, activateAndRegister, MASTER_CODE } from '../lib/activation.js'
import PembelianModal from '../components/PembelianModal.jsx'

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

  // Mode form: 'login' | 'register' (Supabase only)
  const [mode, setMode] = useState('login')

  // ---- Login state ----
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // ---- Register state (Supabase mode) ----
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPassword2, setRegPassword2] = useState('')
  const [regNama, setRegNama] = useState('')
  const [regCode, setRegCode] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  // ---- Aktivasi lisensi (manual, untuk semua mode) ----
  const [activationCode, setActivationCode] = useState('')
  const [activationError, setActivationError] = useState('')
  const [activationLoading, setActivationLoading] = useState(false)
  const [showActivation, setShowActivation] = useState(false)

  // ---- Modal Beli Lisensi FULL ----
  const [showPembelian, setShowPembelian] = useState(false)

  const license = getStoredLicense()
  const licenseExpired = license?.tier === 'demo' && license.expiresAt && Date.now() > license.expiresAt
  const isTrial = license?.tier === 'demo' && !licenseExpired
  const daysLeft = isTrial && license.expiresAt
    ? Math.max(0, Math.ceil((license.expiresAt - Date.now()) / 86400000))
    : 0

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

  // ---- Daftar akun baru (Supabase mode, gaya e-RHK) ----
  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError('')

    if (regPassword !== regPassword2) {
      setRegError('Konfirmasi password tidak cocok')
      return
    }
    if (regPassword.length < 6) {
      setRegError('Password minimal 6 karakter')
      return
    }

    setRegLoading(true)
    try {
      const result = await registerWithEmailAndCode({
        email: regEmail,
        password: regPassword,
        nama: regNama,
        code: regCode
      })
      if (!result.ok) {
        setRegError(result.error || 'Pendaftaran gagal')
        setRegLoading(false)
        return
      }
      // Simpan lisensi sudah dilakukan di registerWithEmailAndCode
      if (result.mode === 'pending_confirmation') {
        toast.success(result.message || 'Akun dibuat. Cek email untuk konfirmasi.')
        setMode('login')
        setUsername(result.email || regEmail)
        setRegEmail(''); setRegPassword(''); setRegPassword2(''); setRegNama(''); setRegCode('')
        setRegLoading(false)
        return
      }
      toast.success(result.message || 'Pendaftaran berhasil!')
      // Auto-login: AuthContext sudah subscribe onAuthStateChange,
      // user otomatis ter-set. Redirect ke dashboard.
      navigate('/', { replace: true })
    } catch (err) {
      setRegError('Gagal: ' + (err.message || 'Coba lagi'))
    } finally {
      setRegLoading(false)
    }
  }

  // ---- Aktivasi lisensi manual (footer, untuk semua mode) ----
  const handleManualActivation = async (e) => {
    e.preventDefault()
    const clean = String(activationCode).trim().toUpperCase()
    if (!clean) {
      setActivationError('Masukkan kode aktivasi')
      return
    }
    setActivationLoading(true)
    setActivationError('')

    try {
      if (SUPABASE_ENABLED) {
        // Mode Supabase: master code only (registrasi user pakai form Daftar)
        if (clean === MASTER_CODE) {
          saveLicense(clean, 'pro', { via: 'master' })
          toast.success('Master code diterima — akses penuh')
          setActivationCode(''); setShowActivation(false)
          window.location.reload()
          return
        }
        setActivationError('Untuk akun baru, silakan pakai menu Daftar Akun. Tombol ini hanya untuk master code lisensi.')
      } else {
        // Mode lokal: kode aktivasi = lisensi
        let bundledCodes = tryLoadLocalCodes()
        try {
          const remote = await fetchRemoteCodes()
          if (Array.isArray(remote)) { bundledCodes = remote; saveLocalCodes(remote) }
        } catch {}
        const result = validateCode(clean, bundledCodes)
        if (!result.valid) {
          setActivationError(result.error || 'Kode aktivasi tidak valid')
          return
        }
        saveLicense(clean, result.tier)
        toast.success('Aktivasi berhasil! Silakan login.')
        setActivationCode(''); setShowActivation(false)
        window.location.reload()
      }
    } catch (err) {
      setActivationError('Gagal: ' + (err.message || 'Coba lagi'))
    } finally {
      setActivationLoading(false)
    }
  }

  const handleTrial = () => {
    saveLicense('TRIAL-AUTO', 'demo', {})
    toast.success('Trial 5 hari diaktifkan! Silakan login.')
    window.location.reload()
  }

  const handleClearLicense = () => {
    if (confirm('Hapus lisensi & trial state yang tersimpan? Aplikasi akan reload.')) {
      clearLicense()
      try {
        localStorage.removeItem('kbc_trial_user_v1')
        localStorage.removeItem('kbc_auth_v1')
      } catch {}
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

          {/* ---- Mode: Daftar (Supabase) ---- */}
          {SUPABASE_ENABLED && mode === 'register' && (
            <>
              <h2 className="text-xl font-semibold text-navy-900">Daftar Akun Baru</h2>
              <p className="text-sm text-slate-500 mb-5">
                Masukkan email, password, dan kode aktivasi dari admin Pokjawas.
              </p>

              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="label">Nama Lengkap</label>
                  <input
                    className="input"
                    value={regNama}
                    onChange={(e) => setRegNama(e.target.value)}
                    placeholder="Contoh: Subariyanto, S.Pd, M.Pd.I"
                    autoComplete="name"
                    required
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Password</label>
                    <input
                      className="input"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 karakter"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Ulangi Password</label>
                    <input
                      className="input"
                      type="password"
                      value={regPassword2}
                      onChange={(e) => setRegPassword2(e.target.value)}
                      placeholder="Konfirmasi"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Kode Aktivasi</label>
                  <input
                    className="input text-center font-mono uppercase tracking-widest"
                    value={regCode}
                    onChange={(e) => setRegCode(e.target.value.toUpperCase())}
                    placeholder="KBC-XXXX-XXXX"
                    autoComplete="off"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Kode dari admin Pokjawas menentukan role akun (admin/pengawas/kepala/viewer).
                  </p>
                </div>
                {regError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <p className="text-sm text-rose-700">{regError}</p>
                  </div>
                )}
                <button
                  type="submit"
                  className="btn-primary w-full justify-center text-base py-2.5"
                  disabled={regLoading}
                >
                  {regLoading ? 'Memproses…' : '📝 Daftar & Masuk'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setRegError('') }}
                  className="text-sm text-toska-700 hover:underline"
                >
                  ← Sudah punya akun? Masuk di sini
                </button>
              </div>
            </>
          )}

          {/* ---- Mode: Login ---- */}
          {mode === 'login' && (
            <>
              <h2 className="text-xl font-semibold text-navy-900">Masuk ke Aplikasi</h2>
              <p className="text-sm text-slate-500 mb-6">
                {SUPABASE_ENABLED
                  ? 'Gunakan email & password yang Bapak/Ibu daftarkan.'
                  : 'Gunakan akun yang diberikan admin Pokjawas.'}
              </p>

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

              {/* Tombol Daftar — mode Supabase */}
              {SUPABASE_ENABLED && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setRegError('') }}
                    className="btn-primary w-full justify-center bg-toska-600 hover:bg-toska-700"
                  >
                    📝 Daftar Akun Baru
                  </button>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Belum punya akun? Daftar dengan kode aktivasi dari admin.
                  </p>
                </div>
              )}

              {/* Akun Demo — mode lokal */}
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
            </>
          )}

          {/* Lisensi & Aktivasi Manual */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            {/* Status lisensi saat ini */}
            {isTrial && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <span>🎁</span>
                  <p className="text-xs font-semibold text-amber-800">
                    Trial Aktif — {daysLeft} hari tersisa
                  </p>
                </div>
              </div>
            )}
            {licenseExpired && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-3">
                <p className="text-xs font-semibold text-rose-700">Trial Sudah Berakhir ⏰</p>
              </div>
            )}
            {license && !isTrial && !licenseExpired && (
              <div className="hidden">
                {/* Lisensi Pro badge dihapus dari login page — sudah cukup ditampilkan di dashboard */}
              </div>
            )}

            {/* Form aktivasi kode lisensi (manual) — tersedia di semua mode */}
            <p className="text-xs text-slate-500 mb-2 text-center">
              {isTrial
                ? 'Upgrade ke akses penuh dengan kode aktivasi'
                : (!license || licenseExpired)
                  ? 'Aplikasi memerlukan lisensi untuk digunakan.'
                  : ''}
            </p>

            <div className="flex gap-2 justify-center mb-2">
              {(!license || isTrial || licenseExpired) && (
                <button
                  type="button"
                  onClick={handleTrial}
                  className="text-sm px-4 py-2 rounded-lg border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-medium"
                >
                  🎁 Coba Gratis 5 Hari
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPembelian(true)}
                className="text-sm px-4 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 font-medium"
              >
                💳 Beli Lisensi FULL
              </button>
            </div>

            {showActivation && (
              <form onSubmit={handleManualActivation} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    className="input text-sm py-2 flex-1 font-mono uppercase tracking-wider text-center"
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
                  <p className="text-xs text-rose-600 text-center">{activationError}</p>
                )}
              </form>
            )}

            <p className="text-[10px] text-slate-400 text-center">
              Belum punya kode?{' '}
              <a href="https://wa.me/6282330647698" target="_blank" rel="noreferrer" className="text-toska-700 hover:underline">
                Hubungi Admin
              </a>
            </p>

            {/* Reset state — kalau login nyangkut karena trial state lama */}
            <p className="text-[10px] text-slate-400 text-center mt-1">
              Login bermasalah?{' '}
              <button
                type="button"
                onClick={handleClearLicense}
                className="text-rose-600 hover:underline"
              >
                Reset lisensi & trial state
              </button>
            </p>
          </div>
        </div>
      </div>

      <PembelianModal open={showPembelian} onClose={() => setShowPembelian(false)} />
    </div>
  )
}
