// Konstanta domain: instrumen KBC, opsi, role, jenjang, dll.
import { uid } from './utils.js'

export const ROLES = {
  ADMIN: 'admin',
  PENGAWAS: 'pengawas'
}

export const ROLE_LABELS = {
  admin: 'Admin',
  pengawas: 'Pengawas Madrasah'
}

export const JENJANG_OPTIONS = ['RA', 'MI', 'MTs', 'MA', 'MAK']
export const STATUS_NEGERI_SWASTA = ['Negeri', 'Swasta']
export const STATUS_PILOTING = ['Aktif', 'Cadangan', 'Selesai']

export const BENTUK_KEGIATAN = [
  'Sosialisasi',
  'Bimtek',
  'Observasi',
  'Coaching',
  'Refleksi',
  'Monitoring',
  'Evaluasi'
]

export const STATUS_JADWAL = ['Terjadwal', 'Terlaksana', 'Ditunda', 'Selesai']

// Default isian otomatis untuk Form Jadwal (per Bentuk Kegiatan)
export const MATERI_DEFAULTS = {
  Sosialisasi: 'Sosialisasi Program Pendampingan Implementasi Kurikulum Berbasis Cinta (KBC) — pengenalan konsep Panca Cinta dan tahapan implementasi di madrasah piloting.',
  Bimtek: 'Bimbingan Teknis Implementasi KBC — penguatan kapasitas kepala madrasah dan guru dalam perencanaan serta pelaksanaan pembelajaran berbasis cinta.',
  Observasi: 'Observasi pelaksanaan pembelajaran berbasis cinta dan budaya madrasah — pengamatan langsung praktik di kelas, lingkungan, dan kegiatan pembiasaan.',
  Coaching: 'Coaching dan pendampingan implementasi KBC — sesi pendampingan personal untuk kepala madrasah dan guru dalam pengembangan budaya cinta.',
  Refleksi: 'Refleksi pelaksanaan pendampingan KBC — diskusi capaian, kendala, dan rekomendasi tindak lanjut bersama tim madrasah piloting.',
  Monitoring: 'Monitoring kemajuan implementasi KBC — pemantauan progres pelaksanaan program piloting dan tindak lanjut periode sebelumnya.',
  Evaluasi: 'Evaluasi akhir implementasi KBC — penilaian capaian pelaksanaan Kurikulum Berbasis Cinta dan penyusunan rekomendasi keberlanjutan.'
}

export const CATATAN_DEFAULTS = {
  Sosialisasi: 'Persiapan: surat tugas, daftar hadir, bahan paparan KBC. Sasaran: kepala madrasah, wakil, dan perwakilan guru. Output: kesepahaman bersama dan komitmen implementasi KBC.',
  Bimtek: 'Persiapan: modul bimtek, contoh modul ajar berbasis cinta, instrumen praktik. Sasaran: guru dan tim KBC madrasah. Output: produk perencanaan pembelajaran KBC.',
  Observasi: 'Persiapan: instrumen observasi, lembar catatan, dokumentasi foto/video. Sasaran: minimal 2 kelas dan lingkungan madrasah. Output: catatan praktik baik dan rekomendasi perbaikan.',
  Coaching: 'Persiapan: catatan capaian sebelumnya, target sesi, rencana tindak lanjut. Sasaran: kepala madrasah/guru terpilih. Output: kesepakatan langkah perbaikan dan jadwal sesi berikutnya.',
  Refleksi: 'Persiapan: hasil observasi/monitoring, instrumen refleksi, ringkasan capaian. Sasaran: tim KBC madrasah. Output: catatan refleksi dan rencana perbaikan.',
  Monitoring: 'Persiapan: checklist monitoring, laporan progres periode sebelumnya, eviden. Sasaran: kepala madrasah dan tim KBC. Output: status capaian indikator dan daftar tindak lanjut.',
  Evaluasi: 'Persiapan: instrumen evaluasi lengkap, eviden, laporan akhir. Sasaran: seluruh tim KBC madrasah. Output: laporan evaluasi dan rekomendasi keberlanjutan program KBC.'
}

export const STATUS_TINDAK_LANJUT = [
  'Belum Dikerjakan',
  'Proses',
  'Selesai',
  'Perlu Pendampingan Ulang'
]

export const JENIS_EVIDEN = [
  'Foto',
  'Dokumen',
  'Video',
  'Link',
  'Notulen',
  'SK Tim',
  'Jadwal',
  'Modul Ajar',
  'Program Kerja'
]

export const SKOR_LABELS = {
  1: 'Belum Mulai',
  2: 'Sudah Mulai',
  3: 'Sudah Terlaksana',
  4: 'Terlaksana Sangat Baik'
}

// Aspek & indikator default. Disimpan di state agar admin dapat mengubahnya.
export function buildDefaultInstrumen() {
  const aspekTemplate = [
    {
      kode: 'A',
      nama: 'Perencanaan Implementasi KBC',
      indikator: [
        'Madrasah memiliki dokumen rencana implementasi KBC.',
        'Tim pelaksana KBC telah dibentuk.',
        'Program KBC terintegrasi dalam kurikulum madrasah.',
        'Nilai KBC masuk dalam perencanaan pembelajaran.',
        'Madrasah memiliki jadwal kegiatan pembiasaan berbasis cinta.'
      ]
    },
    {
      kode: 'B',
      nama: 'Pelaksanaan Pembelajaran Berbasis Cinta',
      indikator: [
        'Guru membangun suasana belajar aman, nyaman, dan menyenangkan.',
        'Guru menanamkan nilai kasih sayang, empati, toleransi, dan kepedulian.',
        'Pembelajaran menghargai perbedaan peserta didik.',
        'Guru memberi teladan komunikasi santun.',
        'Peserta didik aktif, dihargai, dan tidak mengalami kekerasan verbal/fisik.'
      ]
    },
    {
      kode: 'C',
      nama: 'Budaya Madrasah Berbasis Cinta',
      indikator: [
        'Warga madrasah membiasakan salam, senyum, sapa, sopan, dan santun.',
        'Madrasah membangun budaya anti-bullying.',
        'Madrasah membiasakan kepedulian sosial.',
        'Madrasah membangun hubungan harmonis guru, siswa, orang tua, dan masyarakat.',
        'Madrasah menerapkan pembiasaan cinta tanah air dan cinta lingkungan.'
      ]
    },
    {
      kode: 'D',
      nama: 'Panca Cinta KBC',
      indikator: [
        'Cinta kepada Allah dan Rasulullah.',
        'Cinta kepada ilmu.',
        'Cinta kepada diri sendiri dan sesama.',
        'Cinta kepada lingkungan.',
        'Cinta kepada tanah air.'
      ]
    },
    {
      kode: 'E',
      nama: 'Evaluasi dan Tindak Lanjut',
      indikator: [
        'Madrasah melakukan refleksi pelaksanaan KBC.',
        'Guru menyusun catatan perkembangan karakter peserta didik.',
        'Kepala madrasah melakukan supervisi implementasi KBC.',
        'Madrasah menyusun rencana tindak lanjut.',
        'Ada bukti/eviden kegiatan KBC.'
      ]
    }
  ]

  return aspekTemplate.map((aspek) => ({
    id: uid('aspek'),
    kode: aspek.kode,
    nama: aspek.nama,
    indikator: aspek.indikator.map((teks, idx) => ({
      id: uid('ind'),
      nomor: idx + 1,
      teks
    }))
  }))
}

export const TONE_CLASSES = {
  slate: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  navy: 'bg-navy-100 text-navy-800 ring-1 ring-navy-200',
  toska: 'bg-toska-100 text-toska-800 ring-1 ring-toska-200',
  gold: 'bg-gold-100 text-gold-800 ring-1 ring-gold-200',
  emerald: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  rose: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  sky: 'bg-sky-100 text-sky-800 ring-1 ring-sky-200'
}
