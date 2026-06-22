-- =============================================================================
-- KBC Migration 005: Pembelian (info penjualan) di settings - public read
-- =============================================================================
-- Tujuan:
-- 1. Tambah kolom `pembelian` jsonb di tabel settings
-- 2. Public read access (tabel settings) supaya visitor di login page (belum auth)
--    bisa lihat info harga/WA/bank/banner. Settings non-sensitif, aman jadi public.
-- 3. Admin tetap satu-satunya yang bisa write
-- =============================================================================

-- 1. Tambah kolom pembelian jsonb (default value sesuai default lama)
alter table public.settings
  add column if not exists pembelian jsonb not null default '{
    "wa": "6282330647698",
    "proPrice": "500.000",
    "basicPrice": "0",
    "trialDays": 7,
    "bankInfo": "BCA 1234567890 a.n. Subariyanto, S.Pd, M.Pd.I",
    "bannerText": "Aktifkan akses penuh aplikasi Pendampingan KBC dengan kode aktivasi resmi dari Pokjawas Madrasah Kabupaten Jember."
  }'::jsonb;

-- 2. Pastikan ada baris settings dengan id=1 (idempotent)
insert into public.settings (id) values (1)
on conflict (id) do nothing;

-- 3. Relax policy: public bisa SELECT tabel settings
drop policy if exists "settings_read_all" on public.settings;
create policy "settings_read_all" on public.settings
  for select using (true);

-- 4. Reload schema cache
select pg_notify('pgrst', 'reload schema');
