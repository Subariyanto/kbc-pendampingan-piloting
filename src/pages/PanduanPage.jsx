import PageHeader from '../components/PageHeader.jsx'

export default function PanduanPage() {
  return (
    <>
      <PageHeader
        title="Panduan Penggunaan"
        description="Panduan lengkap menggunakan Aplikasi Pendampingan Piloting KBC"
        icon="📘"
      />

      <div className="card-pad">
        <div className="prose max-w-none">
          <h3 className="text-lg font-semibold text-navy-900 mb-3">Panduan Penggunaan Aplikasi</h3>
          
          <div className="space-y-6">
            <section>
              <h4 className="font-semibold text-navy-800 mb-2">1. Aktivasi & Login</h4>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• Admin mendapat kode master untuk aktivasi pertama kali</li>
                <li>• Admin bisa membuat kode aktivasi untuk pengawas melalui menu "Kode Aktivasi"</li>
                <li>• Pengawas aktivasi dengan kode dari admin, lalu bisa login dengan nama & password yang dibuat</li>
                <li>• Setelah logout, login kembali dengan nama yang sama (case-insensitive)</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold text-navy-800 mb-2">2. Data Utama</h4>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• <strong>Pengaturan:</strong> Isi identitas instansi, tahun pelajaran, dan kabupaten</li>
                <li>• <strong>Pengawas Pendamping:</strong> Kelola data pengawas yang mendampingi madrasah piloting</li>
                <li>• <strong>Madrasah Piloting:</strong> Kelola data madrasah yang didampingi</li>
                <li>• <strong>Instrumen KBC:</strong> Kelola aspek dan indikator penilaian (bisa disesuaikan)</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold text-navy-800 mb-2">3. Kegiatan Pendampingan</h4>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• <strong>Jadwal:</strong> Buat jadwal kunjungan pendampingan ke madrasah</li>
                <li>• <strong>Hasil Pendampingan:</strong> Input hasil kunjungan dengan skor per indikator</li>
                <li>• <strong>Eviden:</strong> Upload/link bukti kegiatan (foto, dokumen, video)</li>
                <li>• <strong>Rekomendasi & TL:</strong> Catat rekomendasi dan tindak lanjut untuk madrasah</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold text-navy-800 mb-2">4. Laporan</h4>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• <strong>Capaian Madrasah:</strong> Lihat progress dan skor tiap madrasah</li>
                <li>• Grafik capaian per aspek dan per madrasah</li>
                <li>• Export laporan ke PDF atau Excel</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold text-navy-800 mb-2">5. Backup & Restore</h4>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• <strong>Backup:</strong> Download semua data ke file JSON</li>
                <li>• <strong>Restore:</strong> Upload file backup untuk mengembalikan data</li>
                <li>• <strong>Reset:</strong> Hapus semua data dan mulai dari awal (hati-hati!)</li>
              </ul>
            </section>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-amber-800">
                <strong>Tips:</strong> Lakukan backup data secara rutin (minimal 1x seminggu) untuk menghindari kehilangan data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
