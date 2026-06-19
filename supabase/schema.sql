-- =============================================================================
-- KBC Pendampingan Piloting - Supabase Schema
-- Project: kbc-pendampingan-piloting
-- Owner:   Pokjawas Madrasah Kemenag Kab. Jember
-- Version: 1.0 (19 Jun 2026)
-- =============================================================================
-- Cara pakai:
-- 1. Buka Supabase project Bapak.
-- 2. Buka menu SQL Editor → New query.
-- 3. Copy-paste seluruh isi file ini → klik Run.
-- 4. Hasil: 10 tabel + RLS policies + indexes + 1 view + helper function.
-- =============================================================================

-- 0. Pastikan ekstensi yang dibutuhkan aktif
create extension if not exists "uuid-ossp";

-- 1. Tabel profile (extend auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  nama text not null,
  role text not null check (role in ('admin','pengawas','kepala','viewer')),
  pengawas_id uuid,           -- ref pengawas.id (kalau role pengawas)
  madrasah_id uuid,           -- ref madrasah.id (kalau role kepala)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Settings (singleton, id = 1)
create table if not exists public.settings (
  id int primary key default 1,
  nama_instansi text not null default 'Kelompok Kerja Pengawas Madrasah',
  sub_instansi text not null default 'Kementerian Agama Kabupaten Jember',
  tahun_pelajaran text not null default '2025/2026',
  ketua_pokjawas text not null default 'Subariyanto, S.Pd, M.Pd.I.',
  nip_ketua text default '197002122005011004',
  logo_url text,
  bobot jsonb not null default '{"perencanaan":20,"pelaksanaan":20,"budaya":20,"panca":20,"evaluasi":20}'::jsonb,
  updated_at timestamptz default now(),
  constraint settings_singleton check (id = 1)
);

-- 3. Pengawas
create table if not exists public.pengawas (
  id uuid primary key default uuid_generate_v4(),
  nama text not null,
  nip text,
  pangkat text,
  jabatan text,
  wilayah text,
  hp text,
  email text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_pengawas_user on public.pengawas(user_id);

-- 4. Madrasah
create table if not exists public.madrasah (
  id uuid primary key default uuid_generate_v4(),
  nama text not null,
  nsm text,
  npsn text,
  jenjang text check (jenjang in ('RA','MI','MTs','MA','MAK')),
  status_ns text check (status_ns in ('Negeri','Swasta')),
  kecamatan text,
  kepala text,
  hp text,
  email text,
  pengawas_id uuid references public.pengawas(id) on delete set null,
  tahun_pelajaran text,
  status_piloting text default 'Aktif' check (status_piloting in ('Aktif','Cadangan','Selesai')),
  catatan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_madrasah_pengawas on public.madrasah(pengawas_id);
create index if not exists idx_madrasah_jenjang on public.madrasah(jenjang);
create index if not exists idx_madrasah_kecamatan on public.madrasah(kecamatan);

-- 5. Instrumen (aspek)
create table if not exists public.instrumen_aspek (
  id uuid primary key default uuid_generate_v4(),
  kode text not null,
  nama text not null,
  urutan int default 0,
  created_at timestamptz default now()
);
create unique index if not exists idx_aspek_kode on public.instrumen_aspek(kode);

-- 6. Instrumen (indikator)
create table if not exists public.instrumen_indikator (
  id uuid primary key default uuid_generate_v4(),
  aspek_id uuid not null references public.instrumen_aspek(id) on delete cascade,
  nomor int not null,
  teks text not null,
  created_at timestamptz default now()
);
create index if not exists idx_indikator_aspek on public.instrumen_indikator(aspek_id);

-- 7. Jadwal pendampingan
create table if not exists public.jadwal (
  id uuid primary key default uuid_generate_v4(),
  tanggal date not null,
  madrasah_id uuid not null references public.madrasah(id) on delete cascade,
  pengawas_id uuid references public.pengawas(id) on delete set null,
  bentuk text check (bentuk in ('Sosialisasi','Bimtek','Observasi','Coaching','Refleksi','Monitoring','Evaluasi')),
  materi text,
  tempat text,
  status text default 'Terjadwal' check (status in ('Terjadwal','Terlaksana','Ditunda','Selesai')),
  catatan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_jadwal_tanggal on public.jadwal(tanggal);
create index if not exists idx_jadwal_madrasah on public.jadwal(madrasah_id);

-- 8. Hasil pendampingan
create table if not exists public.pendampingan (
  id uuid primary key default uuid_generate_v4(),
  tanggal date not null,
  madrasah_id uuid not null references public.madrasah(id) on delete cascade,
  pengawas_id uuid references public.pengawas(id) on delete set null,
  kegiatan text,
  temuan_positif text,
  kendala text,
  observasi text,
  rekomendasi text,
  rencana_tindak_lanjut text,
  batas_tl date,
  status_tl text default 'Belum Dikerjakan' check (status_tl in ('Belum Dikerjakan','Proses','Selesai','Perlu Pendampingan Ulang')),
  bukti_link text,
  skor jsonb default '{}'::jsonb,    -- { "<indikator_id>": 1..4, ... }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_pendampingan_madrasah on public.pendampingan(madrasah_id);
create index if not exists idx_pendampingan_tanggal on public.pendampingan(tanggal);

-- 9. Eviden
create table if not exists public.eviden (
  id uuid primary key default uuid_generate_v4(),
  madrasah_id uuid not null references public.madrasah(id) on delete cascade,
  jenis text,
  judul text not null,
  deskripsi text,
  tanggal date,
  link text,
  storage_path text,                  -- path di Supabase Storage (opsional)
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_eviden_madrasah on public.eviden(madrasah_id);
create index if not exists idx_eviden_jenis on public.eviden(jenis);

-- 10. Tindak lanjut
create table if not exists public.tindak_lanjut (
  id uuid primary key default uuid_generate_v4(),
  madrasah_id uuid not null references public.madrasah(id) on delete cascade,
  temuan text not null,
  rekomendasi text,
  pj text,
  batas date,
  status text default 'Belum Dikerjakan' check (status in ('Belum Dikerjakan','Proses','Selesai','Perlu Pendampingan Ulang')),
  catatan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_tl_madrasah on public.tindak_lanjut(madrasah_id);
create index if not exists idx_tl_status on public.tindak_lanjut(status);

-- =============================================================================
-- Helper function: cek role user yang sedang login
-- =============================================================================
create or replace function public.current_role()
returns text
language sql stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_pengawas_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select pengawas_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_madrasah_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select madrasah_id from public.profiles where id = auth.uid()
$$;

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
-- Pola: semua user terautentikasi bisa SELECT (filter by scope kalau kepala/pengawas)
--       INSERT/UPDATE/DELETE: admin = full, pengawas = data binaannya, kepala = madrasahnya, viewer = read-only

-- profiles: user lihat profil sendiri, admin lihat semua
alter table public.profiles enable row level security;
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for select using (auth.uid() = id or public.current_role() = 'admin');
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.current_role() = 'admin');

-- settings: semua bisa baca, hanya admin tulis
alter table public.settings enable row level security;
drop policy if exists "settings_read_all" on public.settings;
create policy "settings_read_all" on public.settings for select using (auth.role() = 'authenticated');
drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings for all using (public.current_role() = 'admin');

-- pengawas: read all (auth), admin write
alter table public.pengawas enable row level security;
drop policy if exists "pengawas_read" on public.pengawas;
create policy "pengawas_read" on public.pengawas for select using (auth.role() = 'authenticated');
drop policy if exists "pengawas_admin_write" on public.pengawas;
create policy "pengawas_admin_write" on public.pengawas for all using (public.current_role() = 'admin');

-- madrasah: scoped read (admin/viewer all, pengawas binaan, kepala sendiri); admin write
alter table public.madrasah enable row level security;
drop policy if exists "madrasah_read" on public.madrasah;
create policy "madrasah_read" on public.madrasah for select using (
  public.current_role() in ('admin','viewer','pengawas','kepala') and (
    public.current_role() in ('admin','viewer')
    or (public.current_role() = 'pengawas' and pengawas_id = public.current_pengawas_id())
    or (public.current_role() = 'kepala' and id = public.current_madrasah_id())
  )
);
drop policy if exists "madrasah_admin_write" on public.madrasah;
create policy "madrasah_admin_write" on public.madrasah for all using (public.current_role() = 'admin');

-- instrumen aspek/indikator: read all, admin write
alter table public.instrumen_aspek enable row level security;
alter table public.instrumen_indikator enable row level security;
drop policy if exists "aspek_read" on public.instrumen_aspek;
create policy "aspek_read" on public.instrumen_aspek for select using (auth.role() = 'authenticated');
drop policy if exists "aspek_admin_write" on public.instrumen_aspek;
create policy "aspek_admin_write" on public.instrumen_aspek for all using (public.current_role() = 'admin');
drop policy if exists "ind_read" on public.instrumen_indikator;
create policy "ind_read" on public.instrumen_indikator for select using (auth.role() = 'authenticated');
drop policy if exists "ind_admin_write" on public.instrumen_indikator;
create policy "ind_admin_write" on public.instrumen_indikator for all using (public.current_role() = 'admin');

-- jadwal: scoped read; admin & pengawas (binaan) write
alter table public.jadwal enable row level security;
drop policy if exists "jadwal_read" on public.jadwal;
create policy "jadwal_read" on public.jadwal for select using (
  public.current_role() in ('admin','viewer')
  or (public.current_role() = 'pengawas' and madrasah_id in (select id from public.madrasah where pengawas_id = public.current_pengawas_id()))
  or (public.current_role() = 'kepala' and madrasah_id = public.current_madrasah_id())
);
drop policy if exists "jadwal_write" on public.jadwal;
create policy "jadwal_write" on public.jadwal for all using (
  public.current_role() = 'admin'
  or (public.current_role() = 'pengawas' and madrasah_id in (select id from public.madrasah where pengawas_id = public.current_pengawas_id()))
);

-- pendampingan
alter table public.pendampingan enable row level security;
drop policy if exists "pen_read" on public.pendampingan;
create policy "pen_read" on public.pendampingan for select using (
  public.current_role() in ('admin','viewer')
  or (public.current_role() = 'pengawas' and madrasah_id in (select id from public.madrasah where pengawas_id = public.current_pengawas_id()))
  or (public.current_role() = 'kepala' and madrasah_id = public.current_madrasah_id())
);
drop policy if exists "pen_write" on public.pendampingan;
create policy "pen_write" on public.pendampingan for all using (
  public.current_role() = 'admin'
  or (public.current_role() = 'pengawas' and madrasah_id in (select id from public.madrasah where pengawas_id = public.current_pengawas_id()))
);

-- eviden: kepala madrasah boleh upload eviden untuk madrasahnya
alter table public.eviden enable row level security;
drop policy if exists "ev_read" on public.eviden;
create policy "ev_read" on public.eviden for select using (
  public.current_role() in ('admin','viewer')
  or (public.current_role() = 'pengawas' and madrasah_id in (select id from public.madrasah where pengawas_id = public.current_pengawas_id()))
  or (public.current_role() = 'kepala' and madrasah_id = public.current_madrasah_id())
);
drop policy if exists "ev_write" on public.eviden;
create policy "ev_write" on public.eviden for all using (
  public.current_role() = 'admin'
  or (public.current_role() = 'pengawas' and madrasah_id in (select id from public.madrasah where pengawas_id = public.current_pengawas_id()))
  or (public.current_role() = 'kepala' and madrasah_id = public.current_madrasah_id())
);

-- tindak_lanjut
alter table public.tindak_lanjut enable row level security;
drop policy if exists "tl_read" on public.tindak_lanjut;
create policy "tl_read" on public.tindak_lanjut for select using (
  public.current_role() in ('admin','viewer')
  or (public.current_role() = 'pengawas' and madrasah_id in (select id from public.madrasah where pengawas_id = public.current_pengawas_id()))
  or (public.current_role() = 'kepala' and madrasah_id = public.current_madrasah_id())
);
drop policy if exists "tl_write" on public.tindak_lanjut;
create policy "tl_write" on public.tindak_lanjut for all using (
  public.current_role() = 'admin'
  or (public.current_role() = 'pengawas' and madrasah_id in (select id from public.madrasah where pengawas_id = public.current_pengawas_id()))
);

-- =============================================================================
-- Trigger: auto bikin profile saat user signup (default role = viewer)
-- Admin akan rotate role lewat panel "Pengaturan Akun" (TBD)
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nama, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Seed: default settings + default instrumen
-- =============================================================================
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- Aspek default (kalau belum ada)
insert into public.instrumen_aspek (kode, nama, urutan)
select kode, nama, urutan from (values
  ('A', 'Perencanaan Implementasi KBC', 1),
  ('B', 'Pelaksanaan Pembelajaran Berbasis Cinta', 2),
  ('C', 'Budaya Madrasah Berbasis Cinta', 3),
  ('D', 'Panca Cinta KBC', 4),
  ('E', 'Evaluasi dan Tindak Lanjut', 5)
) as v(kode, nama, urutan)
on conflict (kode) do nothing;

-- Indikator default per aspek (idempotent: hanya kalau aspek belum punya indikator)
do $$
declare
  r record;
  indikator_per_aspek jsonb := '{
    "A": [
      "Madrasah memiliki dokumen rencana implementasi KBC.",
      "Tim pelaksana KBC telah dibentuk.",
      "Program KBC terintegrasi dalam kurikulum madrasah.",
      "Nilai KBC masuk dalam perencanaan pembelajaran.",
      "Madrasah memiliki jadwal kegiatan pembiasaan berbasis cinta."
    ],
    "B": [
      "Guru membangun suasana belajar aman, nyaman, dan menyenangkan.",
      "Guru menanamkan nilai kasih sayang, empati, toleransi, dan kepedulian.",
      "Pembelajaran menghargai perbedaan peserta didik.",
      "Guru memberi teladan komunikasi santun.",
      "Peserta didik aktif, dihargai, dan tidak mengalami kekerasan verbal/fisik."
    ],
    "C": [
      "Warga madrasah membiasakan salam, senyum, sapa, sopan, dan santun.",
      "Madrasah membangun budaya anti-bullying.",
      "Madrasah membiasakan kepedulian sosial.",
      "Madrasah membangun hubungan harmonis guru, siswa, orang tua, dan masyarakat.",
      "Madrasah menerapkan pembiasaan cinta tanah air dan cinta lingkungan."
    ],
    "D": [
      "Cinta kepada Allah dan Rasulullah.",
      "Cinta kepada ilmu.",
      "Cinta kepada diri sendiri dan sesama.",
      "Cinta kepada lingkungan.",
      "Cinta kepada tanah air."
    ],
    "E": [
      "Madrasah melakukan refleksi pelaksanaan KBC.",
      "Guru menyusun catatan perkembangan karakter peserta didik.",
      "Kepala madrasah melakukan supervisi implementasi KBC.",
      "Madrasah menyusun rencana tindak lanjut.",
      "Ada bukti/eviden kegiatan KBC."
    ]
  }'::jsonb;
  i int;
  arr jsonb;
begin
  for r in select id, kode from public.instrumen_aspek loop
    if not exists (select 1 from public.instrumen_indikator where aspek_id = r.id) then
      arr := indikator_per_aspek -> r.kode;
      if arr is not null then
        for i in 0..(jsonb_array_length(arr) - 1) loop
          insert into public.instrumen_indikator (aspek_id, nomor, teks)
          values (r.id, i + 1, arr->>i);
        end loop;
      end if;
    end if;
  end loop;
end;
$$;

-- =============================================================================
-- Selesai. Cek hasil:
--   select count(*) from public.instrumen_aspek;       -- 5
--   select count(*) from public.instrumen_indikator;   -- 25
--   select * from public.settings;
-- =============================================================================
