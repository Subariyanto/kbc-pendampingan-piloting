import { useRef, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { ConfirmDialog } from '../components/Modal.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { downloadJSON, readFileAsDataURL, readJSONFile } from '../lib/utils.js'
import { SUPABASE_ENABLED } from '../lib/supabase.js'
import { LOCAL_ONLY_MODE } from '../lib/appMode.js'
import { loadSnapshot } from '../lib/repository.js'

export default function PengaturanPage() {
  const { state, updateSettings, resetAll, restoreAll } = useData()
  const toast = useToast()
  const [form, setForm] = useState(state.settings)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(null)
  const fileRestore = useRef(null)
  const fileLogo = useRef(null)

  const [migrating, setMigrating] = useState(false)
  const [confirmMigrate, setConfirmMigrate] = useState(null)

  const onMigrateFromSupabase = async () => {
    setMigrating(true)
    try {
      const snapshot = await loadSnapshot()
      setConfirmMigrate(snapshot)
    } catch (err) {
      toast.error('Gagal ambil data Supabase: ' + err.message)
    } finally {
      setMigrating(false)
    }
  }

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const onSave = () => {
    updateSettings(form)
    toast.success('Pengaturan tersimpan')
  }

  const onLogo = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 1024 * 512) { toast.error('Ukuran logo maksimal 512 KB'); return }
    try {
      const dataUrl = await readFileAsDataURL(f)
      upd('logoDataUrl', dataUrl)
      toast.success('Logo siap disimpan. Klik "Simpan" untuk menerapkan.')
    } catch (err) { toast.error(err.message) }
  }

  const onBackup = () => {
    downloadJSON(`backup-kbc-${Date.now()}.json`, state)
    toast.success('Backup diunduh')
  }

  const onRestoreFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const data = await readJSONFile(f)
      setConfirmRestore(data)
    } catch (err) { toast.error(`Gagal membaca: ${err.message}`) } finally {
      e.target.value = ''
    }
  }

  return (
    <>
      <PageHeader
        title="Pengaturan Aplikasi"
        description="Kelola identitas instansi, logo, bobot aspek KBC, dan backup data."
        icon="⚙️"
        actions={<button className="btn-primary" onClick={onSave}>💾 Simpan Pengaturan</button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="card-pad lg:col-span-2">
          <p className="font-semibold text-navy-900 mb-3">Identitas Instansi</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nama Instansi"><input className="input" value={form.namaInstansi} onChange={(e) => upd('namaInstansi', e.target.value)} /></Field>
            <Field label="Sub Instansi"><input className="input" value={form.subInstansi} onChange={(e) => upd('subInstansi', e.target.value)} /></Field>
            <Field label="Kabupaten"><input className="input" placeholder="Jember" value={form.kabupaten || ''} onChange={(e) => upd('kabupaten', e.target.value)} /></Field>
            <Field label="Tahun Pelajaran"><input className="input" placeholder="2025/2026" value={form.tahunPelajaran} onChange={(e) => upd('tahunPelajaran', e.target.value)} /></Field>
            <Field label="Ketua Pokjawas"><input className="input" value={form.ketuaPokjawas} onChange={(e) => upd('ketuaPokjawas', e.target.value)} /></Field>
            <Field label="NIP Ketua"><input className="input" value={form.nipKetua} onChange={(e) => upd('nipKetua', e.target.value)} /></Field>
          </div>
        </div>
        <div className="card-pad lg:col-span-1">
          <p className="font-semibold text-navy-900 mb-3">Logo Instansi</p>
          <div className="flex flex-col items-center gap-3">
            {form.logoDataUrl ? (
              <img src={form.logoDataUrl} alt="logo" className="w-24 h-24 rounded-lg object-contain border border-slate-200 p-1" />
            ) : (
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">Logo</div>
            )}
            <input ref={fileLogo} type="file" accept="image/*" className="hidden" onChange={onLogo} />
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => fileLogo.current?.click()}>📂 Pilih Logo</button>
              {form.logoDataUrl && <button className="btn-danger" onClick={() => upd('logoDataUrl', '')}>✕ Hapus</button>}
            </div>
            <p className="text-xs text-slate-500 text-center">PNG/JPG, maks. 512 KB.</p>
          </div>
        </div>
      </div>

      <div className="card-pad mb-4">
        <p className="font-semibold text-navy-900 mb-3">Bobot Aspek KBC (untuk perhitungan rata-rata tertimbang)</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(form.bobot || {}).map(([k, v]) => (
            <Field key={k} label={kapitalize(k)}>
              <div className="flex items-center gap-1">
                <input
                  className="input"
                  type="number" min="0" max="100"
                  value={v}
                  onChange={(e) => upd('bobot', { ...form.bobot, [k]: Number(e.target.value) })}
                />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </Field>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">Total disarankan 100%. Bobot dipakai untuk laporan rata-rata tertimbang ke depan.</p>
      </div>

      {LOCAL_ONLY_MODE && SUPABASE_ENABLED && (
        <div className="card-pad mb-4 border-2 border-amber-200 bg-amber-50/40">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📥</span>
            <div className="flex-1">
              <p className="font-semibold text-navy-900">Migrasi Data dari Supabase</p>
              <p className="text-sm text-slate-600 mt-1">
                Tarik data madrasah, pengawas, jadwal, dan lainnya dari database Supabase lama ke localStorage browser ini. Hanya perlu sekali kalau Bapak migrasi dari mode online.
              </p>
              <div className="flex gap-2 mt-3">
                <button className="btn-toska" onClick={onMigrateFromSupabase} disabled={migrating}>
                  {migrating ? 'Mengambil data…' : '⬇ Tarik Data dari Supabase'}
                </button>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                ⚠️ Setelah migrasi, data lokal saat ini akan diganti dengan data dari Supabase. Backup dulu kalau ada perubahan yang mau dipertahankan.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card-pad mb-4">
        <p className="font-semibold text-navy-900 mb-3">Backup &amp; Restore Data</p>
        <p className="text-sm text-slate-600 mb-3">Backup mencakup seluruh data: madrasah, pengawas, jadwal, instrumen, pendampingan, eviden, tindak lanjut, dan pengaturan.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-toska" onClick={onBackup}>⬇ Backup ke JSON</button>
          <input ref={fileRestore} type="file" accept="application/json,.json" className="hidden" onChange={onRestoreFile} />
          <button className="btn-ghost" onClick={() => fileRestore.current?.click()}>⬆ Restore dari JSON</button>
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>↻ Reset Data Demo</button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => { resetAll(); toast.success('Data dikembalikan ke seed demo'); setForm({ ...state.settings }) }}
        title="Reset Data Demo"
        confirmText="Reset"
        message="Seluruh data akan dikembalikan ke kondisi awal demo. Tindakan ini tidak dapat dibatalkan."
      />

      <ConfirmDialog
        open={!!confirmRestore}
        onClose={() => setConfirmRestore(null)}
        onConfirm={() => {
          try {
            restoreAll(confirmRestore)
            toast.success('Data berhasil di-restore')
          } catch (err) { toast.error(err.message) }
        }}
        title="Restore Data"
        confirmText="Restore"
        tone="primary"
        message="Data saat ini akan diganti dengan isi file backup. Yakin melanjutkan?"
      />
      <ConfirmDialog
        open={!!confirmMigrate}
        onClose={() => setConfirmMigrate(null)}
        onConfirm={() => {
          try {
            restoreAll(confirmMigrate)
            toast.success('Data Supabase berhasil dimigrasi ke browser ini')
            setConfirmMigrate(null)
          } catch (err) { toast.error(err.message) }
        }}
        title="Migrasi Data Supabase"
        confirmText="Migrasi Sekarang"
        tone="primary"
        message={confirmMigrate
          ? `Data lokal akan diganti dengan: ${confirmMigrate.madrasah?.length || 0} madrasah, ${confirmMigrate.pengawas?.length || 0} pengawas, ${confirmMigrate.jadwal?.length || 0} jadwal, ${confirmMigrate.pendampingan?.length || 0} pendampingan. Lanjutkan?`
          : ''
        }
      />
    </>
  )
}

function Field({ label, children }) {
  return <div><label className="label">{label}</label>{children}</div>
}

function kapitalize(s) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}
