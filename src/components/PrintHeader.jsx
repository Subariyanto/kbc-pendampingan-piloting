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

export function PrintSignature({ settings, namaPengawas = '____________________', nipPengawas, tanggal, namaLengkapPengawas = '', jabatan = 'Pengawas Pendamping', align = 'right' }) {
  const t = tanggal ? new Date(tanggal) : new Date()
  const tanggalLabel = t.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const namaKabupaten = settings.kabupaten || 'Jember'
  // Gabung nama + gelar jadi 1 baris uppercase
  const namaPengawasLengkap = namaLengkapPengawas ? namaLengkapPengawas.toUpperCase() : namaPengawas.toUpperCase()
  // 'right' = blok nempel kanan (dipakai laporan 2 kolom lain), 'center-right' = tengah agak ke kanan
  const wrapperStyle = align === 'center-right'
    ? { width: '45%', marginLeft: '50%' }
    : { width: '50%', marginLeft: 'auto' }

  return (
    <div className="mt-10 text-sm font-serif">
      <div style={wrapperStyle}>
        <p>{namaKabupaten}, {tanggalLabel}</p>
        <p>{jabatan},</p>
        <div style={{ height: 80 }} />
        <p className="font-semibold underline">{namaPengawasLengkap}</p>
        {nipPengawas && <p>NIP. {nipPengawas}</p>}
      </div>
      <div className="clear-both" />
    </div>
  )
}

// KOP Madrasah — dipakai untuk dokumen yang diterbitkan atas nama madrasah (bukan Pokjawas/Kemenag),
// misalnya SK Tim, Notulen, Program Kerja madrasah. Data diambil dari record Data Madrasah Piloting.
// Logo diposisikan absolute di kiri supaya blok teks (nama madrasah & judul dokumen) tetap center
// terhadap lebar halaman, sejajar satu sumbu vertikal.
export function PrintHeaderMadrasah({ madrasah, settings, judul = 'DOKUMEN MADRASAH' }) {
  const namaKabupaten = settings?.kabupaten || 'Jember'
  const logoSrc = madrasah?.logoDataUrl || ''
  return (
    <div className="pb-4 mb-4">
      <div className="relative pb-3 border-b-2 border-navy-900">
        <div className="absolute left-0 top-0 w-20 h-20 flex items-center justify-center">
          {logoSrc ? (
            <img src={logoSrc} alt="logo madrasah" className="w-20 h-20 object-contain" />
          ) : (
            <div className="w-20 h-20 rounded-full border-2 border-navy-900 flex items-center justify-center text-2xl">🏫</div>
          )}
        </div>
        <div className="text-center font-serif px-24">
          <p className="text-lg font-bold uppercase tracking-wide text-navy-900">{madrasah?.nama || '____________________'}</p>
          <p className="text-sm text-slate-700">{madrasah?.jenjang || '-'} {madrasah?.statusNS ? `(${madrasah.statusNS})` : ''} · Kecamatan {madrasah?.kecamatan || '____________________'}, {namaKabupaten}</p>
          <p className="text-xs text-slate-500">NSM: {madrasah?.nsm || '-'} &nbsp;·&nbsp; NPSN: {madrasah?.npsn || '-'}</p>
        </div>
      </div>
      <h2 className="text-center mt-3 font-serif font-bold text-base uppercase tracking-wide text-navy-900">
        {judul}
      </h2>
    </div>
  )
}

export function PrintSignatureLaporanLengkap({ settings, pengawas, user }) {
  const t = new Date()
  const tanggalLabel = t.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const namaKabupaten = settings.kabupaten || 'Jember'

  const isKetuaPokjawas = user && (
    user.role === 'admin' ||
    (user.nama && settings.ketuaPokjawas && (
      user.nama.toLowerCase().trim() === settings.ketuaPokjawas.toLowerCase().trim() ||
      user.nama.toLowerCase().includes(settings.ketuaPokjawas.toLowerCase().trim()) ||
      settings.ketuaPokjawas.toLowerCase().includes(user.nama.toLowerCase().trim())
    ))
  )

  const pengawasNamaLengkap = pengawas ? (pengawas.namaLengkap || pengawas.nama).toUpperCase() : '____________________'
  const pengawasNip = pengawas?.nip || ''
  const ketuaNama = settings.ketuaPokjawas || '____________________'
  const ketuaNip = settings.nipKetua || ''
  const kepalaNama = settings.kepalaKemenag || settings.kepalaInstansi || '____________________'
  const kepalaNip = settings.nipKepalaKemenag || settings.nipKepalaInstansi || ''

  if (isKetuaPokjawas) {
    return (
      <div className="grid grid-cols-2 gap-12 mt-10 text-sm font-serif">
        <div className="text-center">
          <p>Mengetahui,</p>
          <p>Kepala Kemenag,</p>
          <div style={{ height: 80 }} />
          <p className="font-semibold underline">{kepalaNama}</p>
          {kepalaNip && <p>NIP. {kepalaNip}</p>}
        </div>
        <div className="text-center">
          <p>{namaKabupaten}, {tanggalLabel}</p>
          <p>Ketua Pokjawas,</p>
          <div style={{ height: 80 }} />
          <p className="font-semibold underline">{ketuaNama}</p>
          {ketuaNip && <p>NIP. {ketuaNip}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-12 mt-10 text-sm font-serif">
      <div className="text-center">
        <p>Mengetahui,</p>
        <p>Ketua Pokjawas,</p>
        <div style={{ height: 80 }} />
        <p className="font-semibold underline">{ketuaNama}</p>
        {ketuaNip && <p>NIP. {ketuaNip}</p>}
      </div>
      <div className="text-center">
        <p>{namaKabupaten}, {tanggalLabel}</p>
        <p>Pengawas Pendamping,</p>
        <div style={{ height: 80 }} />
        <p className="font-semibold underline">{pengawasNamaLengkap}</p>
        {pengawasNip && <p>NIP. {pengawasNip}</p>}
      </div>
    </div>
  )
}
