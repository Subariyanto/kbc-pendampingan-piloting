-- =============================================================================
-- KBC Migration 004: Tier & Expired di activation_codes (opsi B)
-- =============================================================================
-- Tujuan:
-- 1. Pastikan kolom dari migration-003 ada (idempotent)
-- 2. Tambah kolom `tier` (pro|demo) dan `validity_days` (int, masa berlaku setelah aktivasi)
--    - tier=pro, validity_days=0  -> akses lifetime
--    - tier=demo, validity_days=N -> trial N hari (default 7)
-- 3. Reload schema cache PostgREST
-- =============================================================================

-- 1. Pastikan kolom dari migration-003 ada (idempotent fix kalau migration-003
--    di-skip atau tabel sudah dibuat duluan tanpa kolom-kolom ini).
alter table public.activation_codes
  add column if not exists pengawas_id uuid references public.pengawas(id) on delete set null;
alter table public.activation_codes
  add column if not exists madrasah_id uuid references public.madrasah(id) on delete set null;
alter table public.activation_codes
  add column if not exists used boolean default false;
alter table public.activation_codes
  add column if not exists used_by uuid references auth.users(id) on delete set null;
alter table public.activation_codes
  add column if not exists used_at timestamptz;
alter table public.activation_codes
  add column if not exists note text;

-- 2. Tier & masa berlaku (opsi B)
alter table public.activation_codes
  add column if not exists tier text not null default 'pro' check (tier in ('pro','demo'));
alter table public.activation_codes
  add column if not exists validity_days integer not null default 0;
-- 0 = lifetime (untuk pro). >0 = trial N hari (untuk demo).

-- 3. Reload schema cache PostgREST (kadang perlu beberapa detik)
select pg_notify('pgrst', 'reload schema');
notify pgrst, 'reload schema';
