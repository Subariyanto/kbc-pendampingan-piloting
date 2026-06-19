import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PrintHeader, { PrintSignature } from '../components/PrintHeader.jsx'
import BarChart from '../components/BarChart.jsx'
import RadarChart from '../components/RadarChart.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useScope } from '../lib/useScope.js'
import { JENJANG_OPTIONS, STATUS_TINDAK_LANJUT } from '../lib/constants.js'
import {
  downloadCSV, formatDate, formatDateLong, statusMadrasahByPct, STATUS_MADRASAH_TONES, STATUS_TINDAK_LANJUT_TONES, kategoriKBC
} from '../lib/utils.js'
import { rataRataMadrasah, rekapAspekGlobal, summarizeSkor } from '../lib/scoring.js'

const LAPORAN_OPTIONS = [
  { value: 'rekap', label: 'Rekap Semua Madrasah' },
  { value: 'capaian', label: 'Capaian Implementasi KBC' },
  { value: 'madrasah', label: 'Per Madrasah' },
  { value: 'pengawas', label: 'Per Pengawas' },
  { value: 'tindak', label: 'Tindak Lanjut' },
  { value: 'eviden', label: 'Eviden Kegiatan' }
]

export default function LaporanPage() {
  const { state } = useData()
  const toast = useToast()
  const scope = useScope()
  const [jenis, setJenis] = useState('rekap')
  const [tglMulai, setTglMulai] = useState('')
  const [tglAkhir, setTglAkhir] = useState('')
  const [filterJenjang, setFilterJenjang] = useState('')
  const [filterKec, setFilterKec] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMadrasah, setFilterMadrasah] = useState('')
  const [filterPengawas, setFilterPengawas] = useState('')

  const kecamatanOpts = useMemo(() => Array.from(new Set(state.madrasah.map((m) => m.kecamatan).filter(Boolean))), [state.madrasah])

  const filterByDate = (tanggal) => {
    if (!tanggal) return true
    const t = new Date(tanggal).getTime()
    if (tglMulai && t < new Date(tglMulai).getTime()) return false
    if (tglAkhir && t > new Date(tglAkhir).getTime() + 24 * 60 * 60 * 1000 - 1) return false
    return true
  }

  const filteredMadrasah = useMemo(() => {
    return scope.madrasah
      .filter((m) => !filterJenjang || m.jenjang === filterJenjang)
      .filter((m) => !filterKec || m.kecamatan === filterKec)
      .filter((m) => !filterMadrasah || m.id === filterMadrasah)
  }, [scope.madrasah, filterJenjang, filterKec, filterMadrasah])

  const madrasahIds = useMemo(() => filteredMadrasah.map((m) => m.id), [filteredMadrasah])

  const filteredPendampingan = useMemo(() => {
    return scope.pendampingan
      .filter((p) => madrasahIds.includes(p.madrasahId))
      .filter((p) => !filterPengawas || p.pengawasId === filterPengawas)
      .filter((p) => filterByDate(p.tanggal))
  }, [scope.pendampingan, madrasahIds, filterPengawas, tglMulai, tglAkhir])

  const filteredTL = useMemo(() => {
    return scope.tindakLanjut
      .filter((t) => madrasahIds.includes(t.madrasahId))
      .filter((t) => !filterStatus || t.status === filterStatus)
      .filter((t) => filterByDate(t.batas))
  }, [scope.tindakLanjut, madrasahIds, filterStatus, tglMulai, tglAkhir])

  const filteredEviden = useMemo(() => {
    return scope.eviden
      .filter((e) => madrasahIds.includes(e.madrasahId))
      .filter((e) => filterByDate(e.tanggal))
  }, [scope.eviden, madrasahIds, tglMulai, tglAkhir])

  const rekapPerMadrasah = useMemo(() => {
    return filteredMadrasah.map((m) => {
      const list = filteredPendampingan.filter((p) => p.madrasahId === m.id)
      const ringkas = rataRataMadrasah(list, state.instrumen)
      const status = statusMadrasahByPct(ringkas.pct, list.length > 0)
      const pengawas = state.pengawas.find((p) => p.id === m.pengawasId)?.nama ?? '-'
      return { ...m, pendampingan: list.length, capaian: ringkas.pct, statusKBC: status, pengawas }
    })
  }, [filteredMadrasah, filteredPendampingan, state.instrumen, state.pengawas])

  const rekapAspek = useMemo(() => rekapAspekGlobal(filteredPendampingan, state.instrumen), [filteredPendampingan, state.instrumen])

  const rekapPerPengawas = useMemo(() => {
    return state.pengawas
      .filter((p) => scope.pengawasIds.length === 0 || scope.role === 'admin' || scope.role === 'viewer' || scope.pengawasIds.includes(p.id))
      .map((p) => {
        const madrasahP = filteredMadrasah.filter((m) => m.pengawasId === p.id)
        const list = filteredPendampingan.filter((x) => x.pengawasId === p.id)
        const ringkas = rataRataMadrasah(list, state.instrumen)
        return {
          ...p,
          madrasahCount: madrasahP.length,
          pendampingan: list.length,
          capaian: ringkas.pct,
          kategori: ringkas.kategori
        }
      })
  }, [state.pengawas, scope, filteredMadrasah, filteredPendampingan, state.instrumen])

  const exportCSV = () => {
    let rows = []
    let filename = ''
    if (jenis === 'rekap' || jenis === 'capaian' || jenis === 'madrasah') {
      filename = `rekap-madrasah-${Date.now()}.csv`
      rows = rekapPerMadrasah.map((m) => ({
        Madrasah: m.nama, Jenjang: m.jenjang, Kecamatan: m.kecamatan, Pengawas: m.pengawas,
        'Jumlah Pendampingan': m.pendampingan, 'Capaian (%)': m.capaian.toFixed(1), 'Status KBC': m.statusKBC
      }))
    } else if (jenis === 'pengawas') {
      filename = `rekap-pengawas-${Date.now()}.csv`
      rows = rekapPerPengawas.map((p) => ({
        Pengawas: p.nama, NIP: p.nip, Wilayah: p.wilayah,
        'Jumlah Madrasah': p.madrasahCount, 'Pendampingan': p.pendampingan,
        'Rata-rata Capaian (%)': p.capaian.toFixed(1), Kategori: p.kategori.label
      }))
    } else if (jenis === 'tindak') {
      filename = `tindak-lanjut-${Date.now()}.csv`
      rows = filteredTL.map((t) => ({
        Madrasah: state.madrasah.find((m) => m.id === t.madrasahId)?.nama ?? '-',
        Temuan: t.temuan, Rekomendasi: t.rekomendasi, PJ: t.pj,
        Batas: t.batas, Status: t.status, Catatan: t.catatan
      }))
    } else if (jenis === 'eviden') {
      filename = `eviden-${Date.now()}.csv`
      rows = filteredEviden.map((e) => ({
        Madrasah: state.madrasah.find((m) => m.id === e.madrasahId)?.nama ?? '-',
        Jenis: e.jenis, Judul: e.judul, Deskripsi: e.deskripsi, Tanggal: e.tanggal, Link: e.link
      }))
    }
    if (!rows.length) { toast.warn('Tidak ada data untuk diekspor'); return }
    downloadCSV(filename, rows)
    toast.success('Data CSV diunduh')
  }

  return (
    <>
      <PageHeader
        title="Laporan"
        description="Laporan rekap implementasi KBC, tindak lanjut, dan eviden. Cetak PDF atau ekspor CSV."
        icon="📊"
        actions={
          <>
            <button className="btn-ghost" onClick={exportCSV}>⬇ Ekspor CSV</button>
            <button className="btn-primary" onClick={() => window.print()}>🖨 Cetak PDF</button>
          </>
        }
      />

      <div className="card-pad mb-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        <div className="lg:col-span-2">
          <label className="label">Jenis Laporan</label>
          <select className="input" value={jenis} onChange={(e) => setJenis(e.target.value)}>
            {LAPORAN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Dari Tanggal</label>
          <input className="input" type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} />
        </div>
        <div>
          <label className="label">Sampai Tanggal</label>
          <input className="input" type="date" value={tglAkhir} onChange={(e) => setTglAkhir(e.target.value)} />
        </div>
        <div>
          <label className="label">Jenjang</label>
          <select className="input" value={filterJenjang} onChange={(e) => setFilterJenjang(e.target.value)}>
            <option value="">Semua</option>
            {JENJANG_OPTIONS.map((j) => <option key={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Kecamatan</label>
          <select className="input" value={filterKec} onChange={(e) => setFilterKec(e.target.value)}>
            <option value="">Semua</option>
            {kecamatanOpts.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>

        {jenis === 'madrasah' && (
          <div className="lg:col-span-2">
            <label className="label">Madrasah</label>
            <select className="input" value={filterMadrasah} onChange={(e) => setFilterMadrasah(e.target.value)}>
              <option value="">Pilih madrasah</option>
              {scope.madrasah.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
            </select>
          </div>
        )}
        {jenis === 'pengawas' && (
          <div className="lg:col-span-2">
            <label className="label">Pengawas</label>
            <select className="input" value={filterPengawas} onChange={(e) => setFilterPengawas(e.target.value)}>
              <option value="">Semua pengawas</option>
              {state.pengawas.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          </div>
        )}
        {jenis === 'tindak' && (
          <div>
            <label className="label">Status TL</label>
            <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Semua</option>
              {STATUS_TINDAK_LANJUT.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="print-area bg-white rounded-xl border border-slate-200 p-6">
        <PrintHeader settings={state.settings} judul={getJudulLaporan(jenis)} />
        <div className="text-xs text-slate-500 mb-4">
          {tglMulai && <>Periode: {formatDate(tglMulai)} s.d. {formatDate(tglAkhir || new Date())}</>}
          {!tglMulai && tglAkhir && <>s.d. {formatDate(tglAkhir)}</>}
          {filterJenjang && <span className="ml-2">· Jenjang: {filterJenjang}</span>}
          {filterKec && <span className="ml-2">· Kecamatan: {filterKec}</span>}
        </div>

        {jenis === 'rekap' && <SectionRekap rekap={rekapPerMadrasah} />}
        {jenis === 'capaian' && <SectionCapaian rekap={rekapPerMadrasah} aspek={rekapAspek} />}
        {jenis === 'madrasah' && (
          <SectionPerMadrasah
            madrasah={state.madrasah.find((m) => m.id === filterMadrasah)}
            pendampingan={filteredPendampingan.filter((p) => p.madrasahId === filterMadrasah)}
            tindakLanjut={filteredTL.filter((t) => t.madrasahId === filterMadrasah)}
            instrumen={state.instrumen}
            pengawasList={state.pengawas}
          />
        )}
        {jenis === 'pengawas' && <SectionPerPengawas rekap={rekapPerPengawas} />}
        {jenis === 'tindak' && <SectionTindakLanjut data={filteredTL} madrasah={state.madrasah} />}
        {jenis === 'eviden' && <SectionEviden data={filteredEviden} madrasah={state.madrasah} />}

        <PrintSignature settings={state.settings} />
        <p className="mt-4 text-xs text-slate-500">Dicetak {formatDateLong(new Date())}</p>
      </div>
    </>
  )
}

function getJudulLaporan(jenis) {
  switch (jenis) {
    case 'rekap': return 'LAPORAN REKAP MADRASAH PILOTING IMPLEMENTASI KBC'
    case 'capaian': return 'LAPORAN CAPAIAN IMPLEMENTASI KBC'
    case 'madrasah': return 'LAPORAN PENDAMPINGAN PER MADRASAH'
    case 'pengawas': return 'LAPORAN PENDAMPINGAN PER PENGAWAS'
    case 'tindak': return 'LAPORAN TINDAK LANJUT'
    case 'eviden': return 'LAPORAN EVIDEN KEGIATAN KBC'
    default: return 'LAPORAN PENDAMPINGAN IMPLEMENTASI KBC'
  }
}

function SectionRekap({ rekap }) {
  if (!rekap.length) return <EmptyState title="Tidak ada data" />
  return (
    <table className="table-clean">
      <thead><tr><th>No</th><th>Madrasah</th><th>Jenjang</th><th>Kecamatan</th><th>Pengawas</th><th>Pendampingan</th><th>Capaian</th><th>Status</th></tr></thead>
      <tbody>
        {rekap.map((m, i) => (
          <tr key={m.id}>
            <td>{i + 1}</td><td>{m.nama}</td><td>{m.jenjang}</td><td>{m.kecamatan}</td>
            <td>{m.pengawas}</td><td>{m.pendampingan}</td><td>{m.capaian.toFixed(1)}%</td>
            <td><Badge tone={STATUS_MADRASAH_TONES[m.statusKBC]}>{m.statusKBC}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SectionCapaian({ rekap, aspek }) {
  const totalCapaian = rekap.length ? rekap.reduce((a, b) => a + b.capaian, 0) / rekap.length : 0
  const kat = kategoriKBC(totalCapaian)
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-slate-500">Rata-rata capaian seluruh madrasah</p>
          <p className="text-3xl font-semibold text-navy-900">{totalCapaian.toFixed(1)}%</p>
          <Badge tone={kat.tone} className="mt-1">{kat.label}</Badge>
          <p className="text-xs text-slate-500 mt-3 font-semibold uppercase tracking-wide">Per Madrasah</p>
          <BarChart data={rekap.map((m) => ({ label: m.nama, value: m.capaian }))} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Per Aspek</p>
          <RadarChart data={aspek.map((a) => ({ label: a.kode, value: a.pct }))} />
          <ul className="mt-2 text-xs text-slate-600 space-y-1">
            {aspek.map((a) => (
              <li key={a.kode} className="flex items-center justify-between">
                <span>{a.kode}. {a.nama}</span>
                <span className="font-semibold text-navy-900">{a.pct.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <SectionRekap rekap={rekap} />
    </>
  )
}

function SectionPerMadrasah({ madrasah, pendampingan, tindakLanjut, instrumen, pengawasList }) {
  if (!madrasah) return <EmptyState title="Pilih madrasah pada filter" />
  const ringkas = rataRataMadrasah(pendampingan, instrumen)
  const aspek = rekapAspekGlobal(pendampingan, instrumen)
  return (
    <>
      <table className="w-full mb-4 text-sm">
        <tbody>
          <Row k="Nama Madrasah" v={madrasah.nama} />
          <Row k="Jenjang / Status" v={`${madrasah.jenjang} / ${madrasah.statusNS}`} />
          <Row k="Kepala" v={madrasah.kepala} />
          <Row k="Kecamatan" v={madrasah.kecamatan} />
          <Row k="Pengawas" v={pengawasList.find((p) => p.id === madrasah.pengawasId)?.nama ?? '-'} />
        </tbody>
      </table>

      <p className="font-semibold text-navy-900 mb-2">Rekap Capaian KBC</p>
      <p className="text-2xl font-semibold text-navy-900">{ringkas.pct.toFixed(1)}% <Badge tone={ringkas.kategori.tone}>{ringkas.kategori.label}</Badge></p>
      <p className="text-xs text-slate-500 mb-3">Berdasarkan {ringkas.count ?? pendampingan.length} pendampingan.</p>
      <BarChart data={aspek.map((a) => ({ label: `${a.kode}. ${a.nama}`, value: a.pct }))} />

      <p className="font-semibold text-navy-900 mt-6 mb-2">Riwayat Pendampingan</p>
      {pendampingan.length ? (
        <table className="table-clean">
          <thead><tr><th>Tanggal</th><th>Kegiatan</th><th>Capaian</th><th>Rekomendasi</th><th>Status TL</th></tr></thead>
          <tbody>
            {pendampingan.map((p) => {
              const r = summarizeSkor(p.skor, instrumen)
              return (
                <tr key={p.id}>
                  <td>{formatDate(p.tanggal)}</td><td>{p.kegiatan}</td>
                  <td>{r.pct.toFixed(1)}%</td><td>{p.rekomendasi}</td><td>{p.statusTL}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : <p className="text-sm text-slate-500">Belum ada pendampingan.</p>}

      <p className="font-semibold text-navy-900 mt-6 mb-2">Tindak Lanjut</p>
      {tindakLanjut.length ? (
        <table className="table-clean">
          <thead><tr><th>Temuan</th><th>Rekomendasi</th><th>Batas</th><th>Status</th></tr></thead>
          <tbody>
            {tindakLanjut.map((t) => (
              <tr key={t.id}><td>{t.temuan}</td><td>{t.rekomendasi}</td><td>{formatDate(t.batas)}</td><td>{t.status}</td></tr>
            ))}
          </tbody>
        </table>
      ) : <p className="text-sm text-slate-500">Belum ada tindak lanjut.</p>}
    </>
  )
}

function SectionPerPengawas({ rekap }) {
  if (!rekap.length) return <EmptyState title="Tidak ada data" />
  return (
    <table className="table-clean">
      <thead><tr><th>No</th><th>Pengawas</th><th>Wilayah</th><th>Madrasah</th><th>Pendampingan</th><th>Capaian</th><th>Kategori</th></tr></thead>
      <tbody>
        {rekap.map((p, i) => (
          <tr key={p.id}>
            <td>{i + 1}</td><td>{p.nama}<br /><span className="text-xs text-slate-500">{p.nip}</span></td>
            <td>{p.wilayah}</td><td>{p.madrasahCount}</td><td>{p.pendampingan}</td>
            <td>{p.capaian.toFixed(1)}%</td>
            <td><Badge tone={p.kategori.tone}>{p.kategori.label}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SectionTindakLanjut({ data, madrasah }) {
  if (!data.length) return <EmptyState title="Tidak ada tindak lanjut" />
  return (
    <table className="table-clean">
      <thead><tr><th>No</th><th>Madrasah</th><th>Temuan</th><th>Rekomendasi</th><th>PJ</th><th>Batas</th><th>Status</th></tr></thead>
      <tbody>
        {data.map((t, i) => (
          <tr key={t.id}>
            <td>{i + 1}</td>
            <td>{madrasah.find((m) => m.id === t.madrasahId)?.nama ?? '-'}</td>
            <td>{t.temuan}</td><td>{t.rekomendasi}</td><td>{t.pj}</td>
            <td>{formatDate(t.batas)}</td>
            <td><Badge tone={STATUS_TINDAK_LANJUT_TONES[t.status]}>{t.status}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SectionEviden({ data, madrasah }) {
  if (!data.length) return <EmptyState title="Tidak ada eviden" />
  return (
    <table className="table-clean">
      <thead><tr><th>No</th><th>Tanggal</th><th>Madrasah</th><th>Jenis</th><th>Judul</th><th>Deskripsi</th></tr></thead>
      <tbody>
        {data.map((e, i) => (
          <tr key={e.id}>
            <td>{i + 1}</td><td>{formatDate(e.tanggal)}</td>
            <td>{madrasah.find((m) => m.id === e.madrasahId)?.nama ?? '-'}</td>
            <td>{e.jenis}</td><td>{e.judul}</td><td>{e.deskripsi}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Row({ k, v }) {
  return (
    <tr>
      <td className="py-1 pr-3 align-top w-44 text-slate-500">{k}</td>
      <td className="py-1 align-top">: <span className="font-medium text-navy-900">{v}</span></td>
    </tr>
  )
}
