-- =============================================================================
-- KBC Migration 001: FIX RLS - Inline subquery + WITH CHECK
-- =============================================================================
-- Issue diagnosis:
-- 1) `current_role` adalah SQL standard function — konflik penamaan dengan
--    helper kita walau sudah pakai prefix public.
-- 2) Untuk policy `for all`, walau Postgres bilang WITH CHECK default = USING,
--    PostgREST kadang tetap nolak INSERT kalau WITH CHECK tidak eksplisit.
--
-- Fix: rewrite semua policy:
--    - Drop helper functions (current_role, current_pengawas_id, current_madrasah_id)
--    - Pakai inline subquery (select role from profiles where id = auth.uid())
--    - Tambahkan WITH CHECK eksplisit untuk semua INSERT/UPDATE/ALL policy
-- =============================================================================

-- 1. Drop semua policy lama DAN policy baru (idempotent — boleh dijalankan berulang)
drop policy if exists "profiles_self" on public.profiles;
drop policy if exists "profiles_self_read" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "profiles_admin_write" on public.profiles;
drop policy if exists "settings_read_all" on public.settings;
drop policy if exists "settings_read" on public.settings;
drop policy if exists "settings_admin_write" on public.settings;
drop policy if exists "pengawas_read" on public.pengawas;
drop policy if exists "pengawas_admin_write" on public.pengawas;
drop policy if exists "madrasah_read" on public.madrasah;
drop policy if exists "madrasah_admin_write" on public.madrasah;
drop policy if exists "aspek_read" on public.instrumen_aspek;
drop policy if exists "aspek_admin_write" on public.instrumen_aspek;
drop policy if exists "ind_read" on public.instrumen_indikator;
drop policy if exists "ind_admin_write" on public.instrumen_indikator;
drop policy if exists "jadwal_read" on public.jadwal;
drop policy if exists "jadwal_write" on public.jadwal;
drop policy if exists "pen_read" on public.pendampingan;
drop policy if exists "pen_write" on public.pendampingan;
drop policy if exists "ev_read" on public.eviden;
drop policy if exists "ev_write" on public.eviden;
drop policy if exists "tl_read" on public.tindak_lanjut;
drop policy if exists "tl_write" on public.tindak_lanjut;

-- 2. Drop helper function lama (boleh gagal kalau memang tidak ada)
drop function if exists public.current_role();
drop function if exists public.current_pengawas_id();
drop function if exists public.current_madrasah_id();

-- 3. PROFILES — user lihat profil sendiri, admin lihat semua
create policy "profiles_self_read" on public.profiles
  for select to authenticated
  using (
    auth.uid() = id
    or exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin')
  );
create policy "profiles_admin_write" on public.profiles
  for all to authenticated
  using (exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'))
  with check (exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'));

-- 4. SETTINGS — read all authed, admin write
create policy "settings_read" on public.settings
  for select to authenticated using (true);
create policy "settings_admin_write" on public.settings
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 5. PENGAWAS
create policy "pengawas_read" on public.pengawas
  for select to authenticated using (true);
create policy "pengawas_admin_write" on public.pengawas
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 6. MADRASAH
create policy "madrasah_read" on public.madrasah
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin','viewer')
          or (p.role = 'pengawas' and madrasah.pengawas_id = p.pengawas_id)
          or (p.role = 'kepala' and madrasah.id = p.madrasah_id)
        )
    )
  );
create policy "madrasah_admin_write" on public.madrasah
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 7. INSTRUMEN
create policy "aspek_read" on public.instrumen_aspek
  for select to authenticated using (true);
create policy "aspek_admin_write" on public.instrumen_aspek
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "ind_read" on public.instrumen_indikator
  for select to authenticated using (true);
create policy "ind_admin_write" on public.instrumen_indikator
  for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 8. JADWAL
create policy "jadwal_read" on public.jadwal
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin','viewer')
          or (p.role = 'pengawas' and jadwal.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
          or (p.role = 'kepala' and jadwal.madrasah_id = p.madrasah_id)
        )
    )
  );
create policy "jadwal_write" on public.jadwal
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role = 'admin'
          or (p.role = 'pengawas' and jadwal.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role = 'admin'
          or (p.role = 'pengawas' and jadwal.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
        )
    )
  );

-- 9. PENDAMPINGAN
create policy "pen_read" on public.pendampingan
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin','viewer')
          or (p.role = 'pengawas' and pendampingan.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
          or (p.role = 'kepala' and pendampingan.madrasah_id = p.madrasah_id)
        )
    )
  );
create policy "pen_write" on public.pendampingan
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role = 'admin'
          or (p.role = 'pengawas' and pendampingan.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role = 'admin'
          or (p.role = 'pengawas' and pendampingan.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
        )
    )
  );

-- 10. EVIDEN
create policy "ev_read" on public.eviden
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin','viewer')
          or (p.role = 'pengawas' and eviden.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
          or (p.role = 'kepala' and eviden.madrasah_id = p.madrasah_id)
        )
    )
  );
create policy "ev_write" on public.eviden
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role = 'admin'
          or (p.role = 'pengawas' and eviden.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
          or (p.role = 'kepala' and eviden.madrasah_id = p.madrasah_id)
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role = 'admin'
          or (p.role = 'pengawas' and eviden.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
          or (p.role = 'kepala' and eviden.madrasah_id = p.madrasah_id)
        )
    )
  );

-- 11. TINDAK LANJUT
create policy "tl_read" on public.tindak_lanjut
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin','viewer')
          or (p.role = 'pengawas' and tindak_lanjut.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
          or (p.role = 'kepala' and tindak_lanjut.madrasah_id = p.madrasah_id)
        )
    )
  );
create policy "tl_write" on public.tindak_lanjut
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role = 'admin'
          or (p.role = 'pengawas' and tindak_lanjut.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role = 'admin'
          or (p.role = 'pengawas' and tindak_lanjut.madrasah_id in (select m.id from public.madrasah m where m.pengawas_id = p.pengawas_id))
        )
    )
  );

-- 12. Reload schema cache
notify pgrst, 'reload schema';

-- =============================================================================
-- Test setelah migration:
--   select role from public.profiles where id = auth.uid();    -- should return 'admin'
--   insert into public.madrasah(nama,jenjang,status_ns) values ('Migration Test','MI','Negeri') returning id;
-- =============================================================================
