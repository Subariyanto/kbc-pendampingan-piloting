import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useData } from '../context/DataContext.jsx'

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

  const submit = (e) => {
    e.preventDefault()
    setLoading(true)
    const res = login(username.trim(), password)
    setLoading(false)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success(`Selamat datang, ${res.user.nama}`)
    navigate('/', { replace: true })
  }

  const fillDemo = (u, p) => {
    setUsername(u)
    setPassword(p)
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
              <label className="label">Username</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="contoh: admin"
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
        </div>
      </div>
    </div>
  )
}
