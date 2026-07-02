// Header dokumen: logo + nama instansi (2 kolom)
export default function PrintHeader({ settings, judul = 'LAPORAN PENDAMPINGAN IMPLEMENTASI KBC' }) {
  const logoSrc = settings.logoDataUrl || 'https://upload.wikimedia.org/wikipedia/commons/6/68/Logo_Kementerian_Agama_Republik_Indonesia.svg'
  return (
    <div className="pb-4 mb-4 border-b-2 border-navy-900">
      <div className="flex items-center gap-4">
        <img src={logoSrc} alt="logo" className="w-20 h-20 object-contain" />
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

export function PrintSignature({ settings, namaPengawas = '____________________', nipPengawas, tanggal, namaLengkap }) {
  const t = tanggal ? new Date(tanggal) : new Date()
  const tanggalLabel = t.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const namaKabupaten = settings.kabupaten || 'Jember'

  // Dua kolom: Mengetahui Pengawas Pendamping (kiri) dan Pengawas Pendamping (kanan).
  return (
    <div className="grid grid-cols-2 gap-12 mt-10 text-sm font-serif">
      <div>
        <p>Mengetahui,</p>
        <p>Pengawas Pendamping</p>
        <div style={{ height: 80 }} />
        <p className="font-semibold underline">{settings.ketuaPokjawas}</p>
        {settings.nipKetua && <p>NIP. {settings.nipKetua}</p>}
      </div>
      <div className="text-left">
        <p>{namaKabupaten}, {tanggalLabel}</p>
        <p>Pengawas Pendamping,</p>
        <div style={{ height: 80 }} />
        <p className="font-semibold underline">{namaPengawas}</p>
        {nipPengawas && <p>NIP. {nipPengawas}</p>}
        {namaLengkap && <p className="mt-1">Nama Lengkap (gelar): {namaLengkap}</p>}
      </div>
    </div>
  )
}
