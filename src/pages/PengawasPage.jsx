import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Modal, { ConfirmDialog } from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PrintHeader from '../components/PrintHeader.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useScope } from '../lib/useScope.js'
import { downloadCSV, formatDate, searchMatch } from '../lib/utils.js'

const EMPTY = { nama: '', nip: '', pangkat: '', jabatan: '', wilayah: '', hp: '', email: '' }

export default function PengawasPage() {
  const { state, addOrUpdate, remove } = useData()
  const toast = useToast()
  const scope = useScope()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [print, setPrint] = useState(false)

  const data = useMemo(() => {
    return scope.pengawasList
      .filter((p) => searchMatch(`${p.nama} ${p.nip} ${p.wilayah}`, search))
      .map((p) => ({
        ...p,
        jumlah: state.madrasah.filter((m) => m.pengawasId === p.id).length
      }))
  }, [scope.pengawasList, search, state.madrasah])

  const onSave = (form) => {
    if (!form.nama) {
      toast.error('Nama pengawas wajib diisi')
      return
    }
    addOrUpdate('pengawas', form)
    toast.success(form.id ? 'Data pengawas diperbarui' : 'Pengawas baru ditambahkan')
    setEditing(null)
  }

  const exportCSV = () => {
    const rows = data.map((p) => ({
      Nama: p.nama, NIP: p.nip, 'Pangkat/Gol': p.pangkat, Jabatan: p.jabatan,
      Wilayah: p.wilayah, HP: p.hp, Email: p.email, 'Jumlah Dampingan': p.jumlah
    }))
    downloadCSV(`pengawas-pendamping-${Date.now()}.csv`, rows)
    toast.success('Data CSV diunduh')
  }

  return (
    <>
      <PageHeader
        title="Data Pengawas Pendamping"
        description="Daftar pengawas madrasah pendamping piloting KBC."
        icon="🧑‍🏫"
        actions={
          <>
            <button className="btn-ghost" onClick={() => setPrint(true)}>🖨 Cetak</button>
            <button className="btn-ghost" onClick={exportCSV}>⬇ CSV</button>
            {scope.canEditFull && <button className="btn-primary" onClick={() => setEditing(EMPTY)}>＋ Tambah Pengawas</button>}
          </>
        }
      />

      <div className="card-pad mb-4">
        <input className="input" placeholder="Cari nama / NIP / wilayah…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {data.length ? (
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Nama</th><th>NIP</th><th>Pangkat/Gol</th><th>Jabatan</th>
                  <th>Wilayah</th><th>HP</th><th>Email</th><th>Dampingan</th>
                  {scope.canEditFull && <th className="text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-navy-900">{p.nama}</td>
                    <td className="font-mono text-xs">{p.nip}</td>
                    <td>{p.pangkat}</td>
                    <td>{p.jabatan}</td>
                    <td>{p.wilayah}</td>
                    <td>{p.hp}</td>
                    <td>{p.email}</td>
                    <td>{p.jumlah}</td>
                    {scope.canEditFull && (
                      <td className="text-right whitespace-nowrap">
                        <button className="btn-ghost btn-sm mr-1" onClick={() => setEditing(p)}>✎</button>
                        <button className="btn-danger btn-sm" onClick={() => setConfirm(p)}>✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Belum ada data pengawas" />}
      </div>

      {editing && (
        <Modal
          key={editing.id || 'new'}
          open
          onClose={() => setEditing(null)}
          title={editing.id ? 'Edit Pengawas' : 'Tambah Pengawas'}
          size="md"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setEditing(null)}>Batal</button>
              <button className="btn-primary" form="form-pengawas" type="submit">Simpan</button>
            </>
          }
        >
          <FormPengawas value={editing} onSave={onSave} />
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { remove('pengawas', confirm.id); toast.success('Pengawas dihapus') }}
        title="Hapus Pengawas"
        message={`Yakin menghapus ${confirm?.nama}? Madrasah binaan akan kehilangan referensi pengawas.`}
      />

      {print && (
        <Modal open onClose={() => setPrint(false)} title="Pratinjau Cetak — Pengawas" size="xl"
          footer={<><button className="btn-ghost" onClick={() => setPrint(false)}>Tutup</button><button className="btn-primary" onClick={() => window.print()}>🖨 Cetak</button></>}>
          <div className="print-area bg-white p-6">
            <PrintHeader settings={state.settings} judul="DAFTAR PENGAWAS PENDAMPING PILOTING KBC" />
            <table className="table-clean">
              <thead><tr><th>No</th><th>Nama</th><th>NIP</th><th>Pangkat</th><th>Jabatan</th><th>Wilayah</th><th>Dampingan</th></tr></thead>
              <tbody>
                {data.map((p, i) => (
                  <tr key={p.id}><td>{i + 1}</td><td>{p.nama}</td><td>{p.nip}</td><td>{p.pangkat}</td><td>{p.jabatan}</td><td>{p.wilayah}</td><td>{p.jumlah}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="mt-6 text-xs text-slate-500">Dicetak {formatDate(new Date())}.</p>
          </div>
        </Modal>
      )}
    </>
  )
}

function FormPengawas({ value, onSave }) {
  const [form, setForm] = useState(value)
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = (e) => { e.preventDefault(); onSave(form) }
  return (
    <form id="form-pengawas" onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Nama" required><input className="input" value={form.nama} onChange={(e) => upd('nama', e.target.value)} required /></Field>
      <Field label="NIP"><input className="input" value={form.nip} onChange={(e) => upd('nip', e.target.value)} /></Field>
      <Field label="Pangkat/Golongan"><input className="input" value={form.pangkat} onChange={(e) => upd('pangkat', e.target.value)} /></Field>
      <Field label="Jabatan"><input className="input" value={form.jabatan} onChange={(e) => upd('jabatan', e.target.value)} /></Field>
      <Field label="Wilayah Binaan"><input className="input" value={form.wilayah} onChange={(e) => upd('wilayah', e.target.value)} /></Field>
      <Field label="Nomor HP"><input className="input" value={form.hp} onChange={(e) => upd('hp', e.target.value)} /></Field>
      <Field label="Email"><input className="input" type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} /></Field>
    </form>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-rose-500"> *</span>}</label>
      {children}
    </div>
  )
}
