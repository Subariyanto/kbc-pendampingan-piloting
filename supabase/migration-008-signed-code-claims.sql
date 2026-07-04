-- =============================================================================
-- migration-008-signed-code-claims.sql
-- Single-use enforcement untuk signed license codes.
--
-- Saat user aktivasi kode di browser baru, ActivationPage panggil RPC
-- claim_signed_code(p_code, p_device_fp, p_nama). Kalau code sudah ada di
-- tabel ini dengan device_fp berbeda -> reject (kode sudah dipakai). Kalau
-- belum ada atau device_fp sama -> ok.
--
-- Tujuan: customer tidak bisa pakai 1 kode di banyak device. Pindah device
-- legitimate dilakukan via backup/restore JSON (di-export dari device lama,
-- import ke device baru, lisensi + device_fp ikut di-restore -> RPC re-claim
-- dengan device_fp sama -> ok).
-- =============================================================================

create table if not exists public.signed_code_claims (
  code text primary key,
  device_fp text not null,
  nama text,
  tier text,
  claimed_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.signed_code_claims enable row level security;

-- Public read (untuk admin panel statistik kalau perlu, lewat RPC saja)
drop policy if exists "claims_select" on public.signed_code_claims;
create policy "claims_select" on public.signed_code_claims
  for select to authenticated using (true);

-- Tidak ada policy insert/update direct -- semua via RPC security definer.

-- =============================================================================
-- RPC claim_signed_code
-- =============================================================================
create or replace function public.claim_signed_code(
  p_code text,
  p_device_fp text,
  p_nama text default null,
  p_tier text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean_code text := upper(trim(p_code));
  v_clean_fp text := trim(p_device_fp);
  v_existing public.signed_code_claims%rowtype;
begin
  if v_clean_code = '' or v_clean_fp = '' then
    return jsonb_build_object('ok', false, 'error', 'Kode atau device fingerprint kosong');
  end if;

  -- Master code: tidak di-track, tidak ada single-use enforcement
  if v_clean_code = 'KBC-POKJAWAS-JEMBER-2026' then
    return jsonb_build_object('ok', true, 'master', true);
  end if;

  select * into v_existing from public.signed_code_claims where code = v_clean_code;

  if found then
    -- Device sama -> ok (re-aktivasi setelah clear localStorage di device sama
    -- masih dianggap legitimate, atau restore backup di device sama)
    if v_existing.device_fp = v_clean_fp then
      update public.signed_code_claims
        set last_seen_at = now()
        where code = v_clean_code;
      return jsonb_build_object('ok', true, 'rebind', false, 'first_claimed_at', v_existing.claimed_at);
    else
      -- Device beda -> reject
      return jsonb_build_object(
        'ok', false,
        'error', 'Kode sudah digunakan di device lain pada ' ||
                 to_char(v_existing.claimed_at at time zone 'Asia/Jakarta', 'DD Mon YYYY HH24:MI'),
        'first_claimed_at', v_existing.claimed_at,
        'first_nama', v_existing.nama
      );
    end if;
  else
    -- Belum ada -> klaim
    insert into public.signed_code_claims (code, device_fp, nama, tier)
      values (v_clean_code, v_clean_fp, nullif(trim(p_nama), ''), nullif(trim(p_tier), ''));
    return jsonb_build_object('ok', true, 'first_claim', true);
  end if;
end;
$$;

grant execute on function public.claim_signed_code(text, text, text, text) to anon, authenticated;
