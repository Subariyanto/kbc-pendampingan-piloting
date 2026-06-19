import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Modal, { ConfirmDialog } from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PrintHeader from '../components/PrintHeader.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useScope } from '../lib/useScope.js'
import { SKOR_LABELS } from '../lib/constants.js'
import { uid } from '../lib/utils.js'
import { printPrintArea } from '../lib/printHelper.js'

export default function InstrumenPage() {
  const { state, setInstrumen, resetInstrumen } = useData()
  const toast = useToast()
  const scope = useScope()
  const [editAspek, setEditAspek] = useState(null)
  const [editIndikator, setEditIndikator] = useState(null) // { aspekId, indikator }
  const [confirm, setConfirm] = useState(null)
  const [print, setPrint] = useState(false)

  const canEdit = scope.role === 'admin'
  const instrumen = state.instrumen

  const onSaveAspek = (aspek) => {
    if (!aspek.kode || !aspek.nama) { toast.error('Kode & nama aspek wajib diisi'); return }
    if (aspek.id) {
      setInstrumen(instrumen.map((a) => (a.id === aspek.id ? { ...a, kode: aspek.kode, nama: aspek.nama } : a)))
    } else {
      setInstrumen([...instrumen, { id: uid('aspek'), kode: aspek.kode, nama: aspek.nama, indikator: [] }])
    }
    toast.success('Aspek tersimpan')
    setEditAspek(null)
  }

  const onRemoveAspek = (aspekId) => {
    setInstrumen(instrumen.filter((a) => a.id !== aspekId))
    toast.success('Aspek dihapus')
  }

  const onSaveIndikator = (aspekId, indikator) => {
    if (!indikator.teks) { toast.error('Teks indikator wajib diisi'); return }
    setInstrumen(instrumen.map((a) => {
      if (a.id !== aspekId) return a
      let inds
      if (indikator.id) {
        inds = a.indikator.map((i) => (i.id === indikator.id ? { ...i, teks: indikator.teks } : i))
      } else {
        inds = [...a.indikator, { id: uid('ind'), nomor: a.indikator.length + 1, teks: indikator.teks }]
      }
      return { ...a, indikator: renumber(inds) }
    }))
    toast.success('Indikator tersimpan')
    setEditIndikator(null)
  }

  const onRemoveIndikator = (aspekId, indId) => {
    setInstrumen(instrumen.map((a) => {
      if (a.id !== aspekId) return a
      return { ...a, indikator: renumber(a.indikator.filter((i) => i.id !== indId)) }
    }))
    toast.success('Indikator dihapus')
  }

  return (
    <>
      <PageHeader
        title="Instrumen Monitoring KBC"
        description="Aspek dan indikator penilaian implementasi Kurikulum Berbasis Cinta. Skor 1 (Belum Terlaksana) – 4 (Sangat Baik)."
        icon="📋"
        actions={
          <>
            <button className="btn-ghost" onClick={() => setPrint(true)}>🖨 Cetak Instrumen</button>
            {canEdit && <button className="btn-ghost" onClick={() => { resetInstrumen(); toast.success('Instrumen dikembalikan ke default') }}>↺ Reset Default</button>}
            {canEdit && <button className="btn-primary" onClick={() => setEditAspek({ kode: '', nama: '' })}>＋ Tambah Aspek</button>}
          </>
        }
      />

      <div className="card-pad mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(SKOR_LABELS).map(([s, label]) => (
          <div key={s} className="rounded-lg border border-slate-200 px-3 py-2">
            <p className="text-xs text-slate-500">Skor {s}</p>
            <p className="text-sm font-semibold text-navy-900">{label}</p>
          </div>
        ))}
      </div>

      {instrumen.length ? (
        <div className="space-y-4">
          {instrumen.map((aspek) => (
            <div key={aspek.id} className="card overflow-hidden">
              <div className="flex items-center justify-between bg-navy-50 px-5 py-3 border-b border-navy-100">
                <div>
                  <p className="text-xs uppercase tracking-wider text-toska-700 font-semibold">Aspek {aspek.kode}</p>
                  <p className="font-semibold text-navy-900">{aspek.nama}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{aspek.indikator.length} indikator · maks {aspek.indikator.length * 4} poin</p>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button className="btn-ghost btn-sm" onClick={() => setEditAspek(aspek)}>✎ Aspek</button>
                    <button className="btn-danger btn-sm" onClick={() => setConfirm({ kind: 'aspek', id: aspek.id, label: aspek.nama })}>✕</button>
                  </div>
                )}
              </div>
              <ul className="divide-y divide-slate-100">
                {aspek.indikator.map((ind) => (
                  <li key={ind.id} className="px-5 py-3 flex items-start gap-3">
                    <span className="w-7 h-7 rounded-md bg-toska-100 text-toska-800 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {aspek.kode}{ind.nomor}
                    </span>
                    <p className="flex-1 text-sm text-slate-700">{ind.teks}</p>
                    {canEdit && (
                      <div className="flex gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => setEditIndikator({ aspekId: aspek.id, indikator: ind })}>✎</button>
                        <button className="btn-danger btn-sm" onClick={() => setConfirm({ kind: 'ind', aspekId: aspek.id, id: ind.id, label: ind.teks.slice(0, 40) + '…' })}>✕</button>
                      </div>
                    )}
                  </li>
                ))}
                {!aspek.indikator.length && (
                  <li className="px-5 py-6 text-sm text-slate-500 text-center">Belum ada indikator pada aspek ini.</li>
                )}
                {canEdit && (
                  <li className="px-5 py-3 bg-slate-50/60">
                    <button className="text-sm text-toska-700 hover:underline" onClick={() => setEditIndikator({ aspekId: aspek.id, indikator: { teks: '' } })}>
                      ＋ Tambah indikator
                    </button>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Belum ada aspek instrumen" description="Tambahkan aspek baru atau reset ke default." />
      )}

      {editAspek && (
        <Modal key={editAspek.id || 'new'} open onClose={() => setEditAspek(null)}
          title={editAspek.id ? 'Edit Aspek' : 'Tambah Aspek'} size="md"
          footer={<><button className="btn-ghost" onClick={() => setEditAspek(null)}>Batal</button><button className="btn-primary" form="form-aspek" type="submit">Simpan</button></>}>
          <FormAspek value={editAspek} onSave={onSaveAspek} />
        </Modal>
      )}

      {editIndikator && (
        <Modal key={editIndikator.indikator?.id || 'new'} open onClose={() => setEditIndikator(null)}
          title={editIndikator.indikator?.id ? 'Edit Indikator' : 'Tambah Indikator'} size="md"
          footer={<><button className="btn-ghost" onClick={() => setEditIndikator(null)}>Batal</button><button className="btn-primary" form="form-ind" type="submit">Simpan</button></>}>
          <FormIndikator value={editIndikator.indikator} onSave={(ind) => onSaveIndikator(editIndikator.aspekId, ind)} />
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm.kind === 'aspek') onRemoveAspek(confirm.id)
          else onRemoveIndikator(confirm.aspekId, confirm.id)
        }}
        title={confirm?.kind === 'aspek' ? 'Hapus Aspek' : 'Hapus Indikator'}
        message={`Yakin menghapus ${confirm?.label}?`}
      />

      {print && (
        <Modal open onClose={() => setPrint(false)} title="Pratinjau Cetak — Instrumen" size="xl"
          footer={<><button className="btn-ghost" onClick={() => setPrint(false)}>Tutup</button><button className="btn-primary" onClick={() => printPrintArea()}>🖨 Cetak</button></>}
        >
          <div className="print-area bg-white p-6">
            <PrintHeader settings={state.settings} judul="INSTRUMEN MONITORING IMPLEMENTASI KBC" />
            <p className="text-xs text-slate-600 mb-3">Skor: 1=Belum Terlaksana · 2=Mulai Terlaksana · 3=Terlaksana · 4=Sangat Baik</p>
            {instrumen.map((aspek) => (
              <div key={aspek.id} className="mb-4">
                <p className="font-semibold text-navy-900">Aspek {aspek.kode}. {aspek.nama}</p>
                <table className="table-clean mt-2">
                  <thead><tr><th style={{width: 40}}>No</th><th>Indikator</th><th style={{width: 80}}>Skor</th></tr></thead>
                  <tbody>
                    {aspek.indikator.map((ind) => (
                      <tr key={ind.id}><td>{aspek.kode}{ind.nomor}</td><td>{ind.teks}</td><td>____</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}

function FormAspek({ value, onSave }) {
  const [form, setForm] = useState(value)
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => { e.preventDefault(); onSave(form) }
  return (
    <form id="form-aspek" onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Kode Aspek (mis. A, B, C)</label>
        <input className="input" value={form.kode} onChange={(e) => upd('kode', e.target.value.toUpperCase())} maxLength={3} required />
      </div>
      <div>
        <label className="label">Nama Aspek</label>
        <input className="input" value={form.nama} onChange={(e) => upd('nama', e.target.value)} required />
      </div>
    </form>
  )
}

function FormIndikator({ value, onSave }) {
  const [form, setForm] = useState(value)
  const submit = (e) => { e.preventDefault(); onSave(form) }
  return (
    <form id="form-ind" onSubmit={submit}>
      <label className="label">Teks Indikator</label>
      <textarea className="input" rows={3} value={form.teks} onChange={(e) => setForm({ ...form, teks: e.target.value })} required />
    </form>
  )
}

function renumber(list) {
  return list.map((x, i) => ({ ...x, nomor: i + 1 }))
}
