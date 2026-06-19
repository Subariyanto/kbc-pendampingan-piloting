import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import BarChart from '../components/BarChart.jsx'
import RadarChart from '../components/RadarChart.jsx'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useScope } from '../lib/useScope.js'
import { rataRataMadrasah, rekapAspekGlobal } from '../lib/scoring.js'
import { formatDate, statusMadrasahByPct, STATUS_MADRASAH_TONES } from '../lib/utils.js'

export default function DashboardPage() {
  const { user } = useAuth()
  const { state } = useData()
  const scope = useScope()

  const stats = useMemo(() => {
    const totalMadrasah = scope.madrasah.length
    const pendampingan = scope.pendampingan
    const selesai = scope.jadwal.filter((j) => j.status === 'Selesai' || j.status === 'Terlaksana').length
    const berjalan = scope.jadwal.filter((j) => j.status === 'Terjadwal' || j.status === 'Ditunda').length
    const rekomTL = scope.tindakLanjut.length
    const ringkas = rataRataMadrasah(pendampingan, state.instrumen)
    return {
      totalMadrasah,
      pendampinganTotal: pendampingan.length,
      selesai,
      berjalan,
      rekomTL,
      kesiapanPct: ringkas.pct
    }
  }, [scope, state.instrumen])

  const perMadrasah = useMemo(() => {
    return scope.madrasah.map((m) => {
      const list = scope.pendampingan.filter((p) => p.madrasahId === m.id)
      const ringkas = rataRataMadrasah(list, state.instrumen)
      const status = statusMadrasahByPct(ringkas.pct, list.length > 0)
      return {
        id: m.id,
        nama: m.nama,
        jenjang: m.jenjang,
        kecamatan: m.kecamatan,
        pct: ringkas.pct,
        status,
        count: list.length
      }
    })
  }, [scope, state.instrumen])

  const aspekRekap = useMemo(() => rekapAspekGlobal(scope.pendampingan, state.instrumen), [scope.pendampingan, state.instrumen])

  const pendampinganTerbaru = useMemo(() => {
    return [...scope.pendampingan]
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .slice(0, 6)
      .map((p) => ({
        ...p,
        madrasah: scope.madrasah.find((m) => m.id === p.madrasahId)?.nama ?? '-',
        pengawas: state.pengawas.find((g) => g.id === p.pengawasId)?.nama ?? '-'
      }))
  }, [scope, state.pengawas])

  return (
    <>
      <PageHeader
        title={`Selamat datang, ${user?.nama || ''}`}
        description="Ringkasan progres pendampingan madrasah piloting Kurikulum Berbasis Cinta."
        icon="📊"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🏫" label="Madrasah Piloting" value={stats.totalMadrasah} hint="Madrasah aktif binaan" tone="navy" />
        <StatCard icon="✅" label="Pendampingan Selesai" value={stats.selesai} hint="Termasuk yang terlaksana" tone="emerald" />
        <StatCard icon="🟡" label="Pendampingan Berjalan" value={stats.berjalan} hint="Terjadwal & ditunda" tone="gold" />
        <StatCard icon="🔁" label="Rekomendasi Tindak Lanjut" value={stats.rekomTL} hint="Total rekomendasi" tone="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card-pad lg:col-span-1">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Persentase Kesiapan KBC</p>
          <p className="text-4xl font-semibold text-navy-900">{stats.kesiapanPct.toFixed(1)}%</p>
          <p className="text-sm text-slate-500 mt-1">
            Rata-rata capaian {stats.pendampinganTotal} pendampingan tercatat.
          </p>
          <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-toska-500 to-emerald-500"
              style={{ width: `${stats.kesiapanPct}%` }}
            />
          </div>
        </div>
        <div className="card-pad lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-navy-900">Progres KBC per Madrasah</p>
            <Link to="/madrasah" className="text-xs text-toska-700 hover:underline">Lihat semua</Link>
          </div>
          {perMadrasah.length ? (
            <BarChart
              data={perMadrasah.map((m) => ({ label: m.nama, value: m.pct, color: '#264071' }))}
              height={Math.max(180, perMadrasah.length * 28)}
            />
          ) : (
            <EmptyState icon="📭" title="Belum ada data" description="Tambahkan madrasah piloting untuk mulai." />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card-pad lg:col-span-1">
          <p className="font-semibold text-navy-900 mb-2">Rekap Capaian Aspek KBC</p>
          <RadarChart data={aspekRekap.map((a) => ({ label: a.kode, value: a.pct }))} />
          <ul className="mt-3 text-xs text-slate-600 space-y-1">
            {aspekRekap.map((a) => (
              <li key={a.kode} className="flex items-center justify-between">
                <span>{a.kode}. {a.nama}</span>
                <span className="font-semibold text-navy-900">{a.pct.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-pad lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-navy-900">Status Madrasah</p>
          </div>
          {perMadrasah.length ? (
            <div className="overflow-x-auto">
              <table className="table-clean">
                <thead>
                  <tr>
                    <th>Madrasah</th>
                    <th>Jenjang</th>
                    <th>Kecamatan</th>
                    <th>Pendampingan</th>
                    <th>Capaian</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {perMadrasah.map((m) => (
                    <tr key={m.id}>
                      <td className="font-medium text-navy-900">{m.nama}</td>
                      <td>{m.jenjang}</td>
                      <td>{m.kecamatan}</td>
                      <td>{m.count}</td>
                      <td>{m.pct.toFixed(1)}%</td>
                      <td><Badge tone={STATUS_MADRASAH_TONES[m.status]}>{m.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Belum ada data madrasah" />
          )}
        </div>
      </div>

      <div className="card-pad">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-navy-900">Pendampingan Terbaru</p>
          <Link to="/pendampingan" className="text-xs text-toska-700 hover:underline">Lihat semua</Link>
        </div>
        {pendampinganTerbaru.length ? (
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Madrasah</th>
                  <th>Kegiatan</th>
                  <th>Pengawas</th>
                  <th>Tindak Lanjut</th>
                </tr>
              </thead>
              <tbody>
                {pendampinganTerbaru.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.tanggal)}</td>
                    <td className="font-medium text-navy-900">{p.madrasah}</td>
                    <td>{p.kegiatan}</td>
                    <td>{p.pengawas}</td>
                    <td><Badge tone="gold">{p.statusTL}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Belum ada pendampingan tercatat" />
        )}
      </div>
    </>
  )
}
