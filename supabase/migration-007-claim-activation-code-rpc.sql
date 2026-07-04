-- =============================================================================
-- migration-007-claim-activation-code-rpc.sql
-- RPC public untuk klaim kode aktivasi tanpa perlu login Supabase.
-- Mendukung mode aplikasi LOCAL_ONLY: user di browser cukup masukkan kode +
-- nama, RPC ini validasi & tandai kode sebagai used dalam 1 transaksi atomik.
-- =============================================================================

create or replace function public.claim_activation_code(
  p_code text,
  p_nama text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.activation_codes%rowtype;
  v_master text := 'KBC-POKJAWAS-JEMBER-2026';
begin
  -- Master code: tidak ditandai used (reusable owner backdoor)
  if upper(trim(p_code)) = v_master then
    return jsonb_build_object(
      'ok', true,
      'master', true,
      'tier', 'pro',
      'validity_days', 0,
      'role', 'admin',
      'nama', coalesce(nullif(trim(p_nama), ''), 'Owner')
    );
  end if;

  -- Kode biasa: ambil row, validasi
  select * into v_row
  from public.activation_codes
  where code = upper(trim(p_code));

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Kode aktivasi tidak ditemukan');
  end if;

  if v_row.used then
    return jsonb_build_object('ok', false, 'error', 'Kode aktivasi sudah digunakan');
  end if;

  -- Tandai used
  update public.activation_codes
  set used = true,
      used_at = now(),
      used_by_nama = coalesce(nullif(trim(p_nama), ''), v_row.nama, 'User')
  where id = v_row.id;

  return jsonb_build_object(
    'ok', true,
    'master', false,
    'tier', coalesce(v_row.tier, 'pro'),
    'validity_days', coalesce(v_row.validity_days, 0),
    'role', coalesce(v_row.role, 'pengawas'),
    'nama', coalesce(nullif(trim(p_nama), ''), v_row.nama, 'User')
  );
end;
$$;

-- Public dapat eksekusi RPC ini (anon + authenticated)
grant execute on function public.claim_activation_code(text, text) to anon, authenticated;

-- Tambah kolom used_by_nama kalau belum ada (opsional, untuk lacak siapa pakai)
alter table public.activation_codes
  add column if not exists used_by_nama text;
