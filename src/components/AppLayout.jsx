import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { ROLE_LABELS, ROLES } from '../lib/constants.js'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '🏠', roles: ['admin', 'pengawas', 'kepala', 'viewer'] },
  { to: '/madrasah', label: 'Madrasah Piloting', icon: '🏫', roles: ['admin', 'pengawas', 'kepala', 'viewer'] },
  { to: '/pengawas', label: 'Pengawas Pendamping', icon: '🧑‍🏫', roles: ['admin', 'pengawas', 'viewer'] },
  { to: '/jadwal', label: 'Jadwal Pendampingan', icon: '🗓️', roles: ['admin', 'pengawas', 'kepala', 'viewer'] },
  { to: '/instrumen', label: 'Instrumen KBC', icon: '📋', roles: ['admin', 'pengawas', 'viewer'] },
  { to: '/pendampingan', label: 'Hasil Pendampingan', icon: '📝', roles: ['admin', 'pengawas', 'kepala', 'viewer'] },
  { to: '/eviden', label: 'Eviden / Bukti', icon: '📎', roles: ['admin', 'pengawas', 'kepala', 'viewer'] },
  { to: '/tindak-lanjut', label: 'Rekomendasi & TL', icon: '✅', roles: ['admin', 'pengawas', 'kepala', 'viewer'] },
  { to: '/laporan', label: 'Laporan', icon: '📊', roles: ['admin', 'pengawas', 'kepala', 'viewer'] },
  { to: '/pengaturan', label: 'Pengaturan', icon: '⚙️', roles: ['admin'] }
]

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const { state } = useData()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const items = NAV_ITEMS.filter((it) => it.roles.includes(user?.role))
  const settings = state.settings

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-navy-950 text-white sticky top-0 h-screen no-print">
        <Brand settings={settings} />
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((it) => (
            <SidebarItem key={it.to} {...it} />
          ))}
        </nav>
        <UserBlock user={user} onLogout={onLogout} />
      </aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 no-print">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-navy-950 text-white flex flex-col">
            <Brand settings={settings} />
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {items.map((it) => (
                <SidebarItem key={it.to} {...it} onClick={() => setOpen(false)} />
              ))}
            </nav>
            <UserBlock user={user} onLogout={onLogout} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="topbar lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-4 py-3 no-print">
          <button
            onClick={() => setOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100"
            aria-label="Buka menu"
          >
            <Hamburger />
          </button>
          <div className="flex items-center gap-2">
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt="logo" className="w-8 h-8 rounded" />
            ) : (
              <div className="w-8 h-8 rounded bg-navy-900 text-white flex items-center justify-center text-xs font-semibold">KBC</div>
            )}
            <div className="leading-tight">
              <p className="text-xs font-semibold text-navy-900">KBC Pendampingan</p>
              <p className="text-[10px] text-slate-500">Pokjawas Jember</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg hover:bg-slate-100 text-sm" aria-label="Keluar">↩</button>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>

        <footer className="text-center text-xs text-slate-400 py-6 no-print">
          © {new Date().getFullYear()} {settings.namaInstansi} · {settings.subInstansi}
        </footer>
      </div>
    </div>
  )
}

function Brand({ settings }) {
  return (
    <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
      {settings.logoDataUrl ? (
        <img src={settings.logoDataUrl} alt="logo" className="w-11 h-11 rounded-lg bg-white object-contain" />
      ) : (
        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-toska-500 to-navy-700 flex items-center justify-center text-white font-bold">
          KBC
        </div>
      )}
      <div className="leading-tight">
        <p className="text-[11px] uppercase tracking-wider text-toska-200">Pendampingan Piloting</p>
        <p className="text-base font-serif font-semibold">Kurikulum Berbasis Cinta</p>
        <p className="text-[11px] text-slate-300 mt-0.5">{settings.subInstansi}</p>
      </div>
    </div>
  )
}

function SidebarItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
          isActive
            ? 'bg-toska-500/20 text-white ring-1 ring-toska-400/40 font-medium'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <span className="text-base w-5 text-center">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

function UserBlock({ user, onLogout }) {
  if (!user) return null
  return (
    <div className="px-4 py-4 border-t border-white/10">
      <p className="text-[11px] uppercase tracking-wider text-toska-200 mb-1">Masuk sebagai</p>
      <p className="text-sm font-semibold leading-snug">{user.nama}</p>
      <p className="text-xs text-slate-300">{ROLE_LABELS[user.role] || user.role}</p>
      <button
        onClick={onLogout}
        className="mt-3 w-full text-sm text-white/90 bg-white/10 hover:bg-white/15 rounded-lg py-1.5"
      >
        Keluar
      </button>
    </div>
  )
}

function Hamburger() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
