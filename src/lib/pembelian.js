// Helper untuk baca info pembelian (banner harga, WA, bank, dll)
// Sumber: localStorage 'kbc_pendampingan_v1_pembelian' (diset di /pembelian oleh admin)
// Fallback: default value supaya selalu ada info yang bisa ditampilkan ke calon pembeli

const STORAGE_KEY = 'kbc_pendampingan_v1_pembelian'

const DEFAULT_PEMBELIAN = {
  wa: '6282330647698',
  proPrice: '500.000',
  basicPrice: '0',
  trialDays: 7,
  bankInfo: 'BCA 1234567890 a.n. Subariyanto, S.Pd, M.Pd.I',
  bannerText: 'Aktifkan akses penuh aplikasi Pendampingan KBC dengan kode aktivasi resmi dari Pokjawas Madrasah Kabupaten Jember.'
}

export function getPembelianInfo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PEMBELIAN }
    const stored = JSON.parse(raw)
    return { ...DEFAULT_PEMBELIAN, ...stored }
  } catch {
    return { ...DEFAULT_PEMBELIAN }
  }
}

export function savePembelianInfo(info) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
  } catch {}
}
