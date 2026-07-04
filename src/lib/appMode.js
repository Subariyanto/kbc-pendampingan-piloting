// =============================================================================
// Mode aplikasi: lokal-only (multi-pengawas isolation via browser localStorage)
// =============================================================================
// Tiap pengawas yang aktivasi punya database sendiri di browser mereka.
// Supabase tetap dipakai HANYA untuk:
//   1. Validasi kode aktivasi (read activation_codes)
//   2. Tag kode sebagai 'used' setelah aktivasi
//   3. Yanto-as-admin: terbitkan & kelola kode aktivasi
//
// Data aplikasi (madrasah, pengawas, jadwal, pendampingan, eviden, tindak_lanjut,
// instrumen, settings) SEMUA tersimpan di localStorage browser.
//
// Kalau ingin balik ke mode multi-tenant Supabase, set ini ke false.
// =============================================================================
export const LOCAL_ONLY_MODE = true
