-- =============================================================================
-- KBC Migration 002: User management RPC for admin
-- =============================================================================
-- Tujuan:
-- 1. View `admin_users_list` — admin lihat semua user + email + role + nama
-- 2. RPC `admin_update_profile` — admin update role/nama/pengawas_id/madrasah_id
-- 3. RPC `admin_delete_user` — admin hapus user (auth.users + profiles)
-- 4. Update trigger handle_new_user — baca metadata role/nama saat signup
-- =============================================================================

-- 1. Update handle_new_user trigger biar baca metadata
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
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  meta_role := nullif(meta->>'role', '');
  meta_nama := nullif(meta->>'nama', '');
  -- pengawas_id / madrasah_id boleh null/uuid
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
  return new;
end $$;

-- Pastikan trigger terpasang
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. View untuk list user (security definer wrapper)
create or replace function public.admin_users_list()
returns table (
  id uuid,
  email text,
  nama text,
  role text,
  pengawas_id uuid,
  madrasah_id uuid,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    u.email::text,
    p.nama,
    p.role,
    p.pengawas_id,
    p.madrasah_id,
    u.created_at,
    u.last_sign_in_at
  from public.profiles p
  left join auth.users u on u.id = p.id
  where public.is_admin()
  order by u.created_at desc nulls last
$$;

grant execute on function public.admin_users_list() to authenticated;

-- 3. RPC update profile (admin only)
create or replace function public.admin_update_profile(
  target_id uuid,
  new_nama text,
  new_role text,
  new_pengawas_id uuid,
  new_madrasah_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden: hanya admin yang bisa update profile';
  end if;
  if new_role not in ('admin','pengawas','kepala','viewer') then
    raise exception 'Role tidak valid: %', new_role;
  end if;
  update public.profiles
  set nama = coalesce(new_nama, nama),
      role = new_role,
      pengawas_id = new_pengawas_id,
      madrasah_id = new_madrasah_id
  where id = target_id;
end $$;

grant execute on function public.admin_update_profile(uuid, text, text, uuid, uuid) to authenticated;

-- 4. RPC delete user (admin only) — hapus dari auth.users akan cascade ke profiles
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden: hanya admin yang bisa hapus user';
  end if;
  if target_id = auth.uid() then
    raise exception 'Tidak bisa menghapus akun sendiri';
  end if;
  delete from public.profiles where id = target_id;
  delete from auth.users where id = target_id;
end $$;

grant execute on function public.admin_delete_user(uuid) to authenticated;

-- 5. RPC reset password (admin only) — kirim email reset
-- (tidak bisa dari SQL tanpa service_role, jadi user pakai fitur "Forgot Password" sendiri,
--  atau admin pakai dashboard Supabase. Disabled untuk sekarang.)

notify pgrst, 'reload schema';
