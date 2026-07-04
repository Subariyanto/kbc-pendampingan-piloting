import { useRef, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { ConfirmDialog } from '../components/Modal.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { downloadJSON, readJSONFile } from '../lib/utils.js'

export default function BackupRestorePage() {
  const { state, resetAll, restoreAll } = useData()
  const toast = useToast()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(null)
  const fileRestore = useRef(null)

  const onBackup = () => {
    downloadJSON(`backup-kbc-pendampingan-${new Date().toISOString().slice(0, 10)}.json`, state)
    toast.success('Backup berhasil diunduh')
  }

  const onRestoreFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const data = await readJSONFile(f)
      setConfirmRestore(data)
    } catch (err) {
      toast.error('Gagal membaca file: ' + err.message)
    } finally {
      e.target.value = ''
    }
  }

  return (
    <>
      <PageHeader
        title="Backup &amp; Restore Data"
        description="Backup mencakup seluruh data: madrasah, pengawas, jadwal, instrumen, pendampingan, eviden, tindak lanjut, pengaturan, dan daftar pengguna."
        icon="💾"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Backup */}
        <div className="card-pad">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⬇</span>
            <div>
              <p className="font-semibold text-navy-900 text-lg">Backup Data</p>
              <p className="text-sm text-slate-600 mt-1">
                Unduh seluruh data aplikasi ke file JSON. Simpan di tempat aman untuk cadangan. Bisa dipakai restore nanti atau pindah ke browser/device lain.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-500">Yang termasuk dalam backup:</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Data madrasah, pengawas, jadwal pendampingan</li>
                  <li>Hasil pendampingan & instrumen KBC</li>
                  <li>Eviden, tindak lanjut, laporan</li>
                  <li>Pengaturan instansi & bobot KBC</li>
                  <li>Daftar pengguna (akun login)</li>
                </ul>
              </div>
              <button className="btn-toska mt-4" onClick={onBackup}>⬇ Backup ke JSON</button>
            </div>
          </div>
        </div>

        {/* Restore */}
        <div className="card-pad">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⬆</span>
            <div>
              <p className="font-semibold text-navy-900 text-lg">Restore Data</p>
              <p className="text-sm text-slate-600 mt-1">
                Pulihkan data dari file backup JSON. Data saat ini akan <strong>diganti</strong> dengan isi file backup. Pastikan Anda sudah backup data terbaru sebelum restore.
              </p>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                ⚠️ <strong>Perhatian:</strong> Restore akan menimpa seluruh data yang ada saat ini. Pastikan backup terbaru sudah disimpan.
              </div>
              <input ref={fileRestore} type="file" accept="application/json,.json" className="hidden" onChange={onRestoreFile} />
              <button className="btn-primary mt-4" onClick={() => fileRestore.current?.click()}>⬆ Pilih File & Restore</button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="card-pad border-2 border-rose-200">
        <div className="flex items-start gap-3">
          <span className="text-3xl">↻</span>
          <div>
            <p className="font-semibold text-rose-800 text-lg">Reset Data ke Awal</p>
            <p className="text-sm text-slate-600 mt-1">
              Kembalikan seluruh data ke kondisi awal (data demo). <strong className="text-rose-700">Tindakan ini tidak dapat dibatalkan.</strong> Backup dulu kalau ada data penting.
            </p>
            <button className="btn-danger mt-4" onClick={() => setConfirmReset(true)}>↻ Reset Data</button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAll()
          toast.success('Data dikembalikan ke kondisi awal')
        }}
        title="Reset Semua Data"
        confirmText="Ya, Reset Sekarang"
        message="Seluruh data akan dikembalikan ke kondisi awal demo. Semua perubahan akan hilang. Tindakan ini tidak dapat dibatalkan. Yakin?"
      />

      <ConfirmDialog
        open={!!confirmRestore}
        onClose={() => setConfirmRestore(null)}
        onConfirm={() => {
          try {
            restoreAll(confirmRestore)
            toast.success('Data berhasil di-restore. Halaman akan dimuat ulang.')
            setTimeout(() => window.location.reload(), 800)
          } catch (err) {
            toast.error(err.message)
          }
        }}
        title="Restore Data dari Backup"
        confirmText="Ya, Restore"
        tone="primary"
        message={confirmRestore
          ? `File berisi: ${confirmRestore.madrasah?.length || 0} madrasah, ${confirmRestore.pengawas?.length || 0} pengawas, ${confirmRestore.jadwal?.length || 0} jadwal, ${confirmRestore.pendampingan?.length || 0} pendampingan. Data saat ini akan diganti. Lanjutkan?`
          : 'Data saat ini akan diganti dengan isi file backup. Yakin melanjutkan?'
        }
      />
    </>
  )
}