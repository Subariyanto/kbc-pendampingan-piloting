# Panduan Migrasi ke Supabase

Aplikasi sudah ramah Supabase. Mode dipilih otomatis berdasarkan env vars saat build:
- **Tanpa env Supabase** → mode lokal (`localStorage`, akun demo `admin/admin123` dst).
- **Dengan env Supabase** → mode produksi (Postgres + Auth + RLS).

---

## 1. Persiapan akun Supabase

1. Daftar/login di https://supabase.com
2. Klik **New Project**
3. Isi:
   - **Name:** `kbc-pendampingan-piloting`
   - **DB Password:** simpan baik-baik (dipakai kalau perlu akses DB direct)
   - **Region:** Southeast Asia (Singapore) — paling dekat ke Indonesia
   - **Pricing Plan:** Free
4. Tunggu ±2 menit sampai project **Active**

## 2. Jalankan schema SQL

1. Di project Supabase, buka **SQL Editor → New query**
2. Buka file `supabase/schema.sql` di repo ini
3. Copy seluruh isinya, paste ke SQL Editor, klik **Run**
4. Cek output: harus muncul `Success. No rows returned`
5. Verifikasi:
   ```sql
   select count(*) from public.instrumen_aspek;       -- harus 5
   select count(*) from public.instrumen_indikator;   -- harus 25
   select * from public.settings;                     -- 1 row
   ```

## 3. Ambil credentials

1. Buka **Settings → API**
2. Copy 2 hal ini:
   - **Project URL** (`https://xxxxxxxx.supabase.co`)
   - **anon public** key (panjang, dimulai `eyJ...`)

## 4. Konfigurasi build aplikasi

### Untuk pengembangan lokal

Buat file `.env.local` di root project:
```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
VITE_BASE=/
```

Lalu:
```bash
npm run dev
```

### Untuk deploy GitHub Pages dengan Supabase

Saat build production:
```powershell
$env:VITE_BASE = "/kbc-pendampingan-piloting/"
$env:VITE_SUPABASE_URL = "https://xxxxxxxx.supabase.co"
$env:VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1..."
npm run build
# lalu deploy ulang folder dist ke branch gh-pages
```

> ⚠️ **Anon key aman di-publish** karena dilindungi RLS. Jangan pernah commit `service_role` key ke repo.

## 5. Buat user admin pertama

1. Di Supabase: **Authentication → Users → Add user → Create new user**
2. Isi email + password (mis. `admin@kemenagjember.go.id`)
3. **Auto Confirm User:** ✅ ya
4. Setelah user dibuat, jalankan SQL di SQL Editor untuk set role admin:
   ```sql
   update public.profiles
   set role = 'admin', nama = 'Admin Pokjawas'
   where id = (select id from auth.users where email = 'admin@kemenagjember.go.id');
   ```
5. Login di aplikasi pakai email + password tadi.

## 6. Buat user pengawas / kepala madrasah

Sama seperti admin, tapi setelah Add user:

```sql
-- Pengawas
update public.profiles
set role = 'pengawas', nama = 'Drs. H. Ahmad Fauzi, M.Pd',
    pengawas_id = (select id from public.pengawas where nip = '196805121993031005')
where id = (select id from auth.users where email = 'fauzi@kemenagjember.go.id');

-- Kepala Madrasah
update public.profiles
set role = 'kepala', nama = 'Dra. Hj. Siti Aminah, M.Ag',
    madrasah_id = (select id from public.madrasah where nsm = '121135090001')
where id = (select id from auth.users where email = 'aminah@mtsn1jember.sch.id');

-- Viewer
update public.profiles
set role = 'viewer', nama = 'Pimpinan Kemenag'
where id = (select id from auth.users where email = 'pimpinan@kemenagjember.go.id');
```

## 7. Migrasi data lokal ke Supabase (opsional)

Kalau Bapak sudah pakai aplikasi versi lokal dan punya data yang ingin dipindah:

1. Login di aplikasi versi lokal sebagai admin
2. **Pengaturan → Backup ke JSON** → simpan file
3. Switch aplikasi ke mode Supabase (set env vars di atas, build/dev ulang)
4. Login sebagai admin Supabase
5. **Pengaturan → Restore dari JSON** → upload file backup
6. Konfirmasi → semua data dikirim ke Supabase

> Catatan: data instrumen, madrasah, pengawas, jadwal, pendampingan, eviden, tindak lanjut, dan settings akan ter-sync. User Auth tidak ikut karena dikelola Supabase.

## 8. Tambahkan domain custom (opsional)

Kalau Bapak punya domain (mis. `kbc.kemenagjember.id`):
1. **GitHub repo → Settings → Pages → Custom domain** → isi
2. Tambahkan record DNS di provider domain Bapak

---

## Troubleshooting

**Login gagal "Invalid login credentials"**
- Pastikan user sudah dibuat di Authentication → Users
- Pastikan email sudah confirmed (atau pakai Auto Confirm)

**Halaman dashboard kosong**
- Cek browser DevTools → Console: ada error fetch ke `*.supabase.co`?
- Cek RLS: jalankan `select current_role(), current_pengawas_id()` di SQL Editor sebagai user tersebut

**"Anon key not configured"**
- Build pakai env vars belum kebawa. Cek `dist/assets/*.js` apakah string anon key ada di dalamnya.

**Mau rollback ke localStorage**
- Hapus `.env.local` (atau unset env vars), build ulang. Aplikasi otomatis kembali ke mode lokal.

---

## Struktur Tabel

| Tabel | Isi |
|---|---|
| `profiles` | Extends auth.users, simpan role + relasi ke pengawas/madrasah |
| `settings` | Singleton (id=1) — identitas instansi, logo, bobot |
| `pengawas` | Master data pengawas pendamping |
| `madrasah` | Master madrasah piloting + relasi ke pengawas |
| `instrumen_aspek` | 5 aspek KBC (A-E) |
| `instrumen_indikator` | 25 indikator default + relasi ke aspek |
| `jadwal` | Jadwal pendampingan |
| `pendampingan` | Hasil pendampingan + skor (jsonb) |
| `eviden` | Eviden kegiatan KBC |
| `tindak_lanjut` | Rekomendasi & status TL |

Semua tabel ter-RLS. Detail policy bisa dilihat di `supabase/schema.sql`.
