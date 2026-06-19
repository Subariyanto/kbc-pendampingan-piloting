import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Modal, { ConfirmDialog } from '../components/Modal.jsx'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PrintHeader from '../components/PrintHeader.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useScope } from '../lib/useScope.js'
import { BENTUK_KEGIATAN, STATUS_JADWAL } from '../lib/constants.js'
import { formatDate, formatDateLong, monthKey, monthLabel, searchMatch, STATUS_JADWAL_TONES, todayISO } from '../lib/utils.js'
import { printPrintArea } from '../lib/printHelper.js'

const EMPTY = {
  tanggal: todayISO(), madrasahId: '', pengawasId: '', bentuk: 'Sosialisasi',
  materi: '', tempat: '', status: 'Terjadwal', catatan: ''
}

export default function JadwalPage() {
  const { state, addOrUpdate, remove } = useData()
  const toast = useToast()
  const scope = useScope()
  const [search, setSearch] = useState('')
  const [filterBulan, setFilterBulan] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [print, setPrint] = useState(false)

  const monthsAvail = useMemo(() => {
    const set = new Set(scope.jadwal.map((j) => monthKey(j.tanggal)).filter(Boolean))
    return Array.from(set).sort().reverse()
  }, [scope.jadwal])

  const data = useMemo(() => {
    return scope.jadwal
      .filter((j) => searchMatch(`${j.materi} ${j.tempat} ${j.bentuk}`, search))
      .filter((j) => !filterBulan || monthKey(j.tanggal) === filterBulan)
      .map((j) => ({
        ...j,
        madrasah: state.madrasah.find((m) => m.id === j.madrasahId)?.nama ?? '-',
        pengawas: state.pengawas.find((p) => p.id === j.pengawasId)?.nama ?? '-'
      }))
      .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
  }, [scope.jadwal, search, filterBulan, state.madrasah, state.pengawas])

  // Kalender simple: kelompokkan berdasar tanggal di bulan tertentu (atau bulan ini)
  const calMonthKey = filterBulan || monthsAvail[0] || monthKey(todayISO())
  const calMatrix = useMemo(() => buildMonthMatrix(calMonthKey, scope.jadwal), [calMonthKey, scope.jadwal])

  const onSave = (form) => {
    if (!form.madrasahId || !form.pengawasId) {
      toast.error('Pilih madrasah dan pengawas')
      return
    }
    addOrUpdate('jadwal', form)
    toast.success(form.id ? 'Jadwal diperbarui' : 'Jadwal ditambahkan')
    setEditing(null)
  }

  return (
    <>
      <PageHeader
        title="Jadwal Pendampingan"
        description="Kelola jadwal kegiatan pendampingan KBC ke madrasah piloting."
        icon="🗓️"
        actions={
          <>
            <button className="btn-ghost" onClick={() => setPrint(true)}>🖨 Cetak Jadwal</button>
            {scope.canEdit && <button className="btn-primary" onClick={() => setEditing(EMPTY)}>＋ Tambah Jadwal</button>}
          </>
        }
      />

      <div className="card-pad mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Cari</label>
          <input className="input" placeholder="Cari materi / tempat / bentuk…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="label">Bulan</label>
          <select className="input" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)}>
            <option value="">Semua bulan</option>
            {monthsAvail.map((m) => <option key={m} value={m}>{monthLabel(`${m}-01`)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="card-pad lg:col-span-1">
          <p className="font-semibold text-navy-900 mb-3">Kalender · {monthLabel(`${calMonthKey}-01`)}</p>
          <div className="grid grid-cols-7 text-center text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calMatrix.map((cell, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg text-xs flex flex-col items-center justify-start p-1 border ${
                  cell.inMonth ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent text-slate-400'
                } ${cell.today ? 'ring-2 ring-toska-400' : ''}`}
              >
                <span className={`font-medium ${cell.today ? 'text-toska-700' : 'text-slate-700'}`}>{cell.day}</span>
                {cell.events.length > 0 && (
                  <span className="mt-auto inline-flex items-center justify-center text-[10px] px-1.5 rounded-full bg-toska-100 text-toska-800">
                    {cell.events.length}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          {data.length ? (
            <div className="overflow-x-auto">
              <table className="table-clean">
                <thead>
                  <tr>
                    <th>Tanggal</th><th>Madrasah</th><th>Bentuk</th><th>Materi</th>
                    <th>Pengawas</th><th>Tempat</th><th>Status</th>
                    {scope.canEdit && <th className="text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.map((j) => (
                    <tr key={j.id}>
                      <td className="whitespace-nowrap">{formatDate(j.tanggal)}</td>
                      <td className="font-medium text-navy-900">{j.madrasah}</td>
                      <td>{j.bentuk}</td>
                      <td className="max-w-xs"><span className="line-clamp-2">{j.materi}</span></td>
                      <td>{j.pengawas}</td>
                      <td>{j.tempat}</td>
                      <td><Badge tone={STATUS_JADWAL_TONES[j.status]}>{j.status}</Badge></td>
                      {scope.canEdit && (
                        <td className="text-right whitespace-nowrap">
                          <button className="btn-ghost btn-sm mr-1" onClick={() => setEditing(j)}>✎</button>
                          <button className="btn-danger btn-sm" onClick={() => setConfirm(j)}>✕</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="Belum ada jadwal" description="Tambahkan jadwal pendampingan untuk memulai." />}
        </div>
      </div>

      {editing && (
        <Modal key={editing.id || 'new'} open onClose={() => setEditing(null)}
          title={editing.id ? 'Edit Jadwal' : 'Tambah Jadwal'} size="lg"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setEditing(null)}>Batal</button>
              <button className="btn-primary" form="form-jadwal" type="submit">Simpan</button>
            </>
          }
        >
          <FormJadwal value={editing} onSave={onSave} madrasahList={state.madrasah} pengawasList={state.pengawas} />
        </Modal>
      )}

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => { remove('jadwal', confirm.id); toast.success('Jadwal dihapus') }} title="Hapus Jadwal" message={`Yakin menghapus jadwal ${confirm?.materi}?`} />

      {print && (
        <Modal open onClose={() => setPrint(false)} title="Pratinjau Cetak — Jadwal" size="xl"
          footer={<><button className="btn-ghost" onClick={() => setPrint(false)}>Tutup</button><button className="btn-primary" onClick={() => printPrintArea()}>🖨 Cetak</button></>}
        >
          <div className="print-area bg-white p-6">
            <PrintHeader settings={state.settings} judul="JADWAL PENDAMPINGAN MADRASAH PILOTING KBC" />
            {filterBulan && <p className="text-sm text-slate-700 mb-2">Bulan: {monthLabel(`${filterBulan}-01`)}</p>}
            <table className="table-clean">
              <thead><tr><th>No</th><th>Tanggal</th><th>Madrasah</th><th>Bentuk</th><th>Materi</th><th>Pengawas</th><th>Tempat</th><th>Status</th></tr></thead>
              <tbody>
                {data.map((j, i) => (
                  <tr key={j.id}>
                    <td>{i + 1}</td><td>{formatDateLong(j.tanggal)}</td><td>{j.madrasah}</td>
                    <td>{j.bentuk}</td><td>{j.materi}</td><td>{j.pengawas}</td>
                    <td>{j.tempat}</td><td>{j.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </>
  )
}

function FormJadwal({ value, onSave, madrasahList, pengawasList }) {
  const [form, setForm] = useState(value)
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => { e.preventDefault(); onSave(form) }
  return (
    <form id="form-jadwal" onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Tanggal" required><input className="input" type="date" value={form.tanggal} onChange={(e) => upd('tanggal', e.target.value)} required /></Field>
      <Field label="Bentuk Kegiatan">
        <select className="input" value={form.bentuk} onChange={(e) => upd('bentuk', e.target.value)}>
          {BENTUK_KEGIATAN.map((b) => <option key={b}>{b}</option>)}
        </select>
      </Field>
      <Field label="Madrasah" required>
        <select className="input" value={form.madrasahId} onChange={(e) => upd('madrasahId', e.target.value)} required>
          <option value="">— Pilih madrasah —</option>
          {madrasahList.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
        </select>
      </Field>
      <Field label="Pengawas" required>
        <select className="input" value={form.pengawasId} onChange={(e) => upd('pengawasId', e.target.value)} required>
          <option value="">— Pilih pengawas —</option>
          {pengawasList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
        </select>
      </Field>
      <Field label="Status">
        <select className="input" value={form.status} onChange={(e) => upd('status', e.target.value)}>
          {STATUS_JADWAL.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Tempat"><input className="input" value={form.tempat} onChange={(e) => upd('tempat', e.target.value)} /></Field>
      <div className="sm:col-span-2">
        <label className="label">Materi Pendampingan</label>
        <input className="input" value={form.materi} onChange={(e) => upd('materi', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Catatan</label>
        <textarea className="input" rows={3} value={form.catatan} onChange={(e) => upd('catatan', e.target.value)} />
      </div>
    </form>
  )
}

function Field({ label, required, children }) {
  return <div><label className="label">{label}{required && <span className="text-rose-500"> *</span>}</label>{children}</div>
}

function buildMonthMatrix(mkey, jadwal) {
  if (!mkey) return []
  const [year, month] = mkey.split('-').map(Number)
  const first = new Date(year, month - 1, 1)
  const startDay = first.getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month, 0).getDate()
  const todayKey = todayISO()
  const cells = []
  for (let i = 0; i < startDay; i++) {
    cells.push({ inMonth: false, day: '', events: [] })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const events = jadwal.filter((j) => j.tanggal === iso)
    cells.push({ inMonth: true, day: d, events, today: iso === todayKey })
  }
  while (cells.length % 7 !== 0) cells.push({ inMonth: false, day: '', events: [] })
  return cells
}
