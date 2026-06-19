import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Modal, { ConfirmDialog } from '../components/Modal.jsx'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useScope } from '../lib/useScope.js'
import { JENIS_EVIDEN } from '../lib/constants.js'
import { formatDate, searchMatch, todayISO } from '../lib/utils.js'

const EMPTY = { madrasahId: '', jenis: 'Foto', judul: '', deskripsi: '', tanggal: todayISO(), link: '' }

const JENIS_TONE = {
  Foto: 'toska', Dokumen: 'navy', Video: 'rose', Link: 'sky',
  Notulen: 'gold', 'SK Tim': 'emerald', Jadwal: 'gold', 'Modul Ajar': 'navy', 'Program Kerja': 'toska'
}

export default function EvidenPage() {
  const { state, addOrUpdate, remove } = useData()
  const toast = useToast()
  const scope = useScope()
  const [search, setSearch] = useState('')
  const [filterMadrasah, setFilterMadrasah] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [preview, setPreview] = useState(null)

  const data = useMemo(() => {
    return scope.eviden
      .filter((e) => searchMatch(`${e.judul} ${e.deskripsi}`, search))
      .filter((e) => !filterMadrasah || e.madrasahId === filterMadrasah)
      .filter((e) => !filterJenis || e.jenis === filterJenis)
      .map((e) => ({ ...e, madrasah: state.madrasah.find((m) => m.id === e.madrasahId)?.nama ?? '-' }))
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
  }, [scope.eviden, search, filterMadrasah, filterJenis, state.madrasah])

  const onSave = (form) => {
    if (!form.madrasahId || !form.judul) { toast.error('Madrasah dan judul wajib diisi'); return }
    addOrUpdate('eviden', form)
    toast.success(form.id ? 'Eviden diperbarui' : 'Eviden ditambahkan')
    setEditing(null)
  }

  return (
    <>
      <PageHeader
        title="Eviden / Bukti Kegiatan"
        description="Kumpulan eviden kegiatan pendampingan dan implementasi KBC."
        icon="📎"
        actions={scope.canEdit && <button className="btn-primary" onClick={() => setEditing(EMPTY)}>＋ Tambah Eviden</button>}
      />

      <div className="card-pad mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input className="input" placeholder="Cari judul / deskripsi…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={filterMadrasah} onChange={(e) => setFilterMadrasah(e.target.value)}>
          <option value="">Semua madrasah</option>
          {scope.madrasah.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
        </select>
        <select className="input" value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}>
          <option value="">Semua jenis</option>
          {JENIS_EVIDEN.map((j) => <option key={j}>{j}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {data.length ? (
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Tanggal</th><th>Madrasah</th><th>Jenis</th><th>Judul</th>
                  <th>Deskripsi</th><th>Link</th>
                  {scope.canEdit && <th className="text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap">{formatDate(e.tanggal)}</td>
                    <td className="font-medium text-navy-900">{e.madrasah}</td>
                    <td><Badge tone={JENIS_TONE[e.jenis] || 'slate'}>{e.jenis}</Badge></td>
                    <td>{e.judul}</td>
                    <td className="max-w-xs"><span className="line-clamp-2">{e.deskripsi}</span></td>
                    <td>
                      {e.link ? (
                        <button className="text-toska-700 hover:underline text-xs" onClick={() => setPreview(e)}>Pratinjau</button>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    {scope.canEdit && (
                      <td className="text-right whitespace-nowrap">
                        <button className="btn-ghost btn-sm mr-1" onClick={() => setEditing(e)}>✎</button>
                        <button className="btn-danger btn-sm" onClick={() => setConfirm(e)}>✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Belum ada eviden" description="Tambahkan eviden untuk dokumentasi KBC." />}
      </div>

      {editing && (
        <Modal key={editing.id || 'new'} open onClose={() => setEditing(null)}
          title={editing.id ? 'Edit Eviden' : 'Tambah Eviden'} size="md"
          footer={<><button className="btn-ghost" onClick={() => setEditing(null)}>Batal</button><button className="btn-primary" form="form-eviden" type="submit">Simpan</button></>}>
          <FormEviden value={editing} onSave={onSave} madrasahList={scope.madrasah} />
        </Modal>
      )}

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => { remove('eviden', confirm.id); toast.success('Eviden dihapus') }} title="Hapus Eviden" message={`Yakin menghapus ${confirm?.judul}?`} />

      {preview && (
        <Modal open onClose={() => setPreview(null)} size="lg" title={`Pratinjau · ${preview.judul}`}
          footer={<button className="btn-primary" onClick={() => setPreview(null)}>Tutup</button>}>
          <p className="text-sm text-slate-600 mb-2">{preview.deskripsi}</p>
          <p className="text-xs text-slate-500 mb-3">{preview.madrasah ?? ''} · {formatDate(preview.tanggal)}</p>
          <a href={preview.link} target="_blank" rel="noreferrer" className="block text-sm break-all text-toska-700 hover:underline mb-3">{preview.link}</a>
          {isImageLink(preview.link) ? (
            <img src={preview.link} alt={preview.judul} className="rounded-lg max-h-96 mx-auto" />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-500 text-sm">
              Klik tautan di atas untuk membuka eviden di tab baru.
            </div>
          )}
        </Modal>
      )}
    </>
  )
}

function FormEviden({ value, onSave, madrasahList }) {
  const [form, setForm] = useState(value)
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => { e.preventDefault(); onSave(form) }
  return (
    <form id="form-eviden" onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Madrasah" required>
        <select className="input" value={form.madrasahId} onChange={(e) => upd('madrasahId', e.target.value)} required>
          <option value="">— Pilih —</option>
          {madrasahList.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
        </select>
      </Field>
      <Field label="Jenis Eviden">
        <select className="input" value={form.jenis} onChange={(e) => upd('jenis', e.target.value)}>
          {JENIS_EVIDEN.map((j) => <option key={j}>{j}</option>)}
        </select>
      </Field>
      <Field label="Judul" required><input className="input" value={form.judul} onChange={(e) => upd('judul', e.target.value)} required /></Field>
      <Field label="Tanggal Upload"><input className="input" type="date" value={form.tanggal} onChange={(e) => upd('tanggal', e.target.value)} /></Field>
      <div className="sm:col-span-2">
        <label className="label">Deskripsi</label>
        <textarea className="input" rows={2} value={form.deskripsi} onChange={(e) => upd('deskripsi', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Link Eviden</label>
        <input className="input" placeholder="https://drive.google.com/..." value={form.link} onChange={(e) => upd('link', e.target.value)} />
      </div>
    </form>
  )
}

function Field({ label, required, children }) {
  return <div><label className="label">{label}{required && <span className="text-rose-500"> *</span>}</label>{children}</div>
}

function isImageLink(url) {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(String(url || ''))
}
