-- =============================================================================
-- KBC Migration 003: Kode Aktivasi untuk Registrasi User
-- =============================================================================
-- Tujuan:
-- 1. Tabel `activation_codes` — kode aktivasi yang di-assign ke user baru
-- 2. Trigger `handle_new_user` update — auto-mark kode sebagai used
-- 3. RLS — anon bisa query kode (validasi), admin bisa manage
-- 4. Seed default codes
-- =============================================================================

-- 1. Tabel kode aktivasi
create table if not exists public.activation_codes (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  role text not null check (role in ('admin','pengawas','kepala','viewer')),
  nama text not null,
  pengawas_id uuid references public.pengawas(id) on delete set null,
  madrasah_id uuid references public.madrasah(id) on delete set null,
  used boolean default false,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz default now(),
  note text
);

-- 2. Update handle_new_user: baca activation_code dari metadata + mark as used
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  meta_role text;
  meta_nama text;
  meta_pengawas uuid;
  meta_madrasah uuid;
  meta_activation text;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  meta_role := nullif(meta->>'role', '');
  meta_nama := nullif(meta->>'nama', '');
  meta_activation := nullif(meta->>'activation_code', '');
  begin meta_pengawas := nullif(meta->>'pengawas_id','')::uuid; exception when others then meta_pengawas := null; end;
  begin meta_madrasah := nullif(meta->>'madrasah_id','')::uuid; exception when others then meta_madrasah := null; end;

  insert into public.profiles (id, nama, role, pengawas_id, madrasah_id)
  values (
    new.id,
    coalesce(meta_nama, new.email),
    coalesce(meta_role, 'viewer'),
    meta_pengawas,
    meta_madrasah
  )
  on conflict (id) do nothing;

  -- Mark activation code as used
  if meta_activation is not null then
    update public.activation_codes
    set used = true, used_by = new.id, used_at = now()
    where upper(code) = upper(meta_activation) and used = false;
  end if;

  return new;
end;
$$;

-- Re-attach trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. RLS untuk activation_codes
alter table public.activation_codes enable row level security;

drop policy if exists "codes_select_public" on public.activation_codes;
create policy "codes_select_public" on public.activation_codes
  for select using (true);

drop policy if exists "codes_admin_manage" on public.activation_codes;
create policy "codes_admin_manage" on public.activation_codes
  for all using (
    auth.role() = 'authenticated' 
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4. Seed default codes (idempotent)
insert into public.activation_codes (code, role, nama, note)
select code, role, nama, note from (values
  ('KBC-POKJAWAS-JEMBER-2026', 'admin', 'Admin Utama', 'Master admin code — jangan dishare'),
  ('KBC-DEMO-ADMIN', 'admin', 'Admin Demo', 'Demo admin'),
  ('KBC-DEMO-PENGAWAS', 'pengawas', 'Pengawas Demo', 'Demo pengawas'),
  ('KBC-DEMO-KEPALA', 'kepala', 'Kepala Madrasah Demo', 'Demo kepala'),
  ('KBC-DEMO-VIEWER', 'viewer', 'Viewer Demo', 'Demo viewer')
) as v(code, role, nama, note)
where not exists (select 1 from public.activation_codes where upper(code) = upper(v.code));

-- 5. Grant execute on is_admin (dari migration-001) untuk authenticated
grant execute on function public.is_admin() to authenticated;

-- 6. Notify PostgREST untuk reload schema
notify pgrst, 'reload schema';