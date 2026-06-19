import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import AppLayout from './components/AppLayout.jsx'
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

function PrivateRoute({ children, allowed }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowed && !allowed.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  return (
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
                    <PrivateRoute allowed={['admin']}>
                      <PengaturanPage />
                    </PrivateRoute>
                  }
                />
                <Route path="/diagnostic" element={<DiagnosticPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  )
}
