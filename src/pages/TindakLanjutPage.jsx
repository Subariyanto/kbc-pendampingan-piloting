import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Modal, { ConfirmDialog } from '../components/Modal.jsx'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PrintHeader, { PrintSignature } from '../components/PrintHeader.jsx'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useScope } from '../lib/useScope.js'
import { resolvePengawasFromUser } from '../lib/pengawasResolver.js'
import { STATUS_TINDAK_LANJUT } from '../lib/constants.js'
import { formatDate, isOverdue, searchMatch, STATUS_TINDAK_LANJUT_TONES, todayISO } from '../lib/utils.js'
import { printPrintArea } from '../lib/printHelper.js'

const EMPTY = { madrasahId: '', temuan: '', rekomendasi: '', pj: '', batas: todayISO(), status: 'Belum Dikerjakan', catatan: '' }

export default function TindakLanjutPage() {
  const { state, addOrUpdate, remove } = useData()
  const { user } = useAuth()
  const toast = useToast()
  const scope = useScope()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [print, setPrint] = useState(false)

  const data = useMemo(() => {
    return scope.tindakLanjut
      .filter((t) => searchMatch(`${t.temuan} ${t.rekomendasi} ${t.pj}`, search))
      .filter((t) => !filterStatus || t.status === filterStatus)
      .map((t) => ({
        ...t,
        madrasah: state.madrasah.find((m) => m.id === t.madrasahId)?.nama ?? '-',
        overdue: isOverdue(t.batas, t.status)
      }))
      .sort((a, b) => new Date(a.batas || 0) - new Date(b.batas || 0))
  }, [scope.tindakLanjut, search, filterStatus, state.madrasah])

  const onSave = (form) => {
    if (!form.madrasahId || !form.temuan) { toast.error('Madrasah dan temuan wajib diisi'); return }
    addOrUpdate('tindakLanjut', form)
    toast.success(form.id ? 'Rekomendasi diperbarui' : 'Rekomendasi ditambahkan')
    setEditing(null)
  }

  return (
    <>
      <PageHeader
        title="Rekomendasi & Tindak Lanjut"
        description="Daftar rekomendasi pengawas dan progres tindak lanjut madrasah."
        icon="✅"
        actions={
          <>
            <button className="btn-ghost" onClick={() => setPrint(true)}>🖨 Cetak</button>
            {scope.canEdit && <button className="btn-primary" onClick={() => setEditing(EMPTY)}>＋ Tambah Rekomendasi</button>}
          </>
        }
      />

      <div className="card-pad mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2"><input className="input" placeholder="Cari temuan / rekomendasi / PJ…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua status</option>
          {STATUS_TINDAK_LANJUT.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {data.length ? (
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Madrasah</th><th>Temuan</th><th>Rekomendasi</th>
                  <th>PJ</th><th>Batas</th><th>Status</th><th>Catatan</th>
                  {scope.canEdit && <th className="text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium text-navy-900">{t.madrasah}</td>
                    <td className="max-w-xs"><span className="line-clamp-3">{t.temuan}</span></td>
                    <td className="max-w-xs"><span className="line-clamp-3">{t.rekomendasi}</span></td>
                    <td>{t.pj}</td>
                    <td className="whitespace-nowrap">
                      {formatDate(t.batas)}
                      {t.overdue && <Badge tone="rose" className="ml-1">terlewat</Badge>}
                    </td>
                    <td><Badge tone={STATUS_TINDAK_LANJUT_TONES[t.status]}>{t.status}</Badge></td>
                    <td className="max-w-xs"><span className="line-clamp-2 text-slate-500 text-xs">{t.catatan}</span></td>
                    {scope.canEdit && (
                      <td className="text-right whitespace-nowrap">
                        <button className="btn-ghost btn-sm mr-1" onClick={() => setEditing(t)}>✎</button>
                        <button className="btn-danger btn-sm" onClick={() => setConfirm(t)}>✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Belum ada rekomendasi" description="Catat rekomendasi tindak lanjut hasil pendampingan." />}
      </div>

      {editing && (
        <Modal key={editing.id || 'new'} open onClose={() => setEditing(null)}
          title={editing.id ? 'Edit Rekomendasi' : 'Tambah Rekomendasi'} size="lg"
          footer={<><button className="btn-ghost" onClick={() => setEditing(null)}>Batal</button><button className="btn-primary" form="form-tl" type="submit">Simpan</button></>}>
          <FormTL value={editing} onSave={onSave} madrasahList={scope.madrasah} />
        </Modal>
      )}

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => { remove('tindakLanjut', confirm.id); toast.success('Rekomendasi dihapus') }} title="Hapus Rekomendasi" message="Yakin menghapus rekomendasi ini?" />

      {print && (
        <Modal open onClose={() => setPrint(false)} title="Pratinjau Cetak — Tindak Lanjut" size="xl"
          footer={<><button className="btn-ghost" onClick={() => setPrint(false)}>Tutup</button><button className="btn-primary" onClick={() => printPrintArea()}>🖨 Cetak</button></>}>
          <div className="print-area bg-white p-6">
            <PrintHeader settings={state.settings} judul="DAFTAR REKOMENDASI & TINDAK LANJUT KBC" />
            <table className="table-clean">
              <thead><tr><th>No</th><th>Madrasah</th><th>Temuan</th><th>Rekomendasi</th><th>PJ</th><th>Batas</th><th>Status</th></tr></thead>
              <tbody>
                {data.map((t, i) => (
                  <tr key={t.id}><td>{i + 1}</td><td>{t.madrasah}</td><td>{t.temuan}</td><td>{t.rekomendasi}</td><td>{t.pj}</td><td>{formatDate(t.batas)}</td><td>{t.status}</td></tr>
                ))}
              </tbody>
            </table>
            <PrintSignature settings={state.settings} namaPengawas={user?.nama} nipPengawas={user?.nip} namaLengkap={user?.namaLengkap || user?.nama} />
          </div>
        </Modal>
      )}
    </>
  )
}

function FormTL({ value, onSave, madrasahList }) {
  const [form, setForm] = useState(value)
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => { e.preventDefault(); onSave(form) }
  return (
    <form id="form-tl" onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Madrasah" required>
        <select className="input" value={form.madrasahId} onChange={(e) => upd('madrasahId', e.target.value)} required>
          <option value="">— Pilih —</option>
          {madrasahList.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
        </select>
      </Field>
      <Field label="Status">
        <select className="input" value={form.status} onChange={(e) => upd('status', e.target.value)}>
          {STATUS_TINDAK_LANJUT.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Penanggung Jawab"><input className="input" value={form.pj} onChange={(e) => upd('pj', e.target.value)} /></Field>
      <Field label="Batas Waktu"><input className="input" type="date" value={form.batas} onChange={(e) => upd('batas', e.target.value)} /></Field>
      <div className="sm:col-span-2"><label className="label">Temuan</label><textarea className="input" rows={2} value={form.temuan} onChange={(e) => upd('temuan', e.target.value)} required /></div>
      <div className="sm:col-span-2"><label className="label">Rekomendasi</label><textarea className="input" rows={2} value={form.rekomendasi} onChange={(e) => upd('rekomendasi', e.target.value)} /></div>
      <div className="sm:col-span-2"><label className="label">Catatan Penyelesaian</label><textarea className="input" rows={2} value={form.catatan} onChange={(e) => upd('catatan', e.target.value)} /></div>
    </form>
  )
}

function Field({ label, required, children }) {
  return <div><label className="label">{label}{required && <span className="text-rose-500"> *</span>}</label>{children}</div>
}
