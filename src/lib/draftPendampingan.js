// Auto-fill draft content untuk Hasil Pendampingan KBC
// Generator ini bikin draft berdasarkan: madrasah, instrumen aspek/indikator, skor yg sudah diisi.
// User tinggal edit/sesuaikan, ngga harus ngetik dari nol.

import { summarizeSkor } from './scoring.js'
import { kategoriKBC } from './utils.js'

const KEGIATAN_TEMPLATES = {
  awal: 'Pendampingan awal implementasi Kurikulum Berbasis Cinta (KBC) — sosialisasi visi, asesmen kondisi awal, dan penyusunan peta jalan implementasi.',
  pelaksanaan: 'Pendampingan pelaksanaan KBC — observasi pembelajaran berbasis cinta, pengembangan budaya madrasah, dan penguatan Panca Cinta.',
  evaluasi: 'Pendampingan evaluasi & refleksi implementasi KBC — review capaian, dokumentasi praktik baik, dan penyusunan rencana pengembangan lanjutan.'
}

function pickKegiatan(skorPct) {
  if (skorPct < 30) return KEGIATAN_TEMPLATES.awal
  if (skorPct < 75) return KEGIATAN_TEMPLATES.pelaksanaan
  return KEGIATAN_TEMPLATES.evaluasi
}

function aspekHighlights(skor, instrumen) {
  // Kelompokkan skor per aspek lalu cari yang tertinggi (positif) dan terendah (kendala)
  const out = instrumen.map((aspek) => {
    const indSkor = aspek.indikator.map((i) => skor?.[i.id] || 0).filter((s) => s > 0)
    const avg = indSkor.length ? indSkor.reduce((a, b) => a + b, 0) / indSkor.length : 0
    return { kode: aspek.kode, nama: aspek.nama, avg, hasSkor: indSkor.length > 0 }
  })
  const skored = out.filter((a) => a.hasSkor).sort((a, b) => b.avg - a.avg)
  return {
    teratas: skored.slice(0, 2),
    terbawah: skored.slice(-2).reverse()
  }
}

function generateTemuanPositif(madrasah, instrumen, skor) {
  const { teratas } = aspekHighlights(skor, instrumen)
  const lines = []
  if (teratas.length) {
    lines.push(`Madrasah ${madrasah?.nama || ''} menunjukkan komitmen yang baik dalam implementasi Kurikulum Berbasis Cinta (KBC), terutama pada aspek:`)
    teratas.forEach((a) => {
      lines.push(`• Aspek ${a.kode}. ${a.nama} — capaian rata-rata ${a.avg.toFixed(1)}/4, sudah berjalan konsisten.`)
    })
  } else {
    lines.push(`Madrasah ${madrasah?.nama || ''} memiliki kesiapan dasar untuk implementasi KBC: kepala madrasah ${madrasah?.kepala ? `(${madrasah.kepala}) ` : ''}responsif, suasana madrasah kondusif, dan tenaga pendidik antusias mengikuti pendampingan.`)
  }
  lines.push('Kegiatan pembiasaan keagamaan (Sholat berjamaah, tadarus, doa pagi) berjalan rutin dan menjadi pondasi penanaman nilai cinta kepada Allah dan Rasul-Nya.')
  return lines.join('\n')
}

function generateKendala(madrasah, instrumen, skor) {
  const { terbawah } = aspekHighlights(skor, instrumen)
  const lines = []
  if (terbawah.length && terbawah[0].avg < 3) {
    lines.push('Beberapa aspek masih perlu penguatan:')
    terbawah.forEach((a) => {
      lines.push(`• Aspek ${a.kode}. ${a.nama} — capaian rata-rata ${a.avg.toFixed(1)}/4, belum optimal.`)
    })
    lines.push('Kendala umum yang ditemui: pemahaman tentang konsep KBC belum merata di seluruh tenaga pendidik, dokumentasi/eviden kegiatan masih minim, integrasi nilai cinta dalam RPP/modul ajar perlu ditingkatkan.')
  } else {
    lines.push('Kendala yang ditemui antara lain:')
    lines.push('• Pemahaman konsep KBC dan integrasi Panca Cinta dalam pembelajaran masih perlu diperdalam.')
    lines.push('• Dokumentasi kegiatan pembiasaan KBC belum sistematis sehingga sulit diukur progresnya.')
    lines.push('• Beberapa pendidik masih memerlukan pendampingan teknis dalam menyusun RPP/modul ajar berbasis cinta.')
  }
  return lines.join('\n')
}

function generateObservasi(madrasah, instrumen, skor) {
  const ringkas = summarizeSkor(skor, instrumen)
  const kategori = kategoriKBC(ringkas.pct)
  const lines = []
  lines.push(`Observasi langsung di ${madrasah?.nama || 'madrasah'} menunjukkan capaian implementasi KBC sebesar ${ringkas.pct.toFixed(1)}% dengan kategori ${kategori.label}.`)
  lines.push('')
  lines.push('Hasil observasi per aspek:')
  instrumen.forEach((aspek) => {
    const ind = aspek.indikator.map((i) => skor?.[i.id] || 0)
    const filled = ind.filter((s) => s > 0)
    if (filled.length) {
      const avg = filled.reduce((a, b) => a + b, 0) / filled.length
      lines.push(`• Aspek ${aspek.kode}. ${aspek.nama}: ${avg.toFixed(1)}/4 (${filled.length} dari ${ind.length} indikator dinilai)`)
    }
  })
  if (!lines.find((l) => l.startsWith('• Aspek'))) {
    lines.pop()
    lines.pop()
    lines.push('')
    lines.push('Suasana pembelajaran kondusif, tenaga pendidik responsif terhadap arahan pendamping, peserta didik antusias mengikuti kegiatan pembiasaan keagamaan.')
  }
  return lines.join('\n')
}

function generateRekomendasi(madrasah, instrumen, skor) {
  const { terbawah } = aspekHighlights(skor, instrumen)
  const lines = ['Rekomendasi pengawas:']
  if (terbawah.length) {
    terbawah.forEach((a, idx) => {
      lines.push(`${idx + 1}. Penguatan Aspek ${a.kode}. ${a.nama} melalui workshop internal, pendampingan teknis, dan dokumentasi praktik baik.`)
    })
  }
  lines.push(`${lines.length}. Susun jadwal sosialisasi KBC kepada seluruh tenaga pendidik dan tenaga kependidikan agar pemahaman merata.`)
  lines.push(`${lines.length}. Integrasikan Panca Cinta (Cinta Allah & Rasul, Cinta Ilmu, Cinta Diri & Sesama, Cinta Lingkungan, Cinta Tanah Air) ke dalam RPP/modul ajar dan kegiatan ekstrakurikuler.`)
  lines.push(`${lines.length}. Buat dokumentasi kegiatan KBC secara sistematis (foto, video, narasi, daftar hadir) sebagai bahan eviden penilaian.`)
  lines.push(`${lines.length}. Lakukan refleksi rutin (mingguan/bulanan) untuk memantau progres dan menyesuaikan strategi.`)
  return lines.join('\n')
}

function generateRencanaTL(madrasah) {
  const lines = ['Rencana tindak lanjut madrasah:']
  lines.push('1. Menyusun tim pengembang KBC tingkat madrasah yang dipimpin Kepala Madrasah.')
  lines.push('2. Melaksanakan workshop internal sosialisasi & pendalaman konsep KBC bagi semua pendidik dalam 2 minggu ke depan.')
  lines.push('3. Mengintegrasikan nilai Panca Cinta dalam RPP/modul ajar pada semester berjalan.')
  lines.push('4. Melengkapi dokumentasi & eviden kegiatan KBC (foto, video, daftar hadir, notulensi).')
  lines.push('5. Melaporkan progres kepada Pengawas Madrasah secara berkala (minimal 1× per bulan).')
  return lines.join('\n')
}

export function generateDraftPendampingan({ form, madrasah, instrumen }) {
  const ringkas = summarizeSkor(form?.skor, instrumen)
  return {
    kegiatan: form.kegiatan?.trim() || pickKegiatan(ringkas.pct),
    temuanPositif: form.temuanPositif?.trim() || generateTemuanPositif(madrasah, instrumen, form?.skor),
    kendala: form.kendala?.trim() || generateKendala(madrasah, instrumen, form?.skor),
    observasi: form.observasi?.trim() || generateObservasi(madrasah, instrumen, form?.skor),
    rekomendasi: form.rekomendasi?.trim() || generateRekomendasi(madrasah, instrumen, form?.skor),
    rencanaTindakLanjut: form.rencanaTindakLanjut?.trim() || generateRencanaTL(madrasah)
  }
}

// Untuk per-field auto-fill (overwrite) — tetap regenerate berdasarkan skor terbaru
export function generateFieldDraft(field, { form, madrasah, instrumen }) {
  switch (field) {
    case 'kegiatan': return pickKegiatan(summarizeSkor(form?.skor, instrumen).pct)
    case 'temuanPositif': return generateTemuanPositif(madrasah, instrumen, form?.skor)
    case 'kendala': return generateKendala(madrasah, instrumen, form?.skor)
    case 'observasi': return generateObservasi(madrasah, instrumen, form?.skor)
    case 'rekomendasi': return generateRekomendasi(madrasah, instrumen, form?.skor)
    case 'rencanaTindakLanjut': return generateRencanaTL(madrasah)
    default: return ''
  }
}
