import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Modal, { ConfirmDialog } from '../components/Modal.jsx'
import { useToast } from '../context/ToastContext.jsx'

const STORAGE_KEY = 'kbc_contoh_eviden_v1'
const DRIVE_FOLDER = 'https://drive.google.com/drive/folders/1C0u15smYJB1cEaoIa7Y6-BZetd72JMNs?usp=sharing'

const DEFAULT_FILES = [
  '00_Daftar_Format_Eviden_KBC',
  '01_SK_Tim_Pelaksana_KBC',
  '02_Program_Kerja_Implementasi_KBC',
  '03_Jadwal_Kegiatan_Implementasi_KBC',
  '04_Modul_Ajar_RPP_Berbasis_Cinta',
  '05_Tata_Tertib_Madrasah_Ramah_Anak',
  '06_Program_Anti_Bullying_Berbasis_Cinta',
  '07_Dokumentasi_Kegiatan_Pembiasaan_KBC',
  '08_Dokumentasi_Pembelajaran_Berbasis_Cinta',
  '09_Jurnal_Guru_Implementasi_KBC',
  '10_Observasi_Pembelajaran_Berbasis_Cinta',
  '11_Notulen_Rapat_Refleksi_KBC',
  '12_Catatan_Tindak_Lanjut_KBC',
  '13_Instrumen_Supervisi_Implementasi_KBC',
  '14_Laporan_Pelaksanaan_Implementasi_KBC',
  '15_Rekomendasi_Tindak_Lanjut_KBC'
].map((name, index) => ({ id: `default-${index}`, name: name.replaceAll('_', ' '), driveUrl: '' }))

const loadFiles = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved : DEFAULT_FILES
  } catch {
    return DEFAULT_FILES
  }
}

const validUrl = (value) => {
  if (!value) return true
  try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
}

export default function ContohEvidenPage() {
  const toast = useToast()
  const [files, setFiles] = useState(loadFiles)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
  }, [files])

  const save = (item) => {
    const name = item.name.trim()
    const driveUrl = item.driveUrl.trim()
    if (!name) return toast.error('Nama eviden wajib diisi.')
    if (!validUrl(driveUrl)) return toast.error('Link Google Drive harus berupa URL yang valid.')

    if (item.id) {
      setFiles((prev) => prev.map((file) => file.id === item.id ? { ...file, name, driveUrl } : file))
      toast.success('Eviden berhasil diperbarui.')
    } else {
      setFiles((prev) => [...prev, { id: `eviden-${Date.now()}`, name, driveUrl }])
      toast.success('Eviden berhasil ditambahkan.')
    }
    setEditing(null)
  }

  const remove = () => {
    setFiles((prev) => prev.filter((file) => file.id !== deleting.id))
    toast.success('Eviden berhasil dihapus.')
  }

  return <>
    <PageHeader
      title="Contoh Eviden"
      icon="🗂️"
      description="Kelola daftar format eviden dan tautan Google Drive masing-masing."
      actions={<button className="btn-primary" onClick={() => setEditing({ name: '', driveUrl: '' })}>＋ Tambah Eviden</button>}
    />

    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-clean">
          <thead><tr><th className="w-16">No</th><th>Nama Format Eviden</th><th>Link Google Drive</th><th className="text-right">Aksi</th></tr></thead>
          <tbody>
            {files.map((file, index) => <tr key={file.id}>
              <td>{String(index + 1).padStart(2, '0')}</td>
              <td className="font-medium text-navy-900">📄 {file.name}</td>
              <td>
                {file.driveUrl
                  ? <a className="text-emerald-700 hover:underline font-medium" href={file.driveUrl} target="_blank" rel="noreferrer">🔗 Buka Google Drive</a>
                  : <span className="text-slate-400 text-sm">Belum ada link</span>}
              </td>
              <td className="text-right whitespace-nowrap">
                <button className="btn-ghost btn-sm mr-1" onClick={() => setEditing(file)}>✏️ Edit</button>
                <button className="btn-danger btn-sm" onClick={() => setDeleting(file)}>🗑 Hapus</button>
              </td>
            </tr>)}
            {!files.length && <tr><td colSpan="4" className="text-center text-slate-500 py-10">Belum ada eviden. Klik “Tambah Eviden”.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>

    <p className="text-xs text-slate-500 mt-4">Data dan link tersimpan otomatis di perangkat ini. Folder utama: <a className="text-emerald-700 hover:underline" href={DRIVE_FOLDER} target="_blank" rel="noreferrer">Google Drive Eviden KBC</a>.</p>

    <EvidenForm item={editing} onClose={() => setEditing(null)} onSave={save} />
    <ConfirmDialog
      open={Boolean(deleting)}
      onClose={() => setDeleting(null)}
      onConfirm={remove}
      title="Hapus Eviden"
      message={`Yakin menghapus “${deleting?.name || ''}”? Tindakan ini tidak dapat dibatalkan.`}
    />
  </>
}

function EvidenForm({ item, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', driveUrl: '' })
  useEffect(() => {
    if (item) setForm({ id: item.id, name: item.name || '', driveUrl: item.driveUrl || '' })
  }, [item])

  return <Modal
    open={Boolean(item)}
    onClose={onClose}
    title={item?.id ? 'Edit Eviden' : 'Tambah Eviden'}
    size="sm"
    footer={<><button className="btn-ghost" onClick={onClose}>Batal</button><button className="btn-primary" onClick={() => onSave(form)}>💾 Simpan</button></>}
  >
    <div className="space-y-4">
      <div><label className="label">Nama Eviden *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: SK Tim Pelaksana KBC" autoFocus /></div>
      <div><label className="label">Link Google Drive</label><input className="input" type="url" value={form.driveUrl} onChange={(e) => setForm({ ...form, driveUrl: e.target.value })} placeholder="https://drive.google.com/..." /><p className="text-xs text-slate-500 mt-1">Boleh dikosongkan dan diisi nanti melalui Edit.</p></div>
    </div>
  </Modal>
}
