import { useState, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import AppLayout from './components/AppLayout.jsx'
import ActivationPage from './components/ActivationPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import MadrasahPage from './pages/MadrasahPage.jsx'
import PengawasPage from './pages/PengawasPage.jsx'
import JadwalPage from './pages/JadwalPage.jsx'
import InstrumenPage from './pages/InstrumenPage.jsx'
import PendampinganPage from './pages/PendampinganPage.jsx'
import EvidenPage from './pages/EvidenPage.jsx'
import TindakLanjutPage from './pages/TindakLanjutPage.jsx'
import LaporanPage from './pages/LaporanPage.jsx'
import PengaturanPage from './pages/PengaturanPage.jsx'
import DiagnosticPage from './pages/DiagnosticPage.jsx'
import PenggunaPage from './pages/PenggunaPage.jsx'
import LisensiPage from './pages/LisensiPage.jsx'
import PembelianPage from './pages/PembelianPage.jsx'
import KodeAktivasiPage from './pages/KodeAktivasiPage.jsx'
import { getStoredLicense, saveLicense } from './lib/codes.js'
import { SUPABASE_ENABLED, supabase } from './lib/supabase.js'
import { LOCAL_ONLY_MODE } from './lib/appMode.js'

// --- Gate: cek lisensi dari localStorage, redirect ke halaman aktivasi kalau belum ---
function ActivationGate({ children }) {
  const [ok, setOk] = useState(false)
  const [check, setCheck] = useState(false)

  useEffect(() => {
    const lic = getStoredLicense()
    if (lic) { setOk(true); setCheck(true); return }

    // Mode lokal: tidak perlu cek Supabase auth — langsung tampilkan halaman aktivasi
    if (LOCAL_ONLY_MODE) {
      setCheck(true)
      return
    }

    // Bypass mode multi-tenant: kalau ada session Supabase valid (user sudah login), auto-aktivasi.
    if (SUPABASE_ENABLED) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (data?.session?.user) {
          const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', data.session.user.id).maybeSingle()
          saveLicense(profile?.role === 'admin' ? 'ADMIN-BYPASS' : 'AUTH-BYPASS', 'pro', { via: 'auth-bypass' })
          setOk(true)
          setCheck(true)
          return
        }
        setCheck(true)
      }).catch(() => setCheck(true))
    } else {
      setCheck(true)
    }
  }, [])

  const onActivated = (lic) => {
    saveLicense(lic.code, lic.tier, lic.deviceInfo)
    setOk(true)
  }

  if (!check) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800">
        <p className="text-white/60 text-sm animate-pulse">Memeriksa lisensi…</p>
      </div>
    )
  }
  if (!ok) return <ActivationPage onActivated={onActivated} />
  return children
}

// --- Route guard ---
function PrivateRoute({ children, allowed }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowed && !allowed.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <ActivationGate>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/madrasah" element={<MadrasahPage />} />
                  <Route
                    path="/pengawas"
                    element={
                      <PrivateRoute allowed={['admin', 'pengawas', 'viewer']}>
                        <PengawasPage />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/jadwal" element={<JadwalPage />} />
                  <Route
                    path="/instrumen"
                    element={
                      <PrivateRoute allowed={['admin', 'pengawas', 'viewer']}>
                        <InstrumenPage />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/pendampingan" element={<PendampinganPage />} />
                  <Route path="/eviden" element={<EvidenPage />} />
                  <Route path="/tindak-lanjut" element={<TindakLanjutPage />} />
                  <Route path="/laporan" element={<LaporanPage />} />
                  <Route
                    path="/pengaturan"
                    element={
                      <PrivateRoute allowed={['admin', 'pengawas']}>
                        <PengaturanPage />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/diagnostic" element={<DiagnosticPage />} />
                  <Route
                    path="/pengguna"
                    element={
                      <PrivateRoute allowed={['admin']}>
                        <PenggunaPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/lisensi"
                    element={
                      <PrivateRoute allowed={['admin']}>
                        <LisensiPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/kode-aktivasi"
                    element={
                      <PrivateRoute allowed={['admin']}>
                        <KodeAktivasiPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/pembelian"
                    element={
                      <PrivateRoute allowed={['admin']}>
                        <PembelianPage />
                      </PrivateRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </ActivationGate>
  )
}