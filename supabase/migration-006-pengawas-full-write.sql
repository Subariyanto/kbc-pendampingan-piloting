-- =============================================================================
-- migration-006-pengawas-full-write.sql
-- Pengawas yg login via kode aktivasi adalah CUSTOMER yg butuh akses penuh
-- input/edit data sendiri (madrasah, pengawas, jadwal, pendampingan, eviden,
-- tindak lanjut, instrumen, settings).
--
-- Sebelumnya policy *_admin_write/_write hanya izinin role='admin'. Kita
-- relax jadi role IN ('admin', 'pengawas') untuk semua tabel data utama.
--
-- Idempotent: drop policy lama, buat ulang dengan rule baru.
-- =============================================================================

-- 1. PENGAWAS
drop policy if exists "pengawas_admin_write" on public.pengawas;
create policy "pengawas_admin_write" on public.pengawas
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')));

-- 2. MADRASAH
drop policy if exists "madrasah_admin_write" on public.madrasah;
create policy "madrasah_admin_write" on public.madrasah
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')));

-- 3. INSTRUMEN ASPEK & INDIKATOR
drop policy if exists "aspek_admin_write" on public.instrumen_aspek;
create policy "aspek_admin_write" on public.instrumen_aspek
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')));

drop policy if exists "ind_admin_write" on public.instrumen_indikator;
create policy "ind_admin_write" on public.instrumen_indikator
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')));

-- 4. SETTINGS (mendukung pengawas luar kabupaten edit data instansi sendiri)
drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')));

-- 5. JADWAL — pengawas full akses (tidak lagi terbatas ke madrasah binaan saja
-- karena pengawas customer baru belum di-link ke pengawas record)
drop policy if exists "jadwal_write" on public.jadwal;
create policy "jadwal_write" on public.jadwal
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')));

-- jadwal_read: pengawas bisa baca semua (sebelumnya filter ke madrasah binaan)
drop policy if exists "jadwal_read" on public.jadwal;
create policy "jadwal_read" on public.jadwal
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin', 'viewer', 'pengawas')
          or (p.role = 'kepala' and jadwal.madrasah_id = p.madrasah_id)
        )
    )
  );

-- 6. PENDAMPINGAN
drop policy if exists "pen_write" on public.pendampingan;
create policy "pen_write" on public.pendampingan
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')));

drop policy if exists "pen_read" on public.pendampingan;
create policy "pen_read" on public.pendampingan
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin', 'viewer', 'pengawas')
          or (p.role = 'kepala' and pendampingan.madrasah_id = p.madrasah_id)
        )
    )
  );

-- 7. EVIDEN
drop policy if exists "ev_write" on public.eviden;
create policy "ev_write" on public.eviden
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')));

drop policy if exists "ev_read" on public.eviden;
create policy "ev_read" on public.eviden
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin', 'viewer', 'pengawas')
          or (p.role = 'kepala' and eviden.madrasah_id = p.madrasah_id)
        )
    )
  );

-- 8. TINDAK LANJUT
drop policy if exists "tl_write" on public.tindak_lanjut;
create policy "tl_write" on public.tindak_lanjut
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pengawas')));

drop policy if exists "tl_read" on public.tindak_lanjut;
create policy "tl_read" on public.tindak_lanjut
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin', 'viewer', 'pengawas')
          or (p.role = 'kepala' and tindak_lanjut.madrasah_id = p.madrasah_id)
        )
    )
  );

-- ===== Verify =====
-- select tablename, policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and policyname like '%admin_write%' or policyname like '%_write%';
