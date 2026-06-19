// Bagian header resmi untuk dokumen cetak
export default function PrintHeader({ settings, judul = 'LAPORAN PENDAMPINGAN IMPLEMENTASI KBC' }) {
  return (
    <div className="print-area pb-4 mb-4 border-b-2 border-navy-900">
      <div className="flex items-start gap-4">
        {settings.logoDataUrl ? (
          <img src={settings.logoDataUrl} alt="logo" className="w-20 h-20 object-contain" />
        ) : (
          <div className="w-20 h-20 rounded-lg border-2 border-navy-900 flex items-center justify-center font-bold text-navy-900">
            LOGO
          </div>
        )}
        <div className="flex-1 text-center font-serif">
          <p className="text-lg font-bold uppercase tracking-wide text-navy-900">{settings.namaInstansi}</p>
          <p className="text-base font-semibold uppercase text-navy-900">{settings.subInstansi}</p>
          <p className="text-sm text-slate-700">Tahun Pelajaran {settings.tahunPelajaran}</p>
        </div>
      </div>
      <h2 className="text-center mt-3 font-serif font-bold text-base uppercase tracking-wide text-navy-900">
        {judul}
      </h2>
    </div>
  )
}

export function PrintSignature({ settings, namaPengawas = '____________________', tempat = 'Jember', tanggal }) {
  const t = tanggal ? new Date(tanggal) : new Date()
  const tanggalLabel = t.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="grid grid-cols-2 gap-12 mt-10 text-sm font-serif">
      <div>
        <p>Mengetahui,</p>
        <p>Ketua Pokjawas Madrasah Kabupaten Jember</p>
        <div style={{ height: 80 }} />
        <p className="font-semibold underline">{settings.ketuaPokjawas}</p>
        {settings.nipKetua && <p>NIP. {settings.nipKetua}</p>}
      </div>
      <div className="text-left">
        <p>{tempat}, {tanggalLabel}</p>
        <p>Pengawas Pendamping,</p>
        <div style={{ height: 80 }} />
        <p className="font-semibold underline">{namaPengawas}</p>
      </div>
    </div>
  )
}
