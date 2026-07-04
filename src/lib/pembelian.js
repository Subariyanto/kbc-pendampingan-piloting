// Helper untuk baca info pembelian (banner harga, WA, bank, dll)
// Sumber utama: Supabase tabel `settings` kolom `pembelian` (public read)
// Fallback: localStorage → DEFAULT

import { supabase, SUPABASE_ENABLED } from './supabase.js'

const STORAGE_KEY = 'kbc_pendampingan_v1_pembelian'

const DEFAULT_PEMBELIAN = {
  wa: '6282330647698',
  proPrice: '500.000',
  basicPrice: '0',
  trialDays: 7,
  bankInfo: 'BCA 1234567890 a.n. Subariyanto, S.Pd, M.Pd.I',
  bannerText: 'Aktifkan akses penuh aplikasi Pendampingan KBC dengan kode aktivasi resmi dari Pokjawas Madrasah Kabupaten Jember.'
}

// Sync getter dari localStorage (untuk render awal sebelum data Supabase ready)
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

// Async fetch dari Supabase (sumber utama). Fallback ke localStorage.
export async function fetchPembelianInfo() {
  if (SUPABASE_ENABLED && supabase) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('pembelian')
        .eq('id', 1)
        .maybeSingle()
      if (!error && data?.pembelian) {
        const merged = { ...DEFAULT_PEMBELIAN, ...data.pembelian }
        // Cache ke localStorage biar render awal selanjutnya pakai data terbaru
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)) } catch {}
        return merged
      }
    } catch (err) {
      console.warn('fetchPembelianInfo Supabase error:', err)
    }
  }
  return getPembelianInfo()
}

// Save lokal (admin offline mode atau cache)
export function savePembelianInfo(info) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
  } catch {}
}

// Save ke Supabase (admin only). Auto cache localStorage juga.
export async function savePembelianRemote(info) {
  savePembelianInfo(info)
  if (!SUPABASE_ENABLED || !supabase) return { ok: false, error: 'Supabase belum aktif' }
  const { error } = await supabase
    .from('settings')
    .update({ pembelian: info })
    .eq('id', 1)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
