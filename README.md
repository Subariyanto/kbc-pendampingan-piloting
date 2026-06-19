# Aplikasi Program Pendampingan Madrasah Piloting — Implementasi KBC

Aplikasi web modern untuk **Kelompok Kerja Pengawas Madrasah, Kementerian Agama Kabupaten Jember** yang membantu pengawas madrasah dalam mendampingi, memantau, menilai, dan melaporkan implementasi **Kurikulum Berbasis Cinta (KBC)** pada madrasah piloting.

---

## ✨ Fitur Utama

- 🔐 **Login multi-role** — Admin, Pengawas, Kepala Madrasah, Viewer/Pimpinan
- 📊 **Dashboard interaktif** — kartu statistik, grafik progres, radar chart aspek KBC
- 🏫 **Kelola Madrasah Piloting** — CRUD lengkap, filter jenjang & kecamatan, ekspor CSV, cetak
- 🧑‍🏫 **Kelola Pengawas Pendamping** — daftar pengawas + jumlah dampingan
- 🗓️ **Jadwal Pendampingan** — kalender bulanan + tabel + cetak
- 📋 **Instrumen Monitoring KBC** — 5 aspek × 5 indikator (editable), skor 1–4
- 📝 **Form Hasil Pendampingan** — skor instrumen + rekomendasi + cetak Berita Acara & Laporan
- 📎 **Eviden / Bukti Kegiatan** — foto, dokumen, video, link, dst
- ✅ **Rekomendasi & Tindak Lanjut** — badge status, reminder visual overdue, cetak
- 📊 **Laporan resmi** — 6 jenis laporan dengan filter, kop instansi, tanda tangan, ekspor PDF (window.print) & CSV
- ⚙️ **Pengaturan** — identitas instansi, logo, tahun pelajaran, bobot aspek, backup & restore JSON, reset demo

## 🎨 Desain

- React + Vite + Tailwind CSS (tanpa dependency UI library berat)
- Palet: navy tua (#102a4d), putih, emas lembut (#eecb59), hijau toska (#2fa295)
- Sidebar di desktop, hamburger menu di mobile
- Komponen reusable: `StatCard`, `Modal`, `BarChart`, `RadarChart`, `ProgressBar`, `Badge`, `PageHeader`, `EmptyState`, `PrintHeader`

## 🛠️ Teknologi

| Layer | Stack |
|---|---|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| Storage | `localStorage` (key: `kbc_pendampingan_v1`) |
| Charts | Pure SVG (tanpa lib) |

## 🚀 Menjalankan Aplikasi

Prasyarat: **Node.js 18+**.

```bash
# install dependencies
npm install

# start dev server
npm run dev

# build production
npm run build

# preview production build
npm run preview
```

Aplikasi akan terbuka di `http://localhost:5173`.

## 🔑 Akun Demo

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Pengawas | `pengawas` | `pengawas123` |
| Kepala Madrasah | `kepala` | `kepala123` |
| Viewer / Pimpinan | `viewer` | `viewer123` |

> Akun pengawas demo terhubung otomatis ke wilayah binaannya. Akun kepala madrasah hanya melihat data madrasahnya sendiri.

## 📂 Struktur Folder

```
kbc-pendampingan-piloting/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/         # Komponen reusable
│   │   ├── AppLayout.jsx
│   │   ├── Badge.jsx
│   │   ├── BarChart.jsx
│   │   ├── EmptyState.jsx
│   │   ├── Modal.jsx
│   │   ├── PageHeader.jsx
│   │   ├── PrintHeader.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── RadarChart.jsx
│   │   └── StatCard.jsx
│   ├── context/            # React Context (state global)
│   │   ├── AuthContext.jsx
│   │   ├── DataContext.jsx
│   │   └── ToastContext.jsx
│   ├── lib/                # Utilities & domain logic
│   │   ├── constants.js
│   │   ├── scoring.js
│   │   ├── seed.js
│   │   ├── useScope.js
│   │   └── utils.js
│   ├── pages/              # 12 halaman aplikasi
│   │   ├── DashboardPage.jsx
│   │   ├── EvidenPage.jsx
│   │   ├── InstrumenPage.jsx
│   │   ├── JadwalPage.jsx
│   │   ├── LaporanPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── MadrasahPage.jsx
│   │   ├── PendampinganPage.jsx
│   │   ├── PengaturanPage.jsx
│   │   ├── PengawasPage.jsx
│   │   └── TindakLanjutPage.jsx
│   ├── App.jsx             # Routes + role guard
│   ├── index.css           # Tailwind + tema
│   └── main.jsx            # Bootstrap React
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## 📐 Aspek Penilaian KBC

Bobot dapat diubah di **Pengaturan**.

| Kode | Aspek | Default Bobot |
|---|---|---|
| A | Perencanaan Implementasi KBC | 20% |
| B | Pelaksanaan Pembelajaran Berbasis Cinta | 20% |
| C | Budaya Madrasah Berbasis Cinta | 20% |
| D | Panca Cinta KBC | 20% |
| E | Evaluasi dan Tindak Lanjut | 20% |

Skor per indikator: **1 = Belum Terlaksana**, **2 = Mulai Terlaksana**, **3 = Terlaksana**, **4 = Sangat Baik**.

Kategori capaian:

- 0–50% = **Perlu Pembinaan Intensif**
- 51–70% = **Mulai Berkembang**
- 71–85% = **Baik**
- 86–100% = **Sangat Baik**

## 💾 Penyimpanan Data

Semua data disimpan di **`localStorage` browser**, key utama `kbc_pendampingan_v1`. Backup ke JSON dapat dilakukan dari menu **Pengaturan → Backup ke JSON**.

Untuk migrasi ke backend (Supabase/Firebase), ganti implementasi di `src/context/DataContext.jsx` dengan API call. Struktur state sudah ramah untuk SDK seperti Supabase.

## 🖨️ Cetak

Aplikasi memakai `window.print()`. Hampir setiap halaman menyediakan tombol cetak yang membuka **modal pratinjau** dengan kop resmi & tanda tangan. Untuk PDF, gunakan dialog cetak browser (Save as PDF).

## 🔒 Role & Akses

| Menu | Admin | Pengawas | Kepala | Viewer |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Madrasah | ✏️ | 👁 (binaan) | 👁 (sendiri) | 👁 |
| Pengawas | ✏️ | 👁 | — | 👁 |
| Jadwal | ✏️ | ✏️ | 👁 | 👁 |
| Instrumen | ✏️ | 👁 | — | 👁 |
| Pendampingan | ✏️ | ✏️ | 👁 | 👁 |
| Eviden | ✏️ | ✏️ | ✏️ | 👁 |
| Tindak Lanjut | ✏️ | ✏️ | 👁 | 👁 |
| Laporan | ✅ | ✅ | ✅ | ✅ |
| Pengaturan | ✏️ | — | — | — |

Legenda: ✏️ edit · 👁 view · — tidak terlihat

## 🧭 Roadmap Lanjutan

- [ ] Integrasi backend (Supabase/Firebase)
- [ ] Upload file fisik (foto/dokumen) ke cloud storage
- [ ] Tanda tangan digital (TTE)
- [ ] Notifikasi otomatis untuk tindak lanjut yang melewati batas
- [ ] Ekspor PDF native (jsPDF) dengan layout custom

---

© Kelompok Kerja Pengawas Madrasah · Kementerian Agama Kabupaten Jember
