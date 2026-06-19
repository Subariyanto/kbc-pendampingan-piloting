// Konstanta domain: instrumen KBC, opsi, role, jenjang, dll.
import { uid } from './utils.js'

export const ROLES = {
  ADMIN: 'admin',
  PENGAWAS: 'pengawas',
  KEPALA: 'kepala',
  VIEWER: 'viewer'
}

export const ROLE_LABELS = {
  admin: 'Admin',
  pengawas: 'Pengawas Madrasah',
  kepala: 'Kepala Madrasah',
  viewer: 'Viewer / Pimpinan'
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
  1: 'Belum Terlaksana',
  2: 'Mulai Terlaksana',
  3: 'Terlaksana',
  4: 'Sangat Baik'
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
