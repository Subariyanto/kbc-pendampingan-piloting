// Helper menghitung skor instrumen KBC
import { clampPct, kategoriKBC } from './utils.js'

export function summarizeSkor(skor, instrumen) {
  if (!skor || !instrumen?.length) {
    return {
      totalIndikator: 0,
      totalTerisi: 0,
      totalSkor: 0,
      maksSkor: 0,
      avg: 0,
      pct: 0,
      kategori: kategoriKBC(0),
      perAspek: []
    }
  }

  const perAspek = instrumen.map((aspek) => {
    const indCount = aspek.indikator.length
    const sums = aspek.indikator.reduce(
      (acc, ind) => {
        const v = Number(skor?.[ind.id] ?? 0)
        if (v > 0) {
          acc.terisi += 1
          acc.total += v
        }
        return acc
      },
      { terisi: 0, total: 0 }
    )
    const maks = indCount * 4
    const pct = maks ? (sums.total / maks) * 100 : 0
    return {
      id: aspek.id,
      kode: aspek.kode,
      nama: aspek.nama,
      indikator: indCount,
      terisi: sums.terisi,
      total: sums.total,
      maks,
      avg: sums.terisi ? sums.total / sums.terisi : 0,
      pct: clampPct(pct)
    }
  })

  const totalIndikator = perAspek.reduce((a, b) => a + b.indikator, 0)
  const totalTerisi = perAspek.reduce((a, b) => a + b.terisi, 0)
  const totalSkor = perAspek.reduce((a, b) => a + b.total, 0)
  const maksSkor = totalIndikator * 4
  const avg = totalTerisi ? totalSkor / totalTerisi : 0
  const pct = maksSkor ? (totalSkor / maksSkor) * 100 : 0

  return {
    totalIndikator,
    totalTerisi,
    totalSkor,
    maksSkor,
    avg,
    pct: clampPct(pct),
    kategori: kategoriKBC(pct),
    perAspek
  }
}

export function rataRataMadrasah(pendampinganList, instrumen) {
  if (!pendampinganList?.length) return { pct: 0, count: 0, kategori: kategoriKBC(0) }
  const summaries = pendampinganList
    .filter((p) => p.skor)
    .map((p) => summarizeSkor(p.skor, instrumen).pct)
  if (!summaries.length) return { pct: 0, count: 0, kategori: kategoriKBC(0) }
  const avg = summaries.reduce((a, b) => a + b, 0) / summaries.length
  return { pct: clampPct(avg), count: summaries.length, kategori: kategoriKBC(avg) }
}

export function rekapAspekGlobal(pendampinganList, instrumen) {
  // Rata-rata persen per aspek dari seluruh pendampingan.
  if (!pendampinganList?.length || !instrumen?.length) {
    return instrumen.map((a) => ({ kode: a.kode, nama: a.nama, pct: 0 }))
  }
  return instrumen.map((aspek) => {
    const vals = pendampinganList
      .filter((p) => p.skor)
      .map((p) => summarizeSkor(p.skor, instrumen).perAspek.find((x) => x.id === aspek.id)?.pct ?? 0)
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    return { kode: aspek.kode, nama: aspek.nama, pct: clampPct(avg) }
  })
}
