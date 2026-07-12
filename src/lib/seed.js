import { uid, todayISO } from './utils.js'
import { buildDefaultInstrumen } from './constants.js'

// Default settings & demo seed data

export function buildDefaultSettings() {
  return {
    namaInstansi: 'Kelompok Kerja Pengawas Madrasah',
    subInstansi: 'Kementerian Agama Kabupaten Jember',
    tahunPelajaran: '2025/2026',
    ketuaPokjawas: 'Subariyanto, S.Pd, M.Pd.I.',
    nipKetua: '197002122005011004',
    kepalaKemenag: '',
    nipKepalaKemenag: '',
    logoDataUrl: '',
    bobot: { perencanaan: 20, pelaksanaan: 20, budaya: 20, panca: 20, evaluasi: 20 }
  }
}

export function buildDefaultUsers() {
  // Akun demo. Password disimpan plaintext untuk demo lokal.
  // Hanya 2 role: admin dan pengawas
  return [
    {
      id: uid('user'),
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      nama: 'Admin Pokjawas',
      pengawasId: null,
      madrasahId: null
    },
    {
      id: uid('user'),
      username: 'pengawas',
      password: 'pengawas123',
      role: 'pengawas',
      nama: 'Drs. H. Ahmad Fauzi, M.Pd',
      pengawasRef: 'pengawas-fauzi',
      madrasahId: null
    }
  ]
}

export function buildEmptyData() {
  return {
    settings: buildDefaultSettings(),
    instrumen: buildDefaultInstrumen(),
    pengawas: [],
    madrasah: [],
    jadwal: [],
    pendampingan: [],
    tindakLanjut: [],
    eviden: [],
    users: buildDefaultUsers(),
    meta: { createdAt: todayISO(), version: 1 }
  }
}

export function buildSeedData() {
  const instrumen = buildDefaultInstrumen()

  const pengawas = [
    {
      id: 'pengawas-fauzi',
      nama: 'Drs. H. Ahmad Fauzi, M.Pd',
      nip: '196805121993031005',
      pangkat: 'Pembina Tk. I / IV-b',
      jabatan: 'Pengawas Madya',
      wilayah: 'KKMA 04 Sukowono',
      hp: '081234567001',
      email: 'fauzi@kemenagjember.go.id'
    },
    {
      id: 'pengawas-marwah',
      nama: 'Dra. Hj. Marwah Hidayati, M.Pd.I',
      nip: '197003151995032003',
      pangkat: 'Pembina / IV-a',
      jabatan: 'Pengawas Madya',
      wilayah: 'KKMA 01 Kaliwates',
      hp: '081234567002',
      email: 'marwah@kemenagjember.go.id'
    },
    {
      id: 'pengawas-saiful',
      nama: 'H. Saiful Anwar, S.Pd, M.Pd',
      nip: '197508201998031006',
      pangkat: 'Pembina / IV-a',
      jabatan: 'Pengawas Muda',
      wilayah: 'KKMA 02 Patrang',
      hp: '081234567003',
      email: 'saiful@kemenagjember.go.id'
    }
  ]

  const madrasah = [
    {
      id: 'madrasah-mtsn1',
      nama: 'MTsN 1 Jember',
      nsm: '121135090001',
      npsn: '20581234',
      jenjang: 'MTs',
      statusNS: 'Negeri',
      kecamatan: 'Kaliwates',
      kepala: 'Dra. Hj. Siti Aminah, M.Ag',
      hp: '081234567010',
      email: 'mtsn1@kemenagjember.go.id',
      pengawasId: 'pengawas-marwah',
      tahunPelajaran: '2025/2026',
      statusPiloting: 'Aktif',
      catatan: 'Madrasah piloting unggulan dengan dukungan komite kuat.'
    },
    {
      id: 'madrasah-min2',
      nama: 'MIN 2 Sukowono',
      nsm: '111135090002',
      npsn: '20581235',
      jenjang: 'MI',
      statusNS: 'Negeri',
      kecamatan: 'Sukowono',
      kepala: 'Hj. Nur Hayati, S.Pd.I, M.Pd',
      hp: '081234567011',
      email: 'min2sukowono@kemenagjember.go.id',
      pengawasId: 'pengawas-fauzi',
      tahunPelajaran: '2025/2026',
      statusPiloting: 'Aktif',
      catatan: 'Sudah memiliki tim KBC dan SK pelaksana.'
    },
    {
      id: 'madrasah-man1',
      nama: 'MAN 1 Jember',
      nsm: '131135090003',
      npsn: '20581236',
      jenjang: 'MA',
      statusNS: 'Negeri',
      kecamatan: 'Patrang',
      kepala: 'Drs. H. Mahmud Yunus, M.Pd',
      hp: '081234567012',
      email: 'man1jember@kemenagjember.go.id',
      pengawasId: 'pengawas-saiful',
      tahunPelajaran: '2025/2026',
      statusPiloting: 'Aktif',
      catatan: 'Sedang menyusun kurikulum operasional berbasis cinta.'
    },
    {
      id: 'madrasah-mts-baitul',
      nama: 'MTs Baitul Hikmah',
      nsm: '121235090004',
      npsn: '20581237',
      jenjang: 'MTs',
      statusNS: 'Swasta',
      kecamatan: 'Sukowono',
      kepala: 'H. Abdul Rohman, S.Ag',
      hp: '081234567013',
      email: 'mts.baitulhikmah@yahoo.com',
      pengawasId: 'pengawas-fauzi',
      tahunPelajaran: '2025/2026',
      statusPiloting: 'Aktif',
      catatan: 'Madrasah swasta dengan basis pesantren.'
    },
    {
      id: 'madrasah-ra-aisyiyah',
      nama: 'RA Aisyiyah Bustanul Athfal',
      nsm: '101235090005',
      npsn: '20581238',
      jenjang: 'RA',
      statusNS: 'Swasta',
      kecamatan: 'Kaliwates',
      kepala: 'Hj. Faridah, S.Pd.AUD',
      hp: '081234567014',
      email: 'ra.aisyiyahjember@gmail.com',
      pengawasId: 'pengawas-marwah',
      tahunPelajaran: '2025/2026',
      statusPiloting: 'Cadangan',
      catatan: 'Persiapan piloting tahap berikutnya.'
    }
  ]

  const today = new Date()
  const inDays = (n) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
  }

  const jadwal = [
    {
      id: uid('jadwal'),
      tanggal: inDays(-14),
      madrasahId: 'madrasah-mtsn1',
      pengawasId: 'pengawas-marwah',
      bentuk: 'Sosialisasi',
      materi: 'Sosialisasi Implementasi KBC dan Panca Cinta',
      tempat: 'Aula MTsN 1 Jember',
      status: 'Selesai',
      catatan: 'Dihadiri seluruh guru.'
    },
    {
      id: uid('jadwal'),
      tanggal: inDays(-7),
      madrasahId: 'madrasah-min2',
      pengawasId: 'pengawas-fauzi',
      bentuk: 'Bimtek',
      materi: 'Penyusunan Modul Ajar Berbasis Cinta',
      tempat: 'MIN 2 Sukowono',
      status: 'Selesai',
      catatan: 'Output: 6 modul ajar.'
    },
    {
      id: uid('jadwal'),
      tanggal: inDays(2),
      madrasahId: 'madrasah-man1',
      pengawasId: 'pengawas-saiful',
      bentuk: 'Observasi',
      materi: 'Observasi pembelajaran berbasis cinta',
      tempat: 'MAN 1 Jember',
      status: 'Terjadwal',
      catatan: 'Fokus kelas X dan XI.'
    },
    {
      id: uid('jadwal'),
      tanggal: inDays(5),
      madrasahId: 'madrasah-mts-baitul',
      pengawasId: 'pengawas-fauzi',
      bentuk: 'Coaching',
      materi: 'Coaching Kepala Madrasah & Tim KBC',
      tempat: 'MTs Baitul Hikmah',
      status: 'Terjadwal',
      catatan: ''
    },
    {
      id: uid('jadwal'),
      tanggal: inDays(10),
      madrasahId: 'madrasah-ra-aisyiyah',
      pengawasId: 'pengawas-marwah',
      bentuk: 'Refleksi',
      materi: 'Refleksi awal kesiapan piloting',
      tempat: 'RA Aisyiyah',
      status: 'Terjadwal',
      catatan: ''
    }
  ]

  // Helper: bangun skor random sesuai instrumen tertentu, untuk seed.
  function makeSkor(seedFn) {
    const skor = {}
    instrumen.forEach((aspek) => {
      aspek.indikator.forEach((ind, idxInd) => {
        skor[ind.id] = seedFn(aspek.kode, idxInd)
      })
    })
    return skor
  }

  const pendampingan = [
    {
      id: uid('pen'),
      tanggal: inDays(-12),
      madrasahId: 'madrasah-mtsn1',
      pengawasId: 'pengawas-marwah',
      kegiatan: 'Sosialisasi & Observasi Awal',
      temuanPositif: 'Komitmen Kepala Madrasah dan tim guru sangat baik. Dokumen rencana KBC sudah dirintis.',
      kendala: 'Belum semua guru memahami konsep Panca Cinta.',
      observasi: 'Pembelajaran berlangsung kondusif, suasana kelas hangat.',
      rekomendasi: 'Perlu Bimtek lanjutan tentang integrasi Panca Cinta dalam modul ajar.',
      rencanaTindakLanjut: 'Madrasah menyusun modul ajar terintegrasi KBC dalam 1 bulan.',
      batasTL: inDays(20),
      statusTL: 'Proses',
      buktiLink: 'https://drive.google.com/contoh/mtsn1-sosialisasi',
      skor: makeSkor((kode) => (kode === 'D' ? 4 : 3))
    },
    {
      id: uid('pen'),
      tanggal: inDays(-6),
      madrasahId: 'madrasah-min2',
      pengawasId: 'pengawas-fauzi',
      kegiatan: 'Bimtek Modul Ajar KBC',
      temuanPositif: 'Tim guru produktif menyusun modul ajar.',
      kendala: 'Keterbatasan referensi modul khas Panca Cinta.',
      observasi: 'Diskusi aktif, hasil 6 modul ajar.',
      rekomendasi: 'Perlu pendampingan praktik di kelas pada bulan depan.',
      rencanaTindakLanjut: 'Implementasi modul ajar di kelas IV dan V.',
      batasTL: inDays(25),
      statusTL: 'Belum Dikerjakan',
      buktiLink: 'https://drive.google.com/contoh/min2-bimtek',
      skor: makeSkor((kode, idx) => (idx % 2 === 0 ? 3 : 4))
    },
    {
      id: uid('pen'),
      tanggal: inDays(-3),
      madrasahId: 'madrasah-man1',
      pengawasId: 'pengawas-saiful',
      kegiatan: 'Monitoring Awal',
      temuanPositif: 'KOM sudah disusun, ada SK Tim KBC.',
      kendala: 'Pembiasaan harian belum konsisten.',
      observasi: 'Beberapa kelas sudah menerapkan refleksi karakter di akhir pembelajaran.',
      rekomendasi: 'Penguatan budaya 5S dan pembiasaan harian.',
      rencanaTindakLanjut: 'Madrasah membuat jadwal pembiasaan dan piket karakter.',
      batasTL: inDays(15),
      statusTL: 'Proses',
      buktiLink: '',
      skor: makeSkor((kode) => (kode === 'A' ? 3 : kode === 'C' ? 2 : 3))
    },
    {
      id: uid('pen'),
      tanggal: inDays(-1),
      madrasahId: 'madrasah-mts-baitul',
      pengawasId: 'pengawas-fauzi',
      kegiatan: 'Coaching Awal',
      temuanPositif: 'Kepala madrasah responsif, tim KBC dibentuk.',
      kendala: 'Belum ada dokumen rencana implementasi tertulis.',
      observasi: 'Suasana madrasah religius, integrasi pesantren mendukung.',
      rekomendasi: 'Susun dokumen rencana implementasi dan kalender pembiasaan.',
      rencanaTindakLanjut: 'Madrasah menyusun dokumen dalam 2 minggu.',
      batasTL: inDays(14),
      statusTL: 'Belum Dikerjakan',
      buktiLink: '',
      skor: makeSkor((kode, idx) => (kode === 'A' ? 2 : kode === 'D' ? 3 : 2 + (idx % 2)))
    },
    {
      id: uid('pen'),
      tanggal: inDays(-20),
      madrasahId: 'madrasah-ra-aisyiyah',
      pengawasId: 'pengawas-marwah',
      kegiatan: 'Refleksi & Identifikasi Kebutuhan',
      temuanPositif: 'Pembiasaan cinta lingkungan dan tanah air sudah berjalan.',
      kendala: 'Pembelajaran berbasis cinta belum terdokumentasi.',
      observasi: 'Anak-anak ceria dan terbiasa salam-sapa.',
      rekomendasi: 'Dokumentasikan praktik baik dan pembiasaan.',
      rencanaTindakLanjut: 'RA membuat portofolio pembiasaan KBC.',
      batasTL: inDays(-2),
      statusTL: 'Selesai',
      buktiLink: 'https://drive.google.com/contoh/ra-aisyiyah-refleksi',
      skor: makeSkor((kode) => (kode === 'B' ? 2 : kode === 'D' ? 4 : 3))
    }
  ]

  const tindakLanjut = [
    {
      id: uid('tl'),
      madrasahId: 'madrasah-mtsn1',
      temuan: 'Belum semua guru memahami konsep Panca Cinta.',
      rekomendasi: 'Bimtek lanjutan integrasi Panca Cinta dalam modul ajar.',
      pj: 'Wakamad Kurikulum',
      batas: inDays(20),
      status: 'Proses',
      catatan: 'Bimtek dijadwalkan minggu depan.'
    },
    {
      id: uid('tl'),
      madrasahId: 'madrasah-min2',
      temuan: 'Belum ada implementasi modul ajar di kelas.',
      rekomendasi: 'Implementasi modul ajar di kelas IV dan V.',
      pj: 'Guru kelas IV & V',
      batas: inDays(25),
      status: 'Belum Dikerjakan',
      catatan: ''
    },
    {
      id: uid('tl'),
      madrasahId: 'madrasah-man1',
      temuan: 'Pembiasaan harian belum konsisten.',
      rekomendasi: 'Susun jadwal pembiasaan dan piket karakter.',
      pj: 'Wakamad Kesiswaan',
      batas: inDays(-3),
      status: 'Proses',
      catatan: 'Sedang penyusunan SOP.'
    },
    {
      id: uid('tl'),
      madrasahId: 'madrasah-mts-baitul',
      temuan: 'Belum ada dokumen rencana implementasi tertulis.',
      rekomendasi: 'Susun dokumen rencana implementasi dan kalender pembiasaan.',
      pj: 'Tim KBC Madrasah',
      batas: inDays(14),
      status: 'Belum Dikerjakan',
      catatan: ''
    },
    {
      id: uid('tl'),
      madrasahId: 'madrasah-ra-aisyiyah',
      temuan: 'Pembiasaan KBC belum terdokumentasi.',
      rekomendasi: 'Membuat portofolio pembiasaan KBC bulanan.',
      pj: 'Kepala RA',
      batas: inDays(7),
      status: 'Selesai',
      catatan: 'Portofolio sudah disusun.'
    }
  ]

  const eviden = [
    {
      id: uid('ev'),
      madrasahId: 'madrasah-mtsn1',
      jenis: 'SK Tim',
      judul: 'SK Tim Pelaksana KBC MTsN 1 Jember',
      deskripsi: 'SK Kepala Madrasah Nomor 12/MTsN.1/KBC/2025.',
      tanggal: inDays(-15),
      link: 'https://drive.google.com/contoh/mtsn1-sk-tim'
    },
    {
      id: uid('ev'),
      madrasahId: 'madrasah-min2',
      jenis: 'Modul Ajar',
      judul: 'Modul Ajar Tema Cinta Lingkungan Kelas V',
      deskripsi: 'Hasil bimtek penyusunan modul ajar.',
      tanggal: inDays(-6),
      link: 'https://drive.google.com/contoh/min2-modul-ajar'
    },
    {
      id: uid('ev'),
      madrasahId: 'madrasah-man1',
      jenis: 'Foto',
      judul: 'Pembiasaan Salam Sapa Pagi',
      deskripsi: 'Dokumentasi pembiasaan pagi di gerbang madrasah.',
      tanggal: inDays(-3),
      link: 'https://drive.google.com/contoh/man1-foto-pembiasaan'
    },
    {
      id: uid('ev'),
      madrasahId: 'madrasah-mts-baitul',
      jenis: 'Notulen',
      judul: 'Notulen Coaching Awal',
      deskripsi: 'Notulen rapat koordinasi awal piloting KBC.',
      tanggal: inDays(-1),
      link: ''
    },
    {
      id: uid('ev'),
      madrasahId: 'madrasah-ra-aisyiyah',
      jenis: 'Program Kerja',
      judul: 'Program Pembiasaan Cinta Lingkungan',
      deskripsi: 'Program piket kebersihan dan tanam pohon.',
      tanggal: inDays(-20),
      link: 'https://drive.google.com/contoh/ra-aisyiyah-program'
    }
  ]

  return {
    settings: buildDefaultSettings(),
    instrumen,
    pengawas,
    madrasah,
    jadwal,
    pendampingan,
    tindakLanjut,
    eviden,
    users: buildDefaultUsers(),
    meta: { createdAt: todayISO(), version: 1 }
  }
}
