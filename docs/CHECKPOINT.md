# Checkpoint Proyek — HR Dashboard Mestakara (Frontend)

> **Tanggal checkpoint:** 9 Oktober 2026
> **Lokasi proyek:** `E:\Project\PTPN\agrowisata-mestakara\apps\mestakara-hr\web`
> **Status git:** SEMUA pekerjaan **belum di-commit** (branch `main`, baru ada commit awal *Create Next App*).
>
> Dokumen ini merangkum SELURUH pekerjaan yang sudah dibuat, aturan kerja yang disepakati,
> keputusan bisnis, struktur kode, dan hal-hal yang belum dikerjakan, supaya pekerjaan
> bisa dilanjutkan di sesi lain tanpa kehilangan konteks.

---

## Daftar Isi

1. [Aturan Kerja (WAJIB dibaca)](#1-aturan-kerja-wajib-dibaca)
2. [Teknologi & Konfigurasi](#2-teknologi--konfigurasi)
3. [Arsitektur: BFF, Mock, dan Alur Data](#3-arsitektur-bff-mock-dan-alur-data)
4. [Struktur Folder](#4-struktur-folder)
5. [Menu & Halaman](#5-menu--halaman)
6. [Fitur yang Sudah Selesai (rinci)](#6-fitur-yang-sudah-selesai-rinci)
7. [Aturan Bisnis Penting](#7-aturan-bisnis-penting)
8. [Daftar Route Handler (API BFF)](#8-daftar-route-handler-api-bff)
9. [Data Mock](#9-data-mock)
10. [Komponen, Hook, dan Lib Bersama](#10-komponen-hook-dan-lib-bersama)
11. [Kendala Teknis yang Pernah Muncul & Solusinya](#11-kendala-teknis-yang-pernah-muncul--solusinya)
12. [Cara Menjalankan & Menguji](#12-cara-menjalankan--menguji)
13. [Pekerjaan yang Belum Dikerjakan / Ide Lanjutan](#13-pekerjaan-yang-belum-dikerjakan--ide-lanjutan)
14. [Riwayat Pekerjaan (kronologis)](#14-riwayat-pekerjaan-kronologis)

---

## 1. Aturan Kerja (WAJIB dibaca)

Aturan berikut diminta pemilik proyek dan berlaku untuk SEMUA pekerjaan berikutnya:

1. **Tiga prinsip "SANGAT MUDAH"** untuk developer pemula:
   1. SANGAT MUDAH dipahami alur kode programnya.
   2. SANGAT MUDAH dibaca kode programnya.
   3. SANGAT MUDAH di-maintenance dan di-update.

   Dalam praktiknya:
   - nama yang jelas (Bahasa Inggris untuk kode, Bahasa Indonesia untuk teks UI & komentar);
   - komentar JSDoc berbahasa Indonesia di atas setiap fungsi/komponen, sering dengan sketsa ASCII tampilan;
   - satu file satu tanggung jawab;
   - logika dipisah dari tampilan (mis. `*-form-values.ts`, `*-rules.ts`, `*-stats.ts`).
2. **Action plan dulu.** Untuk fitur yang cukup besar, buat action plan, lalu JANGAN mengubah file apa pun sampai pemilik proyek mengonfirmasi ("ya, lanjutkan" / "Sudah sesuai, lanjutkan eksekusi"). Untuk perbaikan kecil atau perintah yang jelas, boleh langsung dikerjakan.
3. **Pengujian di Google Chrome** (ekstensi *Claude in Chrome*). Dev server dijalankan sendiri oleh pemilik proyek di port **3000**; jangan menjalankan dev server sendiri.
4. **Desain mengikuti tema** `@mestakara/ui`: token warna, kelas `typo-*`, komponen bawaan.
5. **Tanyakan kalau ada yang belum jelas.**
6. **JANGAN commit** kecuali diminta.
7. **Backend memakai mock dulu.** Jangan menyentuh kode Laravel di proyek sebelah (`../api`).
8. **Route handler dibuat eksplisit per route.** Tidak boleh ada slug/catch-all; `[id]` hanya untuk entitas yang punya CRUD.
9. Struktur & pola mengikuti proyek referensi `E:\Project\PTPN\agrowth\ptpn1-agrowth-fe`.
10. **Catatan di bawah isian form** memakai teks ukuran xs dengan awalan "Catatan: ..." (komponen `FieldNote`).
11. **Tabel SQL / skema database tidak perlu dibuat** di proyek ini, karena dibuat di aplikasi lain.
12. Komunikasi dengan pemilik proyek menggunakan **Bahasa Indonesia**.

---

## 2. Teknologi & Konfigurasi

| Komponen | Versi / Catatan |
|---|---|
| Next.js | **16.4.0**: `cacheComponents: true`, `partialPrefetching: true`; `proxy.ts` menggantikan middleware |
| React | 19.3.0 |
| Tailwind CSS | v4 (loader `@tailwindcss/turbopack`) |
| UI | `@mestakara/ui` dari `vendor/mestakara-ui-0.1.0.tgz` (hasil `npm pack` dari `apps/mestakara-design-system`), berbasis shadcn |
| Tabel | `@tanstack/react-table` v9.2.4 (`useTable`, `tableFeatures`, `table.FlexRender`) |
| Diagram organisasi | `@xyflow/react` v12 (React Flow, lisensi MIT) |
| Ikon | `lucide-react` (ikon WhatsApp dari Simple Icons, CC0) |
| Font | Fraunces Variable, Plus Jakarta Sans Variable |

**Hal penting tentang Next.js 16** (lihat juga `AGENTS.md`; dokumentasi resmi ada di `node_modules/next/dist/docs/`):
- Halaman dashboard memakai `export const instant = false`, karena sesi login dicek dulu oleh `RequireAuth`.
- `params`/`searchParams` dibaca di dalam `<Suspense>` lewat komponen async di dalamnya. `useSearchParams` juga wajib dibungkus Suspense.
- Tipe `PageProps<"/route">` dan `RouteContext<"/api/.../[id]">`. Setelah menambah route baru, jalankan `npx next typegen`.
- GET route handler di mode mock memanggil `await connection()` supaya tidak di-prerender saat build.
- Activity Next.js menyimpan state halaman antarnavigasi. Form yang harus kosong setiap dibuka dibungkus `FreshOnEachVisit` (key = `useRouter().bfcacheId`).

**Variabel lingkungan** (`.env.example`, salin ke `.env.local`):
```
BACKEND_URL=http://127.0.0.1:8000/api/v1   # hanya dibaca server
AUTH_MOCK=true                             # true = semua data dari mock
```

---

## 3. Arsitektur: BFF, Mock, dan Alur Data

```
Browser (client component)
   │  apiGet/apiPost/apiPut/apiDelete/apiPostForm/apiPutForm   (src/lib/http-client.ts)
   ▼
Route Handler Next.js  /api/...                                (src/app/api/**/route.ts)
   │  AUTH_MOCK=true  -> panggil fungsi mock (src/lib/mock/*-mock.ts)
   │  AUTH_MOCK=false -> forward(request, "/endpoint")         (src/lib/api-client.ts)
   ▼
Backend Laravel (BACKEND_URL)  — BELUM dipakai
```

- **`src/lib/api-client.ts`** (khusus server):
  - `callBackend`, `forward` (meneruskan Content-Type asli dan body arrayBuffer, termasuk multipart);
  - `forwardFile` (meneruskan file biner, mis. PDF);
  - `backendUnavailable`.
- **`src/lib/http-client.ts`** (khusus client): fungsi `api*` dan `ApiError`. Error 422 dipetakan per isian oleh `useFormSubmit`.
- **Sesi login:**
  - cookie HttpOnly `session_token` (`src/lib/session-cookie.ts`, `sessionCookieOptions(rememberMe)`, berlaku 8 jam);
  - `src/proxy.ts` hanya memeriksa ADA/TIDAK-nya cookie (matcher `/login` dan `/dashboard/:path*`);
  - keabsahan token dicek `/api/auth/me` lewat `AuthProvider`/`RequireAuth`.
- **Format respons API:** `{ success, message, data, errors? }` (`src/types/api/response.ts`, `src/lib/mock/mock-response.ts`: `success`, `failure`, `toNextResponse`).
- **Form dengan file** dikirim sebagai multipart `FormData`:
  - daftar (pendidikan, batih, item mutasi) dikirim sebagai **teks JSON**;
  - file lama yang dipertahankan ditandai `keep_photo`, `keep_document_file`, `keep_certificate_file`, `keep_signed_file`, `keep_basis_document_file`;
  - file ijazah memakai key `certificate_file_<id>`.
- **Id baris baru** di form diawali `baru-...`; server menggantinya dengan id tetap.

---

## 4. Struktur Folder

```
src/
├─ app/
│  ├─ (auth)/login/                 halaman login
│  ├─ api/                          route handler BFF (lihat bagian 8)
│  └─ dashboard/
│     ├─ layout.tsx                 DashboardShell + RequireAuth
│     ├─ page.tsx                   Dasbor (masih placeholder)
│     ├─ karyawan/{page, create, [id]/edit}
│     ├─ jabatan-karyawan/page.tsx
│     ├─ mutasi/{page, create, [id], [id]/edit}
│     └─ organisasi/
│        ├─ page.tsx                Struktur Organisasi (React Flow)
│        └─ {bidang, sub-unit, kategori-objek, objek-penempatan, jabatan}/{page, create, [id]/edit}
├─ components/
│  ├─ layout/                       AppSidebar, DashboardShell, NavGroupMenu, NavUser, PageBreadcrumb, SidebarBrand
│  └─ shared/                       komponen umum + data-table/
├─ config/navigation.ts             DAFTAR MENU sidebar (sumber breadcrumb juga)
├─ features/                        satu folder per fitur (halaman, form, tabel, logika)
│  ├─ auth/ dashboard/ karyawan/ jabatan-karyawan/ mutasi/
│  └─ organisasi/ bidang/ sub-unit/ kategori-objek/ objek-penempatan/ jabatan/
├─ hooks/                           useApiGet, useDeleteConfirm, useFormSubmit
├─ lib/                             aturan bisnis (*-rules.ts), util, http/api client
│  └─ mock/                         backend tiruan + organization/ (data awal)
├─ types/api/                       tipe Resource (respons) & Payload (kiriman)
└─ proxy.ts
```

---

## 5. Menu & Halaman

Sumber menu: `src/config/navigation.ts`. Sidebar dan breadcrumb menyesuaikan sendiri dari file ini.
Pola pengelompokan (25 Oktober 2026): menu yang dipakai RUTIN tampil langsung; data master / pengaturan / usulan ber-SK
dikumpulkan dalam dropdown (`▾`) — Usulan Kepegawaian, Pengaturan Jadwal, Master Organisasi. Alamat halaman tidak berubah.

| Grup | Menu | URL | Status |
|---|---|---|---|
| Menu Utama | Dasbor | `/dashboard` | ✅ Front end Tahap A (bagian 1–3) — menunggu backend |
| | Analitik SDM | `/dashboard/analitik` | ✅ Front end Tahap A (topik Karyawan & Upah) — menunggu backend |
| Kepegawaian | Data Karyawan | `/dashboard/karyawan` | ✅ Selesai |
| | Usulan Kepegawaian ▾ › Penambahan Karyawan | `/dashboard/penambahan` | ✅ Daftar usulan + wizard 4 langkah + detail (Draf/Berlaku/Dibatalkan) |
| | Usulan Kepegawaian ▾ › Penonaktifan Karyawan | `/dashboard/penonaktifan` | ✅ Daftar usulan + wizard 4 langkah + detail (dampak, ganti dokumen, batalkan) |
| | Jabatan Karyawan | `/dashboard/jabatan-karyawan` | ✅ Selesai (lihat + Ubah Atasan) |
| | Usulan Kepegawaian ▾ › Mutasi & Penempatan | `/dashboard/mutasi` | ✅ Selesai (badge jumlah Menunggu Dokumen) |
| Shift & Jadwal | Jadwal Kerja | `/dashboard/jadwal`, `/[id]` | ✅ Daftar per regu + detail jadwal (Draf/Terbit/Terkunci, proyeksi) |
| | Regu Kerja | `/dashboard/jadwal/regu` | ✅ CRUD + detail (anggota, pratinjau rotasi) |
| | Pengaturan Jadwal ▾ › Pola Kerja | `/dashboard/jadwal/pola` | ✅ CRUD (editor slot × hari) |
| | Pengaturan Jadwal ▾ › Shift | `/dashboard/jadwal/shift` | ✅ CRUD |
| | Pengaturan Jadwal ▾ › Hari Libur | `/dashboard/jadwal/hari-libur` | ✅ CRUD |
| Organisasi & Jabatan | Struktur Organisasi | `/dashboard/organisasi` | ✅ Selesai |
| | Master Organisasi ▾ › Bidang | `/dashboard/organisasi/bidang` | ✅ CRUD |
| | Master Organisasi ▾ › Sub Unit | `/dashboard/organisasi/sub-unit` | ✅ CRUD |
| | Master Organisasi ▾ › Kategori Objek | `/dashboard/organisasi/kategori-objek` | ✅ CRUD |
| | Master Organisasi ▾ › Objek Penempatan | `/dashboard/organisasi/objek-penempatan` | ✅ CRUD |
| | Master Organisasi ▾ › Jabatan | `/dashboard/organisasi/jabatan` | ✅ CRUD |
| Presensi & Upah | Unggah Absensi (tab Daftar Hadir / Lembur Reguler / Lembur DW) | `/dashboard/upah/absensi?tab=` | ✅ Tahap 2 · Tahap 3 (Lembur DW otomatis) — diuji dengan backend |
| | Pengaturan Upah ▾ › Skema Upah Karyawan | `/dashboard/upah/skema` | ✅ Front end (Tahap 1) — menunggu backend |
| | Pengaturan Upah ▾ › Kelompok Daftar Upah | `/dashboard/upah/kelompok` | ✅ Front end CRUD — menunggu backend |
| | Pengaturan Upah ▾ › Cost Center | `/dashboard/upah/cost-center` | ✅ Front end CRUD — menunggu backend |
| | Pengaturan Upah ▾ › Pengaturan Lembur | `/dashboard/upah/pengaturan-lembur` | ✅ Front end — menunggu backend |
| | Daftar Upah | `/dashboard/upah/daftar-upah` | ✅ Front end (Tahap 4) — menunggu backend |
| | Penanda Tangan ▾ › Umum / Per Kelompok Daftar Upah / Per Bidang | `/dashboard/upah/penanda-tangan/{umum,kelompok,bidang}` (+ `/[id]`) | ✅ Front end (Tahap 4) — menunggu backend |

Menu yang sudah dihapus: **Impor Data Karyawan** (`/dashboard/karyawan/impor`) dan **Penugasan Jabatan** (`/dashboard/penugasan`, diganti Jabatan Karyawan dan Mutasi & Penempatan).
Menu yang BELUM DIBUAT juga dihapus dari sidebar (25 Oktober 2026): Presensi (Rekap, Cuti & Izin), Kinerja (Penilaian, Kompetensi),
Pelatihan (Program, Realisasi), dan grup Lainnya (Analitik SDM, Laporan, Pengaturan). Tambahkan lagi ke `navigation.ts` setelah halamannya dibuat.

**Breadcrumb** (`src/lib/active-menu.ts`, `PageBreadcrumb.tsx`):
- tanpa nama grup, mis. `Dasbor › Jabatan › Tambah Jabatan`;
- `/create` → "Tambah {menu}", `/edit` → "Edit {menu}", `/{menu}/{id}` → "Detail {menu}";
- di layar mobile hanya 2 item terakhir yang tampil.

---

## 6. Fitur yang Sudah Selesai (rinci)

### 6.1 Login (`features/auth/`)
- Tampilan dari mockup Google Stitch dengan revisi:
  - layar penuh, proporsi mengikuti proyek referensi;
  - judul "Monitoring & Sentralisasi Data SDM dalam Satu Dashboard";
  - kartu statistik (8 Regional Unit Aktif, 500+ Karyawan, 5 Destinasi);
  - tanpa badge Holding BUMN, tab pegawai/regional, pilihan regional/tahun, atau tombol SSO Google.
- Nama perusahaan: "PT. Perkebunan Nusantara I (Persero) Regional 2 - Unit Agrowisata". Di layar kecil disingkat menjadi "PTPN I (Persero) Regional 2 - Unit Agrowisata" (komponen `CompanyName`).
- Isian NIK/Email + kata sandi (`PasswordInput`), "Ingat saya" (sesi 8 jam), dan redirect `callbackUrl` yang aman (`safeCallbackUrl`).
- Akun uji mode mock ada di `src/lib/mock/auth-mock.ts`.
- File: `LoginPage` (tata letak), `LoginForm` (logika), `LoginHeroPanel`, `AuthProvider` (`useAuth`, `saveLoggedInUser`), `RequireAuth`.

### 6.2 Layout Dashboard (`components/layout/`)
- Pola **sidebar-07** shadcn: `AppSidebar`, `NavGroupMenu` (`NavLink`/`NavCollapsible`, drawer mobile tertutup saat menu diklik), `NavUser`, `SidebarBrand`.
- `DashboardShell` memakai `SidebarInset` dengan `min-w-0`, supaya tabel lebar digeser di dalam kartunya sendiri dan tidak melebarkan halaman.
- Menu bisa diberi **badge angka** (`SidebarMenuBadge`). Saat ini dipakai untuk jumlah usulan mutasi Menunggu Dokumen (`usePendingTransferCount`).
  Badge berlaku juga untuk sub-menu dropdown; saat dropdown TERTUTUP, menu induknya menampilkan jumlah badge semua sub-menunya.
- Dropdown (`NavCollapsible`) otomatis terbuka saat salah satu sub-menunya menjadi halaman aktif (juga saat datang lewat link di halaman lain).

### 6.3 Struktur Organisasi (`features/organisasi/`)
- Data dari **SK KEP/IV.2/1667/XI/2023** (Lampiran IX.1–IX.9): 135 jabatan dan 210 karyawan dummy (telepon `0800-1000-xxxx`).
- Dibuat dengan React Flow:
  - **satu baris horizontal per level BRM** (BRM-1 = Manager);
  - garis siku tegak lurus (edge kustom `OrgChartEdge`: `M sx,sy V laneY H tx V ty`);
  - **garis koordinasi sudah dihapus**.
- Aturan kartu (`org-tree.ts` → `buildOrgCards`):
  - jabatan yang dipegang beberapa orang dijadikan **satu kartu**, dengan nama-nama orangnya tersusun ke bawah;
  - **kecuali** kalau setiap pemegang punya bawahan sendiri; maka kartunya dipisah per orang (mis. Pengawas Teknik & Pemeliharaan ×4, Danton ×4).
- Kartu dibuat dari **penugasan aktif** (dikunci per `assignment_id`) dan atasan per penugasan.
- Tampilan awal: Manager, Asisten Manager, dan Asisten terbuka; cabang lain dibuka dengan tombol `+`.
- Toolbar (`OrgToolbar`):
  - daftar jabatan (`PositionListPanel`, dikelompokkan per bidang);
  - pindah ke jabatan tertentu (cabang induknya otomatis dibuka);
  - Buka/Tutup Semua.
- Legenda warna BRM (`ChartLegend`), MiniMap, Controls.
- Klik orang membuka panel samping `EmployeeDetailSheet`:
  - detail karyawan, Telepon/WhatsApp/Email (`EmployeeContactButtons`);
  - atasan dan bawahan;
  - Bidang dan Keterangan.
  - Garis koordinasi TIDAK dipakai: `coordination_ids` sudah dihapus dari jabatan (tipe, mock, panel detail).
- File lain:
  - layout: `layout-org-chart.ts` (`COLUMN_GAP` 32, `ROW_GAP` 96), `node-size.ts` (`NODE_WIDTH` 288);
  - rangkaian chart: `build-org-chart.ts`, `OrgCardNode.tsx`, `EmployeeCard.tsx`, `useOrganization.ts`, `brm-level.ts`.
- Catatan React Flow:
  - node diberi `style.pointerEvents = "all"`, karena tanpa itu kartu tidak bisa diklik;
  - node/edge distabilkan dengan `useMemo`/`useCallback`.
- Fitur efek hover garis pernah dibuat, lalu **di-rollback** atas permintaan pemilik proyek.

### 6.4 Bidang (`features/bidang/`)
- Master data CRUD: nama dan keterangan. Seed berisi 7 bidang; Operasional Wilayah I/II digabung menjadi "Operasional".

### 6.5 Jabatan (`features/jabatan/`)
- CRUD jabatan:
  - Kode (`JAB-xxx`), Nama, Level BRM, Bidang, Keterangan;
  - isian "Wilayah" sudah diganti "Keterangan" (`area` → `description`).
- **Bidang opsional untuk BRM-1, wajib untuk BRM-2 ke bawah** (`needsDivision`).
- **Atasan Langsung sudah DIHAPUS dari jabatan.** Atasan sekarang diatur per penugasan karyawan. Satu jabatan **boleh dipegang beberapa orang**.
- Kartu statistik (`JabatanStats`, `position-stats.ts`): total jabatan, per level BRM, dan per bidang.
- `BrmLevelBadge` untuk badge warna BRM.

### 6.6 Sub Unit, Kategori Objek, Objek Penempatan
- **Sub Unit** (`features/sub-unit/`): master CRUD (Kantor Induk, Agrowisata Gunung Mas, Rancabali, Malabar), tidak terikat bidang.
  - Tidak bisa dihapus selama masih dipakai objek atau penugasan.
- **Kategori Objek** (`features/kategori-objek/`): master CRUD (Penginapan, Wahana, Restoran, Kafe, dll).
- **Objek Penempatan** (`features/objek-penempatan/`): CRUD dengan Nama, Kategori, **Sub Unit (bisa lebih dari satu)**, dan Keterangan. Contohnya ATV, Flying Fox, Glamping, Tea Bridge (di Gunung Mas dan Malabar).
  - Sub unit tidak bisa dilepas dari objek selama masih dipakai penugasan aktif.
  - Satu penugasan bisa punya **beberapa objek penempatan** (`placement_object_ids: string[]`), mis. House Keeping untuk Bungalow + Pondokan.

### 6.5a Job Grade Jabatan
- `positions.job_grade`: angka bulat 1–99, **opsional** (`checkJobGrade`, `formatJobGrade` di `lib/position-rules.ts`); data awal semua kosong.
- Form Jabatan: isian angka "Job Grade". Ikut dikirim di penugasan, jabatan utama karyawan, rencana penempatan, dan item mutasi (dari/ke).
- Tampil sebagai **kolom tersendiri** di semua tabel yang memuat jabatan; kosong = "-".
  - Tabel DataTable (bisa diurutkan & DIFILTER): preset `jobGradeColumn` (`sortUndefined: "last"` → "-" selalu di bawah;
    filter centang berisi grade yang ada di data, urut angka, + "- (belum diisi)") di Jabatan,
    Jabatan Karyawan, pilih karyawan Mutasi, pilih karyawan Regu, dan pilih karyawan Penonaktifan.
  - Tabel kecil (tanpa urut): Histori Jabatan, Penonaktifan langkah 1 & 4, Penambahan detail & Tinjau, Mutasi detail & Tinjau ("dari → ke").

- DataTable kini mendukung `meta.filter.options` berupa FUNGSI `(values) => FilterOption[]` (pilihan dihitung dari data kolom).

### 6.6a Kode Afdeling Sub Unit
- Sub unit = afdeling, punya `afdeling_code` (mis. Kantor Induk AFD02, Agrowisata Gunung Mas AFD03; Rancabali & Malabar belum diisi).
- Opsional, disimpan huruf besar, unik bila diisi (`lib/sub-unit-rules.ts`, `checkAfdelingCode`, `normalizeAfdelingCode`).
- Tampil hanya di master Sub Unit: kolom "Kode Afdeling" (cari & urut) dan isian di form (otomatis huruf besar).

### 6.7 Data Karyawan (`features/karyawan/`)
- **Halaman daftar:**
  - kartu statistik `KaryawanStats`:
    - Total, Laki-laki, Perempuan, Rata-rata usia;
    - Status Karyawan dan rasionya;
    - Kelompok Usia, Pendidikan Terakhir;
    - Golongan & Masa Pensiun.
  - tabel kolom:
    - No, Nama + avatar (klik = halaman detail; kolom `min-w-64` supaya nama tidak turun baris), Email, NIK, Status (filter), Jenis Kelamin (filter), Usia ("55 tahun 7 bulan", diurutkan per total bulan);
    - **Tanggal Pensiun** (+ "usia pensiun 55/56 tahun") dan **Status Pensiun** (badge, filter, urut dari yang paling dekat); hanya karyawan Tetap, lainnya "-";
    - Pendidikan (filter), Telepon, WhatsApp (kosong = sama dengan telepon), Aksi (Lihat Detail, Edit, Hapus).
  - **tidak ada kolom Jabatan**, karena jabatan ditampilkan di menu Jabatan Karyawan.
  - filter **"Pensiun pada periode"** di atas tabel (`RetirementFilter`, logika di `employee-retirement.ts`): Dari [Bulan][Tahun] s.d. [Bulan][Tahun];
    boleh hanya Dari atau hanya Sampai; periode terbalik memunculkan pesan dan tidak menyaring; menyaring data SEBELUM masuk tabel.
  - filter **Status Kepegawaian** (Aktif / Belum Aktif / Nonaktif / Semua; **bawaan Aktif**), dijalankan sebelum filter pensiun.
    Kartu **Masa Kerja** di detail memakai `service_months` dari server (masa nonaktif tidak dihitung) + "nonaktif sejak".
    Kartu statistik hanya menghitung karyawan **Aktif**. Usia/pensiun karyawan draf tanpa tanggal lahir tampil "-".
  - tombol **Tambah Karyawan** membuka wizard Penambahan (`/dashboard/karyawan/create` dialihkan ke `/dashboard/penambahan/create`).
  - filter **Periode Data** [Bulan][Tahun] [Bulan Ini] (`PeriodFilter`, aturan di `lib/period-rules.ts`), paling atas di kartu tabel;
    bawaan bulan berjalan; bulan yang belum tiba tidak bisa dipilih; tahun mulai dari Tanggal Masuk paling awal (`firstYearOf`).
    **Tanggal acuan** = tanggal terakhir bulan itu (bulan berjalan = hari ini), mis. "Data per 30 September 2026."
    Data diambil dari `GET /api/employees?period=YYYY-MM`: server menghitung `active_status`, `inactive_since`, `service_months`,
    `position` pada tanggal acuan; usia & pensiun (kartu statistik + tabel) dihitung di browser dengan tanggal acuan yang sama.
    Biodata (nama, alamat, pendidikan, batih, Status Karyawan) tetap data terbaru (tidak ada riwayatnya).
    `useApiGet` punya `refreshing` ("Memuat data periode..." selama ganti periode; data lama tetap tampil).
  - tombol **Ekspor Excel** (`ExportKaryawanButton`, sejajar dengan filter Periode Data di sisi kanan; di HP turun ke bawah) mengunduh file `.xlsx` dari `GET /api/employees/export?period=…&active_status=…`
    (ikut filter Status Kepegawaian yang dipilih; "Semua" = kosong) lewat `apiDownload` di `http-client.ts`.
    **Isi & format Excel disusun backend** (format sama persis dengan file "Database Karyawan - Unit Agrowisata (Saat Ini).xlsx":
    108 kolom A–DD, header 2 baris biru #215F9A / hijau #00B050, Tahoma 11, teks data HURUF BESAR kecuali email huruf kecil).
    Nama file dari backend (Content-Disposition): "Database Karyawan PTPN I Regional 2 Unit Agrowisata - {Bulan} {Tahun}.xlsx".
    Mode mock membalas 501 (toast "Ekspor Excel hanya tersedia saat tersambung ke backend.").
- **Form karyawan** (`KaryawanForm`, `BiodataFields`, `karyawan-form-values.ts`):
  - **Foto opsional** (`PhotoUploadField`).
  - **Status Karyawan:** Tetap, PKWT, Casual, Daily Worker. NIK wajib untuk Tetap/PKWT dan opsional untuk Casual/Daily.
  - Biodata:
    - KTP 16 digit, Jenis Kelamin, Tempat/Tanggal Lahir (DatePicker), Agama, Status Perkawinan;
    - **Tanggal Masuk** (`hire_date`, wajib, tidak boleh di masa depan, harus setelah Tanggal Lahir) = dasar **masa kerja**;
    - **No. Telepon (wajib) dan No. WhatsApp (opsional, terpisah**; kosongkan kalau sama);
    - Email, Alamat.
  - Karyawan baru hanya dibuat lewat **Penambahan Karyawan** (form dibuka dari wizard dengan `activation`).
    Tombol **Simpan sebagai Draf** (cukup Nama + Status Karyawan) muncul untuk karyawan baru / Belum Aktif; Simpan biasa = data lengkap.
    Tanggal Masuk boleh di masa depan.
  - **Tab di bawah biodata** (tab Dasar Penambahan DIHAPUS, dokumen pindah ke usulan Penambahan):
    1. **Riwayat Pendidikan** (`EducationTab` + `EducationDialog`):
       - minimal 1 riwayat;
       - yang wajib hanya Jenjang dan Tahun Lulus;
       - Pendidikan Terakhir diambil otomatis dari jenjang tertinggi.
    2. **Data Batih** (`FamilyTab` + `FamilyMemberDialog`): Suami/Istri/Anak; jenis kelamin otomatis untuk Suami/Istri.
  - Tab menampilkan jumlah data dan titik merah kalau ada isian yang salah.
  - **Pop-up saat simpan:** konfirmasi ringkasan "Apakah data karyawan di atas sudah benar?" (pop-up dokumen & "Tempatkan sekarang?" dihapus).
- Hapus karyawan hanya untuk **draf yang belum pernah aktif** (tidak pernah ada di usulan non-Draf, tidak punya penugasan);
  karyawan lain nantinya dinonaktifkan.
- **Halaman Detail Karyawan** (`/dashboard/karyawan/[id]`, `KaryawanDetailPage` + `features/karyawan/detail/*`), hanya lihat:
  - judul: foto, nama, status, **badge Status Kepegawaian**, NIK & jabatan, tombol Telepon/Email/WhatsApp (`EmployeeContactButtons`), tombol Edit;
  - kartu ringkasan (gaya `NumberCard`, opsi `textValue`): Jabatan Sekarang, Usia, **Masa Kerja** (sejak Tanggal Masuk), Pensiun;
  - Biodata & Dasar Penambahan: tiga kolom (`DetailList`), label 14px, isi 16px;
  - tab: **Biodata**, **Riwayat Pendidikan** (link ijazah), **Data Batih**,
    **Riwayat Status Kepegawaian** (`StatusHistoryTab`: TMT, kejadian, keterangan, dokumen + link, status usulan),
    **Histori Jabatan** (semua penugasan dari `/api/position-assignments?employee_id=`, + Riwayat Atasan, link dokumen & usulan mutasi).
- File ijazah bisa dibuka: isi file disimpan di `file_data` record karyawan (mock) dan dilayani
  `GET /api/employees/[id]/files?type=ijazah&education=<id>`; file contoh tanpa isi -> PDF contoh.

### 6.8 Jabatan Karyawan (`features/jabatan-karyawan/`)
- Halaman **hanya untuk melihat** riwayat jabatan semua karyawan. Penambahan/perubahan jabatan dilakukan lewat Mutasi & Penempatan.
- Kartu statistik (`JabatanKaryawanStats`, `assignment-stats.ts`).
- Tabel (`JabatanKaryawanTable`):
  - kolom terpisah Jabatan, Level BRM, Sub Unit, Objek Penempatan (bisa lebih dari satu objek per baris; dicari & difilter, tidak diurutkan); kolom lain bisa dicari, difilter, dan diurutkan;
  - Status Jabatan (`AssignmentStatusBadge`), Atasan;
  - **Masa Tugas** (Aktif / Akan Datang / Selesai);
  - **No. Dokumen** (dengan link "Lihat usulan mutasi" kalau berasal dari mutasi) dan **Dokumen** (link PDF).
- Tombol "Mutasi & Penempatan" dan banner pengingat "N usulan mutasi menunggu dokumen".
- **Ubah Atasan** (tanpa SK):
  - pilih satu atau beberapa baris (kolom centang), lalu tombol "Ubah Atasan" (`SupervisorDialog`);
  - atasan bisa lebih dari satu, keterangan opsional, ada pop-up konfirmasi;
  - hanya calon atasan dengan level BRM lebih tinggi dari SEMUA karyawan yang dipilih.
- **Riwayat Atasan** per penugasan (`SupervisorHistorySheet`), dari menu aksi baris (`AssignmentRowActions`).
- `assignment-options.ts` berisi pembentuk opsi untuk karyawan, jabatan (dengan petunjuk "JAB-xxx · BRM-n", karena ada nama jabatan kembar antarwilayah), sub unit, objek (tersaring per sub unit), dan atasan.

### 6.9 Mutasi & Penempatan (`features/mutasi/`) — fitur terbesar
**Halaman daftar** (`MutasiListPage`, `MutasiTable`):
- kartu Menunggu Dokumen, Berlaku Bulan Ini, Draf, Dibatalkan;
- tabel No. SK, Jenis, Karyawan, TMT, Status, Dibuat; tombol **Buat Usulan**.

**Wizard 4 langkah** (`MutasiWizard`, `MutasiWizardPage`, `components/shared/WizardSteps` (dipakai bersama wizard Regu)), dipakai untuk membuat maupun mengubah usulan:
1. **Pilih Karyawan** (`StepPilihKaryawan`):
   - kartu Jenis Mutasi: Penempatan Awal, Rotasi, Promosi, Demosi, Penugasan Sementara;
   - tabel karyawan bercentang;
   - karyawan yang tidak cocok dengan jenisnya, atau sedang ada di usulan lain, tidak bisa dicentang dan diberi keterangan, mis. "Ada di usulan Promosi (Draf)".
2. **Atur Penugasan Baru** (`StepPenugasanBaru`, `MutasiItemCard`):
   - TMT Berlaku dan Keterangan untuk semua karyawan; tombol "Terapkan ke Semua" (sub unit & status);
   - satu kartu per karyawan **Dari → Ke**: jabatan lama yang diakhiri, jabatan baru, status, sub unit, **objek (bisa lebih dari satu, tersaring per sub unit; objek yang tidak tersedia otomatis dibuang saat sub unit diganti)**, atasan, keterangan;
   - TMT Selesai untuk Penugasan Sementara;
   - peringatan jumlah bawahan yang atasannya akan dialihkan, dan pilihan **"Kembalikan N bawahan"** (hanya muncul kalau memang ada).
3. **Dokumen** (`StepDokumen`):
   - **Dokumen Dasar Mutasi & Penempatan** (`BasisDocumentFields`) di paling atas: Jenis (Memo, Nota Dinas, Disposisi, Surat Permohonan, Lainnya), Nomor, Tanggal, File.
     Opsional tapi sangat disarankan; boleh dikosongkan kalau SK yang diunggah sudah bisa jadi dasar. **Kalau file diunggah, Jenis/Nomor/Tanggal wajib** (`checkBasisDocument`).
   - **Sudah punya SK yang ditandatangani**: unggah scan, usulan langsung BERLAKU setelah disimpan;
   - **Buatkan SK dari template**: status MENUNGGU DOKUMEN;
   - Nomor SK otomatis `2A44/P/{yyyy}.{mm}.{dd}-` dan nomor urutnya **wajib diisi manual**;
   - Tanggal SK; Penandatangan (bawaannya Manager yang sedang menjabat).
4. **Tinjau & Simpan** (`StepTinjau`):
   - ringkasan, tabel perubahan jabatan, dan **perkiraan perubahan atasan otomatis** (`useTransferPreview` → `/api/transfers/preview`);
   - pop-up **peringatan "Dokumen dasar belum diunggah"** (Lengkapi Dulu → langkah 3 / Tetap Lanjutkan) kalau file dokumen dasar kosong, lalu pop-up konfirmasi.
- Tombol **Lanjut ter-disable** selama isian wajib langkah itu belum benar; di atas tombol tertulis "Lengkapi dulu untuk melanjutkan: ..." berisi daftar yang kurang.
- Tombol **Simpan sebagai Draf** ada di setiap langkah. Kalau server menolak, langkah yang bermasalah otomatis dibuka (`stepOfError`).
- Logika form ada di `mutasi-form-values.ts` dan validasi per langkah di `mutasi-validation.ts`.
- Bisa dibuka dengan isian awal dari alamat halaman: `/dashboard/mutasi/create?jenis=Penempatan%20Awal&karyawan=<id>`.

**Halaman detail** (`MutasiDetailPage`):
- pemberitahuan sesuai status (Draf / Menunggu Dokumen dengan 3 langkah / Berlaku / Dibatalkan beserta alasan);
- Data Usulan;
- kartu **Dokumen SK**, yang keterangannya menyesuaikan jalur dan status:
  - jalur **template**: link SK Kolektif PDF/Word dan kolom **Petikan SK** PDF/Word per karyawan;
  - jalur **"Sudah punya SK"**: dokumen template **disembunyikan**; yang tampil hanya scan yang diunggah;
- kartu **Dokumen Dasar** (Jenis, Nomor, Tanggal, File) dengan tombol Lengkapi/Ubah selama Draf / Menunggu Dokumen (`BasisDocumentDialog` → `POST /api/transfers/[id]/basis-document`);
- **Unggah Scan SK** (dengan konfirmasi) membuat usulan Berlaku. Kalau file dokumen dasar belum ada, muncul dulu pop-up **peringatan** (Lengkapi Dulu → dialog Dokumen Dasar / Tetap Lanjutkan → dialog unggah);
- **Unggah scan petikan** per karyawan (`UploadFileDialog`), menggantikan SK kolektif sebagai dokumen jabatan karyawan itu;
- daftar perubahan atasan (`SupervisorChangeList`);
- tombol **Ubah** (Draf / Menunggu Dokumen), **Hapus Draf**, **Batalkan** (`CancelTransferDialog`, alasan wajib hanya untuk usulan Berlaku);
- setelah unggah/batal, halaman dan badge sidebar dimuat ulang (`notifyTransfersChanged()`).

### 6.10 Shift & Jadwal (`features/shift`, `hari-libur`, `pola-kerja`, `regu-kerja`, `jadwal`)
Konsep dasar (hasil diskusi): **absensi nanti dihitung dari JADWAL harian per orang**, bukan dari pola.
Tiga lapis data: **Shift** (jam) → **Pola Kerja** (slot × hari siklus) → **Regu Kerja** (anggota + rotasi) → **Jadwal** (per tanggal).

- **Shift**: kode (maks. 4, **boleh sama** dengan shift lain; nama tetap unik), nama, jam mulai/selesai (`type="time"`, lintas
  tengah malam otomatis), istirahat, toleransi telat, batas scan masuk/pulang, **warna HEX** lewat `ShiftColorPicker`
  (palet rekomendasi tema `SHIFT_COLOR_PALETTE` di `shift-rules.ts`, atau ketik HEX/RGB/HSL + pipet; dibaca `lib/color.ts`,
  selalu disimpan HEX). `ShiftBadge` memakai warna itu sebagai latar + teks hitam/putih otomatis (`readableTextColor`).
  Tidak bisa dihapus kalau dipakai pola.
- **Hari Libur**: tanggal (unik), nama, jenis (Libur Nasional / Cuti Bersama / Libur Perusahaan). HANYA penanda di kalender
  (tidak otomatis meliburkan). Data contoh 2026 bukan kalender resmi.
- **Pola Kerja**: nama, panjang siklus 1–28 hari, slot (kode, nama, `rotates`, `shift_ids` per hari). Kolom hari = **Hari ke-1, Hari ke-2, …**
  (pola tidak terikat hari; hari ke-1 = Tanggal Mulai Berlaku Jadwal regu). `DayViewToolbar`: tampilkan [Hari ke-n | Nama Hari] +
  "Umpamakan Hari ke-1 = Senin…Minggu" — HANYA tampilan, tidak disimpan (`DayView`, `dayLabel` di `work-pattern-rules.ts`).
  Editor grid `PatternSlotEditor` (pilihan per hari berketerangan jam: "L (Libur)", "P (07.00–12.00)", "M (22.00–06.00 +1)" — `shiftOptionLabel`) + ringkasan `PatternSummary` (**jumlah slot** per shift per hari, jam kerja/minggu, peringatan >40 jam / tanpa libur).
  Konsep **offset siklus DIHAPUS** (membingungkan); pola 24 jam dibuat sebagai 4 slot yang urutannya berbeda.
- **Regu Kerja** — tiga halaman terpisah (data pilihan diambil bersama lewat `useReguFormData`; isian & aturan di `regu-form-values.ts`):
  - **Tambah Regu** (`/create`, `ReguWizard`) — wizard 2 langkah:
    1. **Data Regu** (`StepDataRegu`): nama, sub unit, objek, pola, ketua (opsional), mode rotasi **Tetap / Bergilir** + rotasi tiap N hari,
       **Tanggal Mulai Berlaku Jadwal** (`anchor_date`, hari apa pun = Hari ke-1 pola; dulu "Tanggal Patokan" & wajib Senin — sudah dihapus).
    2. **Anggota & Slot** (`StepAnggotaSlot`, boleh dilewati; anggota bergabung pada Tanggal Mulai Berlaku).
    Setelah simpan -> daftar regu.
  - **Edit Regu** (`/{id}/edit`, `ReguEditForm`) — HANYA Data Regu + kotak info "anggota tidak diubah di sini" dengan tombol
    **Edit Anggota Regu** (-> `/anggota`). Tombol kembali/Batal & setelah simpan -> **daftar regu**.
  - **Kelola Anggota** (`/{id}/anggota`, `ReguAnggotaPage`) — Tanggal Bergabung Anggota Baru + `StepAnggotaSlot`. Tombol kembali/Batal &
    setelah simpan -> **halaman asal** (`returnTo`): dari tombol **Kelola Anggota** di detail -> detail regu; dari tombol
    **Edit Anggota Regu** di form edit (`/anggota?dari=edit`) -> form Edit Regu.
  - Isi Anggota & Slot: tabel karyawan multi-pilih (`EmployeePickerTable`, saringan bawaan sub unit regu, karyawan yang aktif di regu lain
    tidak bisa dicentang) + daftar slot (`MemberSlotList`): anggota saat ini (latar abu, badge "Anggota saat ini", hanya dilihat) lalu karyawan
    baru dengan pilihan slot berketerangan jam kerja (`slot-hours.ts`, mis. "A — Posisi A · P 07.00–12.00 ×3, S 12.00–17.00 ×3, L ×1")
    + **Isi Slot Otomatis** (`autoFillSlots` di `group-members.ts`). Slot bergilir bentrok langsung ditandai.
  - Detail regu: anggota (`MembersTable`, status **Aktif / Akan Datang / Selesai**), **Kelola Anggota**, **Akhiri Keanggotaan**,
    **Pratinjau Rotasi 4 Minggu** (`RotationPreview`, proyeksi + "Shift kosong"; tidak ada shift kosong sebelum Tanggal Mulai Berlaku).
  - Breadcrumb `/anggota` = "Kelola Anggota Regu Kerja" (`lib/active-menu.ts`).
- **Jadwal Kerja** — dua halaman:
  - **Daftar** (`/dashboard/jadwal`, `JadwalKerjaPage` + `JadwalTable`): satu baris = satu regu (Regu, Lokasi & Pola Kerja bisa
    dicari/difilter, Anggota), aksi **Lihat Detail Jadwal** (nama regu juga bisa diklik).
  - **Detail Jadwal** (`/dashboard/jadwal/{id regu}`, `JadwalDetailPage`): judul regu + navigasi bulan ‹ ›; tombol kembali -> daftar.
    Isinya per bulan:
  - Belum ada jadwal → **Proyeksi** (`ScheduleProjectionPanel`) + tombol **Buat Jadwal** (hanya bulan berjalan & bulan depan).
  - Ada → `SchedulePeriodPanel`: status **Draf → Terbit → Terkunci**, tombol Terbitkan / Hapus Draf / Kunci / **Buat Ulang dari Tanggal…**.
  - Klik sel → `EditScheduleDialog` (shift baru / libur, alasan WAJIB kalau Terbit, riwayat perubahan). Titik kuning = ubahan manual.
  - **Buat Ulang dari Tanggal** (`RegenerateDialog`): pratinjau baris baru/dihapus/berubah/bentrok; ubahan manual dipertahankan
    (bisa dimatikan); kalau Terbit wajib alasan & setiap sel yang berubah dicatat di riwayat.
  - Peringatan otomatis kalau jadwal tidak sesuai lagi dengan anggota/pola terbaru (`outdated_count`).
  - Kalender bersama: `features/jadwal/ScheduleGrid.tsx` (akhir pekan diarsir, hari libur merah, kode slot kecil, baris Shift kosong).
- Penerbitan saat ini oleh **Admin SDM**. Ke depan: persetujuan ketua regu + terbit otomatis (status periode dibuat sebagai daftar aturan
  di `schedule-period-rules.ts` supaya mudah ditambah). Cron generate (tanggal 20 untuk bulan depan) nanti di backend Laravel;
  di mock diganti tombol "Buat Jadwal".
- **Belum dibuat**: scan & rekap absensi, cuti/izin, pengajuan tukar shift dengan persetujuan.

### 6.11 Penambahan Karyawan (`features/penambahan/`)
- **Daftar** (`PenambahanListPage` + `PenambahanTable`): usulan dengan status, jumlah karyawan, dasar, TMT, dokumen; aksi Lihat/Lanjutkan.
- **Wizard 4 langkah** (`PenambahanWizard`, logika di `penambahan-form-values.ts`; `/create` atau `/[id]/edit?langkah=1..4`):
  1. **Data Karyawan** (`StepDataKaryawan`): [Tambah Karyawan Baru] menyimpan draf usulan otomatis lalu membuka form karyawan
     di halaman terpisah (`/[id]/karyawan/baru`, `/[id]/karyawan/{employeeId}/edit`); kembali ke `?langkah=1`.
     [Pilih Karyawan] (`PickEmployeeDialog`): karyawan Belum Aktif yang tidak sibuk, atau Nonaktif. Kolom **Kelengkapan** ("Kurang n isian");
     Lanjut ter-disable selama ada data yang kurang.
  2. **Dasar Penambahan & Dokumen** (`StepDasarDokumen`): jenis per karyawan (Penerimaan Baru / Mutasi Masuk + unit asal wajib /
     Pengaktifan Kembali khusus Nonaktif), TMT Aktif; dokumen **Kolektif** atau **Per Orang** (`StatusDocumentFields` + `SignerFields`), opsional.
  3. **Penempatan** (`StepPenempatan`, opsional; tombol "Lewati" kalau kosong) memakai `PlacementFields` bersama Mutasi.
  4. **Tinjau & Simpan** (`StepTinjau`): ringkasan; peringatan kalau dokumen belum ada; konfirmasi → **Berlaku**.
- **Detail** (`PenambahanDetailPage`): Draf = Lanjutkan / Hapus Draf; Berlaku = **Unggah/Ganti Dokumen** (kolektif atau per orang,
  `UploadDocumentDialog`) dan **Batalkan Usulan** (alasan wajib, `CancelActivationDialog`). Kolom Status Karyawan menampilkan
  "Aktif mulai {TMT}" kalau TMT belum tiba.
- Bersama: `components/shared/SignerFields.tsx`, `FormPageLayout` (`extraActions`), `features/jabatan-karyawan/PlacementFields.tsx`
  (juga dipakai `MutasiItemCard`), `toSignerOptions`, `EmployeeActiveStatusBadge`.
- Aturan: `lib/activation-rules.ts`, `lib/signer-rules.ts`, `findMissingEmployeeFields` di `employee-rules.ts`.
- `DocumentScopeSection` (pilihan Kolektif / Per Orang + isian dokumen) dan `UploadDocumentDialog` (`documentsUrl`, `purpose`)
  dipakai bersama Penonaktifan.

### 6.12 Penonaktifan Karyawan (`features/penonaktifan/`)
- **Daftar** (`PenonaktifanListPage` + `PenonaktifanTable`): Dibuat, Karyawan, Jenis (filter), TMT Nonaktif, Dokumen, Status, Aksi.
- **Wizard 4 langkah** (`PenonaktifanWizard`, logika di `penonaktifan-form-values.ts`; `/create` atau `/[id]/edit`):
  1. **Pilih Karyawan** (`StepPilihKaryawan` + `PickActiveEmployeeDialog`): hanya karyawan Aktif yang tidak sedang di usulan lain.
  2. **Dasar & Dokumen** (`StepDasarPenonaktifan`): jenis per karyawan (7 jenis; "Samakan jenis untuk semua"), TMT Nonaktif
     (jenis **Pensiun → TMT otomatis dari tanggal pensiun, bisa diubah**), Unit Tujuan (Mutasi Keluar), Alasan (wajib PHK & Pensiun Dini);
     dokumen **WAJIB** kolektif / per orang.
  3. **Pratinjau Dampak** (`StepPratinjauDampak` + `useTerminationPreview` + `TerminationImpactList`), hanya dilihat:
     jabatan diakhiri, bawahan dialihkan ke atasan berikutnya, keluar dari regu kerja.
  4. **Tinjau & Simpan** (`StepTinjauPenonaktifan`): ringkasan + jumlah dampak; konfirmasi → **Berlaku**.
- **Detail** (`PenonaktifanDetailPage`): Draf = Lanjutkan / Hapus Draf (boleh dihapus); Berlaku = Ganti Dokumen & **Batalkan Usulan**
  (`CancelTerminationDialog`, alasan wajib); kartu (Perkiraan) Dampak per karyawan; "Nonaktif mulai {TMT}" kalau TMT belum tiba.
- Aturan: `lib/termination-rules.ts`.

### 6.13 Presensi & Upah karyawan Casual & Daily Worker (rancangan + Tahap 1)
**Rancangan yang disepakati (25 Oktober 2026)** — Tetap & PKWT diabaikan (remunerasi oleh Kantor Regional):
- Periode = bulan kalender (tutup buku akhir bulan; kolom "Gaji 26-31" di Excel lama tidak dipakai).
- Upah Harian = jumlah K × (Gaji Pokok ÷ HKE); HKE per karyawan, bawaan 25. Upah Flat Bulanan = Gaji Pokok penuh,
  **prorata** kalau masuk/berhenti di tengah bulan. Hanya kode **K** yang dibayar (DW = alat bantu admin; I, S, M=Mangkir,
  C=Cuti, L=Libur tidak dibayar; sel kosong = tidak masuk). Uang Makan = jumlah K × uang makan per hari (opsional per karyawan).
- Lembur (reguler & DW): tarif per jam = Gaji Pokok ÷ 173 (dibulatkan ke rupiah); semua hari = hari kerja biasa:
  jam ke-1 ×1,5, jam ke-2 dst ×2; maks 4 jam/hari, 18 jam/minggu; upah dibulatkan ke Rp 100 (PP 35/2021, sudah dikonfirmasi).
  Angka-angkanya di **Pengaturan Lembur** (bisa diubah tanpa mengubah kode), rumusnya di `lib/overtime-rules.ts`.
- Lembur DW = hari ke-21 dst untuk Casual yang dibatasi 20 hari; dibayar sebagai jam lembur. Nanti ada **Hitung Rekomendasi**:
  target = hari DW × Rp/hari, disebar acak (kelipatan 30 menit, maks 4 jam/hari, mulai 17.00) ke tanggal K/DW yang tidak punya
  lembur reguler, sedekat mungkin dengan target; ringkasan Target vs Upah Lembur DW ada di halaman Lembur DW.
- SPKL = dokumen "Daftar Lembur" per karyawan per bulan, 3 tanda tangan; SPKL Reguler & SPKL DW terpisah.
- Daftar Upah: pengelompokan bisa dipilih (bawaan Objek Penempatan; Segmen = Kategori Objek, Sub Unit, Bidang, Legacy = Kelompok
  Daftar Upah); Sub Unit + Kode Afdeling selalu tampil; karyawan dengan beberapa objek dibagi rata. Potongan (BPJS TK/KES,
  PPIP/PPh 21, Kebun/Unit) diisi manual per karyawan di daftar upah, bawaan 0.
- Absensi diunggah lewat Excel (3 bagian: Daftar Hadir, Lembur Reguler, Lembur DW). Tabel absensi backend dibuat TIDAK BERGANTUNG
  sumber (Excel / aplikasi mobile nanti / koreksi admin) dengan prioritas **manual > mobile > import Excel**; Excel tidak menimpa data
  mobile (dicatat sebagai konflik); periode yang dikunci tidak bisa berubah. Karyawan Casual & DW nanti absen lewat aplikasi mobile.
- Tahapan: (1) Data dasar upah ← sekarang, (2) Unggah Absensi, (3) Lembur DW otomatis, (4) Daftar Upah & dokumen (SPKL, ekspor).

**Tahap 1 — front end** (`features/skema-upah/`, `kelompok-upah/`, `cost-center/`, `pengaturan-lembur/`, `karyawan/detail/BankCostCenterTab.tsx`):
- **Skema Upah Karyawan**: Periode Data (bawaan bulan berjalan, tahun mulai `FIRST_WAGE_YEAR` 2026), kartu ringkasan, tabel
  (Nama + No. Reg, Status, Sub Unit + AFD, Objek, Jenis Upah / "Belum diatur", Gaji Pokok, HKE, Rp/hari, Batas Hari,
  Tunj. Operasional & Jabatan, Insentif, Uang Makan/hari, Kelompok, Berlaku Mulai); menu Aksi = Ubah/Atur Skema (`EditSkemaDialog`)
  & Riwayat (`SkemaHistorySheet`); centang baris → **Ubah Sekaligus** (`BulkSkemaDialog`, hanya isian yang dicentang dikirim; karyawan
  tanpa skema wajib diberi Jenis Upah + Gaji Pokok); **Unduh Template** & **Unggah Excel** (`ImportSkemaDialog`: periksa → pratinjau
  berubah/tidak berubah/salah → simpan, ditolak selama ada baris salah). Satu template untuk skema + rekening + cost center.
- Isian skema (`WageSchemeFields`, logika `skema-upah-form-values.ts`, aturan `lib/wage-rules.ts`): Jenis Upah (Harian / Flat Bulanan),
  Gaji Pokok, HKE (25), Dibatasi maks. N hari (20), Tunjangan Operasional & Jabatan (0), Insentif (0), Diberi Uang Makan + Uang Makan
  per Hari, Kelompok Daftar Upah (opsional), Berlaku Mulai, Keterangan. Setiap simpan = catatan riwayat baru (tidak pernah dihapus).
- **Rekening & Cost Center** untuk SEMUA karyawan: tab baru di detail karyawan (nilai berlaku + riwayat + dialog Ubah), dan tampil di
  tab Biodata (`bank_account`, `cost_center` di EmployeeProfileResource, opsional).
- Master **Kelompok Daftar Upah** & **Cost Center** (pola Bidang), **Pengaturan Lembur** (angka aturan + contoh perhitungan langsung
  `OvertimeExample` + jam mulai & uraian bawaan DW). Penandatangan SPKL/Daftar Upah yang dulu ada di sini dipindah ke menu
  **Penanda Tangan** (Tahap 4).
- Semua endpoint upah **tidak punya mock**: mode mock membalas 501 (`backendOnly()` di `mock-response.ts`).

**Tahap 2 — Unggah Absensi, front end** (`features/unggah-absensi/`, aturan `lib/attendance-rules.ts`, tipe `types/api/attendance.ts`):
- Satu halaman, pilihan Periode di atas, lalu **Tab Bar**: Daftar Hadir · Lembur Reguler · Lembur DW. Tab yang dibuka disimpan di
  alamat (`?tab=daftar-hadir|lembur-reguler|lembur-dw`, halaman dibungkus Suspense karena `useSearchParams`). Badge tab: ✓ sudah
  diunggah (lembur + jumlah baris) · ● Belum · ⚠ konflik. Status periode Draf / Dikunci (dikunci = unggah & koreksi mati).
- Setiap tab: `ImportSectionCard` (keterangan, terakhir diunggah, Riwayat → `ImportHistorySheet`, Unduh Template, Unggah File →
  `AttendanceImportDialog`: periksa → pratinjau baru/diubah/dihapus/tetap + salah/peringatan/konflik → simpan; salah menghalangi).
- Tab Daftar Hadir: `AttendanceRecapTable` (K, DW, I, S, M, C, L, Kosong, jam Lembur Reguler & DW, catatan peringatan/konflik) → klik
  nama → `AttendanceDetailSheet` (kalender bulan, warna per kode, ✎ manual, • mobile, tanggal tidak aktif abu-abu; daftar lembur; jejak
  perubahan) → klik tanggal → `AttendanceCorrectionDialog` (kode baru atau kosong, **alasan wajib**, sumber "manual").
- Tab Lembur Reguler / DW: `LemburTab` + `OvertimeEntryTable` (tanggal, karyawan, sub unit, objek, jam (+1 lewat tengah malam), durasi,
  uraian, sumber, catatan) + ringkasan jumlah baris · karyawan · jam.
- Dialog unggah umum **`components/shared/ExcelImportDialog.tsx`** (pilih → periksa → simpan, `extraFields`, `canSave`, `renderPreview`)
  dipakai Unggah Absensi DAN Unggah Excel Data Upah (`ImportSkemaDialog` sekarang hanya berisi tampilan pratinjaunya).
- Keputusan Tahap 2: koreksi manual per tanggal ada; >4 jam/hari, >18 jam/minggu, lembur di hari L/kosong, K melebihi batas, karyawan
  aktif tak ada di file = peringatan; lembur di hari I/S/M/C = salah; unggah ulang menggantikan data Excel bagian itu (termasuk
  mengosongkan); karyawan template = aktif minimal sehari dalam periode (tanggal tidak aktif diarsir); bulan s.d. bulan berjalan;
  lembur boleh beberapa baris per tanggal asal tidak tumpang tindih.
- Tabel rekap & daftar lembur juga menampilkan Jabatan, Kelompok Upah, Cost Center, Uraian Cost Center (nilai per akhir periode),
  sama dengan kolom template unggahan.

**Tahap 3 — Lembur DW otomatis, front end** (di tab Lembur DW; tipe `types/api/dw-overtime.ts`, aturan `lib/dw-overtime-rules.ts`):
- Hari DW = jumlah kode DW di daftar hadir. Target = hari DW × Rp/hari; Selisih = Upah Lembur DW − Target. Status: Sesuai (|selisih|
  ≤ upah 30 menit lembur), Kurang, Lebih, Belum ada lembur, Skema belum diatur.
- `DwTargetSection`: 4 kartu (karyawan ber-DW, total target, total upah, selisih) + `DwTargetTable` (centang baris, Jabatan, Sub Unit,
  Kelompok Upah, Hari DW, Rp/hari, Target, Jam DW, Upah, Selisih, Status, Sumber) + tombol **Hitung Rekomendasi** (semua / dicentang).
- `DwRecommendationDialog`: langsung menghitung pratinjau (tidak menyimpan) → per karyawan target, upah hasil, selisih, status, jumlah
  tanggal (klik = tanggal & jam), baris lama diganti / manual-mobile dipertahankan; yang dilewati + alasannya → **Acak Ulang** / **Simpan**
  (dikirim persis yang tampil).
- Penggantian sumber (keputusan 26 Okt 2026): **manual & mobile tidak pernah dihapus**; Hitung Rekomendasi menghapus baris Excel +
  rekomendasi lama karyawan yang dihitung; Unggah Excel Lembur DW menghapus SEMUA baris Excel + rekomendasi periode itu. Yang terakhir
  disimpan yang berlaku.
- Tab Lembur Reguler & DW: **Tambah Lembur** + menu Aksi per baris (Edit / Hapus) → `OvertimeEntryDialog` / `OvertimeDeleteDialog`,
  alasan wajib, hasilnya bersumber Manual; peringatan server (mis. > 4 jam) tampil di toast. Periode dikunci = semua tombol mati.
- Badge tab memakai `entry_count` (semua sumber), bukan hanya unggahan Excel.

**Tahap 4 — Daftar Upah & dokumen, front end** (`features/daftar-upah/`, `features/penanda-tangan/`; tipe `types/api/payroll.ts`,
`types/api/signature.ts`; aturan `lib/payroll-rules.ts`, `lib/signature-rules.ts`). Keputusan 26 Oktober 2026:
- Rumus (backend): Harian = min(K, batas) × Rp/hari (K > batas = peringatan); Flat = Gaji Pokok, prorata hari aktif; Lembur = reguler +
  DW; Uang Makan = K × per hari; Jumlah − Potongan (BPJS TK/KES, PPIP/PPh 21, Kebun/Unit; manual, bawaan 0) = Diterima.
- Pengelompokan HANYA **Kelompok Daftar Upah** atau **Bidang** (bidang jabatan utama); setiap karyawan tepat satu kelompok; tanpa →
  "Tanpa Kelompok"/"Tanpa Bidang". Objek/Segmen/Sub Unit & isian "Objek Daftar Upah" di skema DITUNDA.
- **Penanda tangan fleksibel** (menu Penanda Tangan ▾: Umum · Per Kelompok Daftar Upah · Per Bidang): susunan = bagian berurutan
  (nama bebas, mis. Dibuat/Diperiksa/Perhitungan Dibenarkan/Disetujui Oleh), tiap bagian ≥ 1 orang; orang = pilih karyawan (nama &
  jabatan selalu dari data terbaru, jabatan TIDAK bisa diubah) atau manual (nama + jabatan diketik). Dua susunan: Daftar Upah & SPKL,
  + Tempat. Kelompok/bidang tanpa susunan sendiri ("Pakai penanda tangan Umum") & sheet REKAP / Tanpa Kelompok/Bidang memakai Umum.
  Editor `SignatureSectionsEditor` (+ `signature-form-values.ts`, `useSignerEmployees` = karyawan aktif sekarang).
- Halaman Daftar Upah: Periode + status Draf/Dikunci + Kunci/Buka Kunci (alasan wajib; bulan berjalan belum bisa dikunci), Kesiapan
  (`PayrollReadinessCard`, hanya peringatan), 4 kartu, Kelompokkan berdasarkan (Tabs), rekap per kelompok (`PayrollGroupTable`, klik =
  filter rincian), rincian (`PayrollTable`: centang, Rincian Upah `PayrollDetailSheet`, Ubah Potongan `DeductionDialog` satu /
  sekaligus — isian kosong = tidak diubah), **Salin Potongan Bulan Lalu** (`CopyDeductionsDialog`: pratinjau → salin, hanya yang
  potongannya masih 0), riwayat kunci.
- Ekspor (`PayrollExportDialog`): Daftar Upah & SPKL (Reguler/DW), menurut pengelompokan halaman, semua kelompok (Daftar Upah: + REKAP
  & PAYROLL) atau satu, format **Excel atau PDF**, susunan mengikuti file DU & Daftar Lembur lama; draf = bertanda DRAF; SPKL hanya
  karyawan yang dicentang kalau ada centang.
- Kunci periode membekukan angka (kedua pengelompokan) + penanda tangan; Tahap 2/3 & potongan ditolak selama dikunci.

---

## 7. Aturan Bisnis Penting

### Level BRM & pensiun
- BRM-1 = Manager (tertinggi). Angka BRM yang lebih kecil berarti level yang lebih tinggi.
- **Karpim** (BRM-1..3) pensiun pada usia **56**; **karpel** (BRM-4..6) pada **55**; karyawan yang belum ditempatkan dianggap 55 (`employee-rules.ts`).
- Tanggal pensiun = tanggal lahir + usia pensiun (sementara; mungkin nanti TMT tanggal 1 bulan berikutnya). **Hanya karyawan Tetap** yang punya masa pensiun (`hasRetirement`).
- Kategori pensiun (`RETIREMENT_PERIODS`, `getRetirementPeriod`): Sudah Pensiun, ≤ 1 bulan, > 1 ≤ 3 bulan, > 3 ≤ 6 bulan, > 6 bulan ≤ 1 tahun, > 1 ≤ 2 tahun, > 2 tahun (batas memakai bulan kalender, `addMonths`).

### Penugasan (jabatan karyawan)
- Status Jabatan: **Definitif, Penugasan, Pj, Plt, Plh, Ptr** (`assignment-rules.ts`).
- Masa tugas dihitung dari TMT mulai/selesai: **Akan Datang / Aktif / Selesai** (`getAssignmentPeriod`, `isAssignmentActive`).
- Atasan disimpan sebagai **id penugasan** (`supervisor_assignment_ids`), bukan id karyawan, karena satu orang bisa memegang beberapa jabatan.
- Atasan wajib untuk BRM-2 ke bawah dan harus ber-level BRM lebih tinggi serta sedang aktif (`needsSupervisor`, `canBeSupervisor`).
- Penugasan bawaan (seed) sah tanpa usulan dan tidak bisa dihapus.
- Jabatan utama karyawan: Definitif lebih dulu, kalau tidak ada maka BRM tertinggi (`findMainPosition`).

### Mutasi & Penempatan
| Jenis | Jabatan lama |
|---|---|
| Penempatan Awal | Tidak ada (khusus karyawan yang belum punya jabatan aktif) |
| Rotasi / Promosi / Demosi | **Wajib** dipilih, dan diakhiri sehari sebelum TMT Berlaku |
| Penugasan Sementara | Tidak mengakhiri jabatan lama; status bawaan Plt; ada TMT Selesai |

- **Status usulan:** `Draf` → `Menunggu Dokumen` (jalur template) → `Berlaku`; atau `Dibatalkan`.
- **Tidak ada fitur koreksi.** Kalau salah: hapus Draf lalu buat ulang, batalkan, atau buat usulan mutasi baru.
- **Tidak ada tahap persetujuan (approval).**
- **Pembatalan:**
  - Menunggu Dokumen: cukup dibatalkan; alasan opsional.
  - Berlaku: hanya bisa membatalkan **seluruh** usulan, dengan **alasan wajib**. Jabatan baru dihapus, jabatan lama aktif lagi, dan perubahan atasan dikembalikan.
  - Pembatalan Berlaku diblokir kalau karyawannya sudah dimutasi lagi, kalau ada usulan yang lebih baru mengubah bawahan yang sama, atau kalau ada orang lain yang kini melapor ke jabatan hasil usulan ini (`revertTransfer`).
- **Pengalihan atasan otomatis** (`planSupervisorChanges` di `transfer-plan.ts`): saat seseorang dipindah, bawahannya dialihkan
  - ke **pemegang baru** jabatan itu kalau jabatan tersebut diisi dalam usulan yang sama;
  - kalau tidak, **naik ke atasan orang yang dipindah** (mis. BRM-3 dipindah → BRM-4 melapor ke BRM-2).
- **"Kembalikan bawahan":** orang yang pindah ke jabatan yang dulu kosong bisa menarik kembali bawahan yang sebelumnya dialihkan dari jabatan itu (`vacated_position_id`).
- **Dokumen dasar mutasi:** sama dengan dokumen dasar Penambahan/Penonaktifan (isian berawalan `basis_`, diterjemahkan oleh
  `toStatusDocument` / `fromStatusDocument` di `transfer-rules.ts`): jenis SK/Memo/Nota Dinas/Disposisi/Surat Permohonan/Lainnya;
  opsional, tapi kalau salah satu isian diisi maka jenis, nomor, tanggal & file wajib; **penandatangan (`basis_signer_*`) wajib kalau SK**.
  SK mock mengutipnya di baris "Memperhatikan: ...".
- **Penandatangan SK mutasi** (wajib): Unit (pejabat yang sedang menjabat, bawaan Manager) / Kantor Regional / Head Office
  (nama & jabatan diketik) — komponen `SignerFields`, aturan `checkSigner`. Nomor & kop SK template tetap format unit.
- **Dokumen:**
  - nantinya dibuat backend; saat ini memakai file mock (`transfer-documents.ts`: PDF contoh dan Word berupa HTML `.doc`);
  - usulan baru berlaku setelah **scan SK kolektif** diunggah; backend nanti menyimpannya untuk semua karyawan;
  - petikan yang diunggah per karyawan **menggantikan** file SK kolektif untuk karyawan tersebut.
- Satu karyawan tidak boleh ada di dua usulan yang belum selesai (Draf / Menunggu Dokumen).
- Nomor SK harus unik antarusulan.
- Penandatangan dari Unit harus pejabat yang sedang menjabat (`unitSignerError` di `status-document-mock.ts`).

### Penambahan Karyawan (`lib/activation-rules.ts`, `lib/signer-rules.ts`)
- **Status karyawan dihitung saat dibaca** (`getEmployeeActiveStatus`): Aktif kalau ada item usulan Berlaku dengan TMT ≤ hari ini,
  selain itu Belum Aktif. (Nonaktif datang bersama fitur Penonaktifan.) Backend nanti memakai job harian pada TMT.
- Status usulan: **Draf → Berlaku**, atau Berlaku → **Dibatalkan** (alasan wajib). Hanya Draf yang bisa diubah/dihapus.
- Saat Berlaku: penugasan dibuat dari isian penempatan (nomor SK diambil dari dokumen kolektif / per orang).
  Pembatalan menghapus penugasan itu; diblokir kalau penugasannya sudah dimutasi lagi atau menjadi atasan orang lain.
- Syarat Simpan (Berlaku): data karyawan lengkap, belum aktif/terjadwal, tidak ada di usulan Draf lain atau mutasi terbuka,
  jenis sesuai status, TMT ≥ Tanggal Masuk, unit asal untuk Mutasi Masuk, aturan penempatan sama dengan Mutasi.
- **Dokumen dasar** (satu isian; jenis SK/Memo/Nota Dinas/Disposisi/Surat Permohonan/Lainnya): opsional; kalau satu isian diisi,
  jenis + nomor + tanggal + file wajib; **penandatangan wajib hanya untuk SK**. Usulan Berlaku boleh unggah/ganti dokumen kemudian.
- **Penandatangan** (`signer_source`): Unit (pilih pejabat aktif) / Kantor Regional / Head Office (nama & jabatan diketik).
- Karyawan Belum Aktif tidak bisa dimutasi (`checkEmployee` di `transfer-mock.ts` mewajibkan Aktif).
- Draf karyawan yang pernah masuk usulan non-Draf (termasuk yang **Dibatalkan**) tidak bisa dihapus permanen.

### Penonaktifan Karyawan (`lib/termination-rules.ts`, `lib/mock/termination-apply.ts`)
- Jenis: Pensiun, Pensiun Dini, Mengundurkan Diri, PHK, Kontrak Berakhir, Mutasi Keluar, Meninggal Dunia.
  Alasan wajib untuk PHK & Pensiun Dini; Unit Tujuan wajib untuk Mutasi Keluar. Dokumen dasar WAJIB (penandatangan wajib kalau SK).
- **TMT nonaktif = hari pertama tidak aktif.** Saat Berlaku (`applyTermination`):
  jabatan yang masih berjalan & keanggotaan regu diakhiri **sehari sebelum TMT**; bawahannya dialihkan ke atasan karyawan itu
  (`planSupervisorChanges` Mutasi, tanpa pemegang baru), tercatat di Riwayat Atasan dengan sumber "Penonaktifan {nomor}"
  (`supervisor_changes.termination_id`). Nilai lama disimpan di item (`ended_assignments`, `ended_memberships`) untuk pembatalan.
- Di mock dampak langsung diterapkan saat Berlaku (tanggalnya sudah benar); di backend job harian pada TMT. Akun login belum ada di mock.
- **Status karyawan** = kejadian TERAKHIR yang sudah tiba (Penambahan / Penonaktifan Berlaku): Aktif / Nonaktif / Belum Aktif.
  `inactive_since` = TMT nonaktif terakhir; `service_months` = jumlah masa aktif saja.
- Syarat Berlaku: karyawan sedang Aktif, belum terjadwal nonaktif, tidak di usulan Draf lain / mutasi terbuka,
  TMT > TMT aktif terakhir, tidak punya jabatan yang baru mulai pada/setelah TMT.
- **Pembatalan** mengembalikan jabatan, regu, dan atasan bawahan (yang belum diubah lagi); ditolak kalau karyawan sudah
  diaktifkan kembali lewat Penambahan (batalkan penambahan itu dulu).
- **Pengaktifan Kembali** (Penambahan, khusus Nonaktif): TMT aktif harus setelah TMT nonaktif terakhir.
- Mutasi & Penambahan menolak karyawan yang sedang di usulan Penonaktifan Draf.

### Shift & Jadwal (`lib/shift-rules.ts`, `work-pattern-rules.ts`, `schedule-rules.ts`, `schedule-period-rules.ts`)
- Rumus rotasi satu anggota pada satu tanggal (`slotOnDate`, `dayIndexOnDate`):
  `selisih_hari = tanggal − anchor_date`, `putaran_sekarang = floor(selisih / rotate_every_days)`,
  `putaran_bergabung = floor((start_date − anchor_date) / rotate_every_days)`, `langkah_maju = sekarang − bergabung`,
  `index_slot = (posisi slot awal + langkah_maju) mod jumlah slot bergilir`, `day_index = (selisih mod cycle_days) + 1`.
- `start_slot_id` = slot **saat bergabung** (bukan saat anchor); semua anggota pindah slot di hari yang sama.
- Mode Tetap / slot `rotates = false` → selalu slot awal. Hanya slot bergilir di regu Bergilir yang **hanya boleh 1 orang**;
  slot tetap boleh dipegang beberapa orang (mis. pola Reguler Kantor).
- Satu karyawan hanya di **satu regu aktif**. Tanggal bergabung ≥ anchor_date (Tanggal Mulai Berlaku Jadwal, hari apa pun).
- `active_member_count` = anggota Aktif + Akan Datang; anggota baru disimpan bersama regu (`members` + `members_start_date` di payload).
- Lowongan (`findVacancies`) = slot tanpa pemegang aktif; di jadwal tersimpan = shift yang jumlah orangnya < kebutuhan pola (`computeVacancies`).
- Jadwal menyimpan **salinan jam** (`planned_start/end`); shift malam selesai keesokan hari; absensi dicatat pada tanggal mulai shift.
- Jendela jadwal: bulan berjalan + bulan depan (`monthPosition`). Draf boleh dihapus; Terkunci tidak bisa diubah/dibuat ulang.

### Lainnya
- Objek penempatan (boleh lebih dari satu) harus SEMUANYA tersedia di sub unit yang dipilih.
- Ubah Atasan (tanpa SK) tercatat di Riwayat Atasan dengan sumber dan keterangan.

---

## 8. Daftar Route Handler (API BFF)

| Route | Method | Keterangan |
|---|---|---|
| `/api/auth/login` | POST | Login (NIK/Email + sandi), set cookie |
| `/api/auth/logout` | POST | Hapus cookie |
| `/api/auth/me` | GET | Data user login |
| `/api/organization` | GET | Data struktur organisasi |
| `/api/divisions`, `/api/divisions/[id]` | GET POST / GET PUT DELETE | Bidang |
| `/api/sub-units`, `/[id]` | GET POST / GET PUT DELETE | Sub Unit |
| `/api/placement-categories`, `/[id]` | GET POST / GET PUT DELETE | Kategori Objek |
| `/api/placement-objects`, `/[id]` | GET POST / GET PUT DELETE | Objek Penempatan |
| `/api/positions`, `/[id]` | GET POST / GET PUT DELETE | Jabatan |
| `/api/employees`, `/[id]` | GET POST / GET PUT DELETE | Karyawan (multipart; `save_mode=draft`, `activation_id`). GET daftar menerima `period=YYYY-MM` (status, jabatan, masa kerja per tanggal acuan; salah / masa depan = 422) |
| `/api/employees/[id]/files` | GET | File ijazah (`type=ijazah`, `education`) |
| `/api/employees/export` | GET | File Excel data karyawan (`active_status`; kosong = semua). `forwardFile`; mock = 501 |
| `/api/employees/[id]/status-history` | GET | Riwayat status kepegawaian |
| `/api/employee-activations` | GET POST | Daftar / buat usulan penambahan (multipart, `action` = draft/submit) |
| `/api/employee-activations/[id]` | GET PUT DELETE | Detail / ubah / hapus draf |
| `/api/employee-activations/[id]/documents` | POST | Unggah/ganti dokumen dasar usulan Berlaku (`item_id` kosong = kolektif) |
| `/api/employee-activations/[id]/cancel` | POST | Batalkan usulan Berlaku (alasan wajib) |
| `/api/employee-activations/[id]/files` | GET | File dokumen dasar (`item=` untuk per orang) |
| `/api/employee-terminations` | GET POST | Daftar / buat usulan penonaktifan (multipart, `action` = draft/submit) |
| `/api/employee-terminations/preview` | POST | Pratinjau Dampak (JSON `items: [{id, employee_id, effective_date}]`) |
| `/api/employee-terminations/[id]` | GET PUT DELETE | Detail (+ dampak per item) / ubah / hapus draf |
| `/api/employee-terminations/[id]/documents` | POST | Ganti dokumen usulan Berlaku (`item_id` kosong = kolektif) |
| `/api/employee-terminations/[id]/cancel` | POST | Batalkan usulan Berlaku (alasan wajib) |
| `/api/employee-terminations/[id]/files` | GET | File dokumen dasar (`item=` untuk per orang) |
| `/api/position-assignments` | GET | Daftar penugasan (Jabatan Karyawan); `?employee_id=` untuk satu karyawan |
| `/api/position-assignments/[id]` | GET | Detail penugasan |
| `/api/position-assignments/[id]/decree-file` | GET | File dokumen penugasan (PDF) |
| `/api/position-assignments/[id]/supervisor-history` | GET | Riwayat atasan |
| `/api/position-assignments/supervisors` | POST | Ubah atasan (banyak sekaligus) |
| `/api/shifts`, `/[id]` | GET POST / GET PUT DELETE | Shift |
| `/api/holidays`, `/[id]` | GET POST / GET PUT DELETE | Hari libur |
| `/api/work-patterns`, `/[id]` | GET POST / GET PUT DELETE | Pola kerja (slot + isi hari dalam satu payload) |
| `/api/cost-centers`, `/[id]` | GET POST / GET PUT DELETE | Master cost center (mock = 501) |
| `/api/payroll-groups`, `/[id]` | GET POST / GET PUT DELETE | Master Kelompok Daftar Upah (mock = 501) |
| `/api/overtime-settings` | GET PUT | Pengaturan Lembur (tanpa penandatangan sejak Tahap 4; mock = 501) |
| `/api/wage-schemes` | GET `?period=` | Karyawan Casual & DW aktif + skema, rekening, cost center yang berlaku (mock = 501) |
| `/api/wage-schemes/bulk` | POST | Ubah skema banyak karyawan (`fields` = isian yang diubah) |
| `/api/wage-schemes/template` | GET `?period=` | File Excel template data upah (`forwardFile`) |
| `/api/wage-schemes/import/preview`, `/import` | POST | Periksa / simpan file Excel data upah (multipart `file`) |
| `/api/employees/[id]/wage-schemes`, `/bank-accounts`, `/cost-centers` | GET POST | Riwayat & tambah catatan skema / rekening / cost center |
| `/api/attendance-imports` | GET `?period=` POST | Status unggahan 3 jenis + riwayat / simpan unggahan (multipart `file`, `period`, `type`) (mock = 501) |
| `/api/attendance-imports/template` | GET `?period=&type=` | File Excel template absensi/lembur (`forwardFile`) |
| `/api/attendance-imports/preview` | POST | Periksa file absensi tanpa menyimpan |
| `/api/attendance-summaries` | GET `?period=` | Rekap daftar hadir per karyawan Casual & DW |
| `/api/overtime-entries` | GET `?period=&type=` POST | Daftar lembur reguler / DW / tambah baris manual (alasan wajib) |
| `/api/overtime-entries/[id]` | PUT DELETE `?reason=` | Ubah (jadi Manual) / hapus satu baris lembur (alasan wajib; DELETE lewat query) |
| `/api/dw-overtime-targets` | GET `?period=` | Target vs Upah Lembur DW per karyawan (→ `/overtime-dw/targets`) |
| `/api/dw-overtime-recommendations/preview` | POST | Hitung rekomendasi Lembur DW tanpa menyimpan (`period`, `employee_ids?`) |
| `/api/dw-overtime-recommendations` | POST | Simpan rekomendasi (persis hasil pratinjau) |
| `/api/signature-settings/general` | GET PUT | Penanda tangan Umum (tempat + susunan Daftar Upah & SPKL) |
| `/api/signature-settings/payroll-groups`, `/[id]` | GET / GET PUT | Penanda tangan per Kelompok Daftar Upah (null = pakai Umum) |
| `/api/signature-settings/divisions`, `/[id]` | GET / GET PUT | Penanda tangan per Bidang (null = pakai Umum) |
| `/api/payroll` | GET `?period=&group_by=payroll_group\|division` | Daftar Upah (status, kesiapan, ringkasan, kelompok, baris) |
| `/api/payroll/deductions` | PUT | Ubah potongan satu / sekaligus |
| `/api/payroll/deductions/copy-previous` | POST `{period, save}` | Salin potongan bulan lalu (save false = pratinjau) |
| `/api/payroll/lock`, `/unlock` | POST | Kunci / buka kunci periode (buka: alasan wajib) |
| `/api/payroll/export` | GET `?period=&group_by=&group_key=&format=xlsx\|pdf` | File Daftar Upah (`forwardFile`) |
| `/api/payroll/spkl` | GET `?period=&type=reguler\|dw&group_by=&group_key=&format=&employee_ids=` | File SPKL (`forwardFile`) |
| `/api/employees/[id]/attendance` | GET `?period=` PUT | Detail absensi (kode per tanggal, lembur, jejak) / koreksi manual (alasan wajib) |
| `/api/work-groups`, `/[id]` | GET POST / GET PUT DELETE | Regu kerja (+ anggota di resource) |
| `/api/work-groups/[id]/members` | GET | Anggota (tambah anggota lewat POST/PUT `/api/work-groups` dengan `members`) |
| `/api/work-groups/[id]/members/[memberId]` | PUT | Akhiri keanggotaan (`end_date`) |
| `/api/work-groups/[id]/projection` | GET `?from&to` | Proyeksi jadwal + lowongan (maks. 62 hari, tidak disimpan) |
| `/api/schedule-periods` | GET `?group_id&month` POST | Daftar periode / buat jadwal (Draf) |
| `/api/schedule-periods/[id]` | GET DELETE | Detail (+ baris jadwal, lowongan, `outdated_count`) / hapus Draf |
| `/api/schedule-periods/[id]/publish`, `/lock` | POST | Terbitkan / kunci |
| `/api/schedule-periods/[id]/regenerate/preview`, `/regenerate` | POST | Pratinjau / terapkan buat ulang dari tanggal |
| `/api/schedules/[id]` | PUT | Ubah satu sel (alasan wajib bila Terbit) |
| `/api/schedules/[id]/changes` | GET | Riwayat perubahan satu sel |
| `/api/transfers` | GET POST | Daftar / buat usulan mutasi (multipart, `action` = draft/submit) |
| `/api/transfers/preview` | POST | Perkiraan perubahan atasan |
| `/api/transfers/[id]` | GET PUT DELETE | Detail / ubah / hapus draf |
| `/api/transfers/[id]/activate` | POST | Unggah scan SK, lalu Berlaku |
| `/api/transfers/[id]/cancel` | POST | Batalkan (alasan) |
| `/api/transfers/[id]/basis-document` | POST | Simpan dokumen dasar (multipart; Draf / Menunggu Dokumen) |
| `/api/transfers/[id]/documents` | GET | Unduh SK/petikan (`type=sk\|petikan\|scan\|scan-petikan\|dasar`, `item`, `format=pdf\|doc`) |
| `/api/transfers/[id]/items/[itemId]/excerpt` | POST | Unggah scan petikan |

Error validasi memakai status **422**, dengan key `errors` per isian. Untuk item mutasi, formatnya `items.<itemId>.<field>`.

---

## 9. Data Mock

- **Store bersama:** `src/lib/mock/organization-store.ts` (`globalThis`).
  - Berisi divisions, subUnits, placementCategories, placementObjects, positions, employees, assignments, supervisorChanges, transfers, activations, terminations.
  - **`STORE_VERSION = 40`**: naikkan angka ini untuk me-reset data mock tanpa restart dev server, mis. setelah mengubah bentuk data atau untuk membersihkan data uji.
  - Fungsi `to*Resource` mengubah record menjadi bentuk respons API.
- **Data awal** (`src/lib/mock/organization/`):
  - `01-manager.ts` … `09-marketing-sales.ts`: jabatan per lampiran SK (`position()` dari `helpers.ts`);
  - `employees.ts`: 210 karyawan dummy dengan biodata, pendidikan, dan batih (sebagian Casual/Daily tanpa NIK; sebagian punya WA berbeda);
    tanggal masuk contoh paling lambat 2021 (minimal usia 18), selalu sebelum penugasan pertama;
    3 karyawan diberi tanggal lahir tetap (`NEAR_RETIREMENT_BIRTH_DATES`) supaya kategori pensiun ≤ 1, ≤ 3, ≤ 6 bulan punya contoh (per Oktober 2026);
  - `placements.ts`: sub unit, kategori, objek;
  - `assignments.ts`: penugasan awal (atasan dibagi round-robin, ada contoh Ptr/Plh dan riwayat Plt BRM-3);
  - `supervisor-changes.ts`;
  - `activations.ts`: 1 usulan penambahan seed `penambahan-data-awal` (Berlaku, SK kolektif KEP/IV.2/1667/XI/2023,
    penandatangan Head Office) berisi semua karyawan seed dengan TMT = Tanggal Masuk;
  - `terminations.ts`: usulan penonaktifan (data awal kosong);
  - `transfers.ts`: 2 contoh usulan, `mutasi-contoh-1` (Rotasi, Menunggu Dokumen) dan `mutasi-contoh-2` (Promosi, Draf);
  - `helpers.ts` menyimpan state seed (`seedEmployees`, `seedHolders`) supaya tidak terduplikasi saat hot reload.
- **Store jadwal terpisah:** `src/lib/mock/schedule-store.ts` (`globalThis.mockScheduleStore`, **`SCHEDULE_STORE_VERSION = 14`**):
  shifts, holidays, workPatterns, workGroups, groupMembers, schedulePeriods, schedules, scheduleChanges.
  Data awal di `lib/mock/schedule/` (shifts, holidays, work-patterns, work-groups). Generator: `schedule-generator.ts`
  (`buildEntries`, `plannedTimes`, `computeVacancies`). Seed: 3 regu (HK Gunung Mas bergilir, Keamanan Kantor 24 jam tetap,
  Administrasi Kantor reguler; anchor September 2026), jadwal Oktober 2026 **Terbit** & November 2026 **Draf**.
  Mock: `shift-`, `holiday-`, `work-pattern-`, `work-group-`, `schedule-period-`, `schedule-regenerate-mock.ts`.
- **Mock per entitas:** `division-`, `sub-unit-`, `placement-category-`, `placement-object-`, `position-`, `employee-` (+ `employee-lists-mock.ts`), `assignment-`, `supervisor-`, `activation-mock.ts` (+ `activation-apply.ts`, `activation-resource.ts`, `status-document-mock.ts`), `termination-mock.ts` (+ `termination-apply.ts`, `termination-resource.ts`), `status-history-mock.ts`, `transfer-mock.ts` (+ `transfer-plan.ts`, `transfer-resource.ts`, `transfer-documents.ts`), `auth-mock.ts`, `current-user.ts`, `sample-pdf.ts`.

---

## 10. Komponen, Hook, dan Lib Bersama

**`components/shared/`**
- Halaman: `PageHeader`, `PageState` (`PageLoading`/`PageError`), `FormPageLayout` (form selebar kontainer, tombol Batal/Simpan), `ListSection`, `NumberCard`, `StatBarList`.
- Dialog:
  - `ConfirmDialog` (ikon, tone warning/info, `preventDefault` di tombol aksi);
  - `ConfirmDeleteDialog`;
  - `FormDialog` (`stopPropagation` saat submit, abaikan klik di luar, Escape diabaikan selama daftar pilihan terbuka).
- Isian:
  - `FormFields.tsx`: `TextField`, `TextAreaField`, `SelectField` (opsi `{value,label}`, `emptyLabel`), `DateField`, `SearchSelectField`, `SearchMultiSelectField`;
  - `SearchSelect` / `SearchMultiSelect` (Combobox Base UI; daftarnya diberi `pointer-events-auto` supaya bisa diklik di dalam Dialog; perubahan nilai beralasan `escape-key` diabaikan);
  - `DatePicker`, `FileUploadField`, `PhotoUploadField`, `PasswordInput`, `RequiredMark`, `FieldNote`.
- Lainnya: `RowActions` (opsional `viewHref` = menu Lihat Detail), `FreshOnEachVisit`, `CompanyName`, `WhatsAppIcon`.
- **`data-table/`** (port dari proyek referensi, mode client-only):
  - fungsi: cari per kolom, filter checklist (mendukung nilai berupa array), urut, paginasi;
  - **pilih baris** (`selection` prop + `selectColumn`);
  - preset kolom: `rowNumberColumn`, `actionsColumn`, `toFilterOptions`.

**`hooks/`**
- `useApiGet<T>(path)` → `{data, loading, error, reload}`;
- `useFormSubmit` → `submit`, `check`, `clearError`, `saving`, `errors`, `formError`;
- `useDeleteConfirm`.

**`lib/`**
- Aturan bisnis: `assignment-rules.ts`, `position-rules.ts`, `transfer-rules.ts`, `employee-rules.ts`, `file-rules.ts` (PHOTO 2MB, DOCUMENT/CERTIFICATE pdf/jpg/png 5MB).
- Util:
  - `validation.ts`: `requireText`, `requireSelection`, `requireAtLeastOne`, `mustBeDigits`, `mustBePhone`, `mustBeEmail`, `mustBeNikOrEmail`;
  - `date.ts`: `parseDate`, `toDateText`, `daysBetween`, `addDays`, `isoWeekday`, `mondayOf`, `formatDayName`, `getAge`, `monthsSince`, `getAgeInMonths`, `formatMonths` ("55 tahun 7 bulan" / "5 bulan"), `addMonths`, `MONTH_NAMES`, `formatDate`, `formatDateTime`;
  - `contact-links.ts` (WA 08xx → 628xx), `initials.ts`, `active-menu.ts`.
- Absensi: `attendance-rules.ts` (`ATTENDANCE_CODES`, `ATTENDANCE_IMPORTS` = konfigurasi 3 tab, `findImportByTab`, `SOURCE_LABELS`, `formatMinutes`, `minutesToHours`).
- Upah: `wage-rules.ts` (jenis upah, Rp/hari, format & parse rupiah, `checkWageScheme`), `overtime-rules.ts` (tarif per jam, jam dibayar, upah lembur).
- Periode: `period-rules.ts` (`DataPeriod`, `currentPeriod`, `periodReferenceDate`, `toPeriodParam`, `parsePeriodParam`, `isFuturePeriod`, `periodLabel`, `periodYearOptions`, `firstYearOf`, `lastMonthOf`) — dipakai browser & mock.
- Klien & sesi: `http-client.ts`, `api-client.ts`, `session-cookie.ts`.

---

## 11. Kendala Teknis yang Pernah Muncul & Solusinya

| Masalah | Solusi |
|---|---|
| Kartu/tombol React Flow tidak bisa diklik | `style.pointerEvents = "all"` pada node |
| Garis organisasi berkelok / hilang sesaat | Edge kustom siku; `useMemo`/`useCallback` untuk node |
| Halaman login glitch saat resize | `sizes="576px"` pada gambar, hapus backdrop-blur |
| `/api/organization` jadi statis saat build | `await connection()` di GET mock |
| Error tipe `RouteContext` di route baru | `npx next typegen` |
| Data mock lama tidak ikut berubah di dev server | Naikkan `STORE_VERSION` |
| Karyawan terduplikasi (420) saat hot reload | State seed dipindah ke `helpers.ts` |
| **Dev server kadang tidak membaca file baru/yang diubah** (404 di route baru, perubahan tidak tampil) | `touch <file>` lalu muat ulang; kalau tetap tidak terbaca, restart `npm run dev` |
| `.next/dev/types` rusak (typegen bentrok dengan dev server) | `touch` file halaman supaya tipe dibuat ulang |
| Form masih berisi data lama setelah disimpan (Activity) | `FreshOnEachVisit` |
| `AlertDialogAction` menutup dialog sebelum langkah berikutnya | `event.preventDefault()` di onClick |
| Form dalam Dialog ikut men-submit form luar | `event.stopPropagation()` |
| Combobox di dalam Dialog tidak bisa diklik / dialog tertutup saat mengetik | Daftar `pointer-events-auto`; `onInteractOutside` preventDefault |
| Halaman melebar ke samping karena tabel lebar | `min-w-0` pada `SidebarInset` dan `<fieldset>` |
| Nama jabatan kembar antarwilayah sulit dibedakan | Petunjuk opsi "JAB-xxx · BRM-n" |
| Badge sidebar tidak berubah setelah unggah/batal | Sinyal `notifyTransfersChanged()` |
| Avatar ukuran besar tidak berubah | `data-[size=lg]:size-20` |
| Route/halaman baru 404 atau 500 kosong saat dev | `touch` file route/halamannya, tunggu kompilasi selesai, lalu muat ulang |
| Sesi login habis (8 jam) saat uji di Chrome | Login lewat form dengan akun uji di `auth-mock.ts` (login lewat fetch saja tidak cukup) |
| Badge varian `brand`/`premium` tampil pekat (hitam) | Warna shift kini HEX bebas dengan teks hitam/putih otomatis (`readableTextColor`) |
| Kolom tabel perlu urutan khusus (mis. kategori pensiun) | TanStack Table v9 memakai `sortFn` (bukan `sortingFn`) |
| Escape pada combobox yang daftarnya sudah tertutup MENGHAPUS semua pilihan (bawaan Base UI) | `onValueChange` mengabaikan `details.reason === "escape-key"` (`SearchSelect.tsx`) |
| PDF dari `/api/.../documents` berstatus 204 saat di-fetch di Chrome pengujian | Intersepsi PDF di browser (server memberi 200, cek dengan `curl`); bukan bug kode |

**Catatan Prettier:** menjalankan `npx prettier --write` dari folder ini memakai lebar baris bawaan (80) dan akan memformat ulang seluruh file. Kode proyek ini ditulis dengan baris ±120 karakter, jadi **jangan jalankan prettier** sebelum konfigurasinya disepakati.

**Catatan `AGENTS.md`:** blok di file ini ditulis ulang otomatis oleh `next dev`. Biarkan saja.

---

## 12. Cara Menjalankan & Menguji

```bash
npm install
```

```bash
npm run dev
```

- Buka `http://localhost:3000`. Login memakai akun uji di `src/lib/mock/auth-mock.ts`.
- Pemeriksaan sebelum menyerahkan pekerjaan:

```bash
npx tsc --noEmit -p .
```

```bash
npx eslint src
```

```bash
npx next build
```

- **Pengujian di Chrome** (*Claude in Chrome*):
  - Saat tab tidak terlihat, animasi/toast tertunda dan klik bisa hilang. Klik yang dilakukan sebelum halaman selesai hydrate juga hilang.
  - Untuk upload file, pakai `DataTransfer` + event `change` lewat JavaScript.
  - Setelah menguji, kembalikan data mock dengan menaikkan `STORE_VERSION`.
- Skrip uji API lama (node + fetch + FormData) pernah ditaruh di scratchpad sesi sebelumnya (`transfer-test.mjs`, `supervisor-test.mjs`); skrip-skrip itu tidak ada di repo.

---

## 13. Pekerjaan yang Belum Dikerjakan / Ide Lanjutan

**Belum dibuat sama sekali**
- Dasbor: kartu statistik dan grafik SDM yang sebenarnya (saat ini placeholder).
- Menu Presensi, Kinerja, Pelatihan, Analitik SDM, Laporan, Pengaturan (sudah dihapus dari sidebar sampai halamannya dibuat).
- `README.md` masih bawaan create-next-app.

**Integrasi backend Laravel** (`AUTH_MOCK=false`)
- Setiap route handler sudah punya cabang `forward(...)`, tetapi endpoint backend belum ada atau belum diuji.
- Pembuatan dokumen SK/petikan (PDF/Word) nanti dilakukan backend; saat ini memakai file mock.
- Penyimpanan scan SK kolektif untuk semua karyawan dan penggantiannya oleh petikan juga nanti di backend.

**Penambahan / Penonaktifan Karyawan**
- Badge sidebar jumlah usulan Penambahan / Penonaktifan Draf belum dibuat.
- Tombol "Nonaktifkan" langsung dari detail karyawan belum ada (lewat menu Penonaktifan Karyawan).
- Mock tidak menonaktifkan/mengaktifkan akun login; itu tugas backend.
- `docs/erd/ERD-Backend-HR-Mestakara.docx` = v1.5; `-v1.2.docx` disimpan sebagai arsip.
- Di Chrome pengguna, fetch file PDF bisa mendapat 204 karena dicegat ekstensi pengunduh; server sendiri mengirim 200 (cek dengan curl).

**Hal kecil yang perlu dikonfirmasi pemilik proyek**
- Kartu statistik "Menjelang pensiun (≤ 2 tahun)" masih menghitung SEMUA status karyawan (termasuk PKWT/Casual/Daily) dan yang sudah lewat tanggal pensiun, sedangkan kolom Status Pensiun hanya untuk karyawan Tetap. Perlu disamakan?
- Struktur Organisasi hanya menampilkan penugasan **Aktif**. Mutasi dengan TMT di masa depan baru terlihat di bagan setelah tanggalnya tiba (keterbatasan yang sudah diketahui).
- Asumsi No. WhatsApp opsional (kalau kosong, memakai No. Telepon) belum pernah dikoreksi pemilik proyek.

**Pengujian Chrome yang sudah lengkap untuk Mutasi** (9 Oktober 2026)
- Ubah Draf, Hapus Draf, unggah petikan, unggah scan SK sampai Berlaku.
- Batalkan Berlaku (alasan wajib) dan batalkan Menunggu Dokumen.
- Jalur "Sudah punya SK", pop-up "Tempatkan karyawan sekarang?".
- Badge sidebar, dan dokumen template disembunyikan untuk jalur "Sudah punya SK".

---

## 14. Riwayat Pekerjaan (kronologis)

1. **Login** dari mockup Stitch, dengan revisi teks/elemen, layar penuh, NIK/Email, dan mock login.
2. **Layout dashboard** sidebar-07 dan menu HR; nama perusahaan responsif.
3. **Review 3 prinsip SANGAT MUDAH** pada logika dan pemecahan komponen.
4. **Struktur Organisasi** (React Flow) dari SK 1667/2023:
   - tombol WA/Telepon/Email, panel detail;
   - BRM menggantikan Strata, satu baris per BRM, garis siku;
   - efek hover dibuat lalu di-rollback;
   - garis koordinasi dihapus; aturan kartu gabung/pisah.
5. **Grup Organisasi & Jabatan:** master **Bidang** dan **Jabatan** (statistik, aturan Bidang per BRM).
6. Breadcrumb tanpa nama grup, form selebar kontainer, **DataTable** dengan cari/filter/urut.
7. Catatan form ukuran xs "Catatan: ..."; Wilayah jabatan diganti Keterangan.
8. **Grup Kepegawaian:** Data Karyawan (statistik, tabel, form biodata, foto, dokumen dasar, pop-up).
9. Tab **Dasar Penambahan / Riwayat Pendidikan / Data Batih**.
10. **Status Karyawan** (aturan NIK); statistik per status; kolom Jabatan dihapus dari tabel.
11. **No. Telepon dan No. WhatsApp dipisah.**
12. **Penugasan Jabatan:**
    - master Sub Unit dan Objek Penempatan;
    - Atasan Langsung dipindah dari jabatan ke penugasan;
    - 6 status jabatan; jabatan bisa dipegang banyak orang.
13. Menu Impor Data Karyawan dihapus; kolom No. Dokumen dan Dokumen (PDF).
14. Objek Penempatan terhubung ke banyak Sub Unit; master **Kategori Objek**; kolom tabel penugasan dipisah.
15. Diskusi proses bisnis: nama **Jabatan Karyawan** dan **Mutasi & Penempatan**, alur SK, pembatalan, dan pengalihan atasan.
16. **Tahap 1:** Penugasan Jabatan diubah menjadi Jabatan Karyawan (hanya lihat).
17. **Tahap 2:** Ubah Atasan (banyak karyawan sekaligus) dan Riwayat Atasan.
18. **Tahap 3:** data dan API mutasi (rencana atasan, aktivasi, pembatalan, dokumen mock).
19. **Tahap 4:** UI Mutasi & Penempatan (daftar, wizard 4 langkah, detail), badge, sambungan ke Jabatan Karyawan dan Data Karyawan.
20. **Pengujian lanjutan dan perbaikan kecil:**
    - badge langsung diperbarui; keterangan Dokumen SK sesuai jalur/status;
    - "Alasan: –" disembunyikan; tanda wajib pada scan SK; label tombol "Ya, Tempatkan";
    - dokumen template disembunyikan untuk jalur "Sudah punya SK";
    - pesan "sedang ada di usulan lain" diperjelas.
21. **Dokumen dasar mutasi & objek penempatan multiple** (9 Oktober 2026):
    - isian Dokumen Dasar di langkah 3 wizard + kartu & dialog di halaman detail; peringatan saat Simpan Usulan dan saat Unggah Scan SK;
    - tombol Lanjut ter-disable + daftar isian yang kurang;
    - `placement_object_id` → `placement_object_ids` di penugasan, item mutasi, tipe API, mock, tabel Jabatan Karyawan, dan panel Struktur Organisasi;
    - perbaikan Escape menghapus pilihan di `SearchSelect`/`SearchMultiSelect`.
22. **Data Karyawan — pensiun** (9 Oktober 2026): usia "tahun bulan", kolom Tanggal Pensiun & Status Pensiun (7 kategori, khusus karyawan Tetap), filter rentang periode pensiun.
23. **Data Karyawan — detail** (9 Oktober 2026): kolom Email, Telepon, WhatsApp dipisah; aksi Lihat Detail; halaman detail bertab + histori jabatan; file dokumen & ijazah bisa dibuka; `AssignmentPeriodBadge` dipakai bersama.
24. **Data Karyawan — masa kerja & tampilan detail** (9 Oktober 2026): isian Tanggal Masuk, kartu Masa Kerja, kartu detail bergaya NumberCard, font detail lebih besar & tiga kolom, kolom nama tabel lebih lebar.
25. **Shift & Jadwal** (10 Oktober 2026): diskusi konsep (ERD, rotasi, anchor/slot awal, pengganti, jendela jadwal, cron), lalu 5 tahap: Shift & Hari Libur, Pola Kerja, Regu Kerja + rotasi, Jadwal Kerja (periode Draf/Terbit/Terkunci, proyeksi, ubah sel + riwayat), Buat Ulang dari Tanggal + peringatan jadwal usang.
26. **Penyempurnaan Shift & Jadwal** (10 Oktober 2026): kode shift boleh kembar + pemilih warna (palet tema / HEX-RGB-HSL); pola kerja memakai Hari ke-n + toolbar nama hari (hanya tampilan); ringkasan "jumlah slot"; regu kerja jadi wizard 2 langkah (Data Regu, Anggota & Slot) dengan Tanggal Mulai Berlaku Jadwal hari apa pun, Kelola Anggota, status Akan Datang.
27. **Regu Kerja dipisah** (10 Oktober 2026): Edit Regu hanya data regu (kembali ke daftar regu) + tombol Edit Anggota Regu; halaman baru Kelola Anggota (`/regu/{id}/anggota`) menampilkan anggota saat ini di daftar slot; wizard 2 langkah hanya untuk Tambah Regu.
28. **Daftar Jadwal Kerja** (10 Oktober 2026): halaman Jadwal Kerja menjadi tabel regu (cari/filter/urut) + aksi Lihat Detail Jadwal; tampilan jadwal per bulan pindah ke `/dashboard/jadwal/{id regu}`.
29. **ERD backend** (11–12 Oktober 2026): `docs/erd/` berisi `ERD-Backend-HR-Mestakara.docx` + gambar ERD 0–4 (PNG & SVG), 32 tabel dalam 4 modul (riwayat atasan: `supervisor_changes` + tabel detail `supervisor_change_details`, bukan JSON). Garis koordinasi antarjabatan dihapus dari ERD dan front end (`coordination_ids`, baris Koordinasi di panel bagan; `STORE_VERSION` organisasi = 29).
30. **ERD v1.1 — Penambahan & Penonaktifan Karyawan** (13 Oktober 2026): 37 tabel / 5 modul, ERD 5 baru. Tabel `employee_activations` (Penerimaan Awal / Pengaktifan Kembali; dokumen dasar penambahan pindah dari `employees`), `employee_terminations` + `employee_termination_items` (SK massal/per orang, alur Draf → Menunggu Dokumen → Berlaku / Dibatalkan; jenis Pensiun, Pensiun Dini, Mengundurkan Diri, PHK, Kontrak Berakhir, Mutasi Keluar, Meninggal Dunia), `termination_ended_assignments`, `termination_ended_memberships`; `employees.active_status`/`inactive_since`, `users.is_active`/`deactivated_at`, `supervisor_changes.termination_id`. **Front end fitur ini BELUM dibuat** (menunggu konfirmasi).
31. **ERD v1.2 — keputusan Penambahan & Penonaktifan** (14 Oktober 2026), 40 tabel. Front end BELUM dibuat; urutan kerja berikutnya: front end Penambahan → Penonaktifan → revisi penandatangan Mutasi.
   - **Penambahan** (`employee_activations` + `employee_activation_items` + `activation_item_placement_objects/_supervisors`): wizard 4 langkah — (1) Data Karyawan [Tambah Karyawan Baru (draf cukup Nama + Status Karyawan, status Belum Aktif) / Pilih Karyawan Nonaktif; tabel + kolom Kelengkapan], (2) Dasar Penambahan & Dokumen [jenis Penerimaan Baru / Mutasi Masuk (unit asal wajib) / Pengaktifan Kembali; TMT; satu isian "Dokumen Dasar Penambahan" jenis SK/Memo/Nota Dinas/Disposisi/Surat Permohonan/Lainnya, Kolektif atau Per Orang, OPSIONAL], (3) Penempatan (opsional), (4) Tinjau & Simpan. Status Draf → Berlaku / Dibatalkan; hanya unggah (tanpa template).
   - **Penonaktifan** (`employee_terminations` + `_items` + `termination_ended_*`): wizard 4 langkah — Pilih Karyawan → Dasar Penonaktifan & Dokumen (WAJIB, kolektif/per orang, satu isian dokumen) → Pratinjau Dampak → Tinjau & Simpan. 7 jenis; bawahan otomatis dialihkan ke atasan; akun login dinonaktifkan/diaktifkan kembali otomatis.
   - **Penandatangan** (semua fitur, termasuk Mutasi): `signer_source` Unit / Kantor Regional / Head Office; Unit = pilih penugasan aktif, Regional/HO = nama & jabatan diketik; wajib bila jenis dokumen SK. Template & Menunggu Dokumen tetap hanya di Mutasi.
   - TMT masa depan: status berubah pada TMT (job harian); karyawan Belum Aktif/Nonaktif tersembunyi di Data Karyawan (filter Status, bawaan Aktif); masa kerja dikurangi masa nonaktif.
32. **Front end Penambahan Karyawan** (13–14 Oktober 2026): menu baru Penambahan Karyawan (daftar, wizard 4 langkah, detail,
    form karyawan halaman terpisah dengan Simpan sebagai Draf), dokumen dasar kolektif/per orang + penandatangan Unit/Regional/HO,
    unggah/ganti dokumen & pembatalan usulan Berlaku, tab Riwayat Status Kepegawaian, filter Status Kepegawaian (bawaan Aktif) di Data Karyawan,
    tab Dasar Penambahan karyawan dihapus, `PlacementFields` dipakai bersama Mutasi. `STORE_VERSION` organisasi = 31.
    Diuji di Chrome (draf → lengkapi → Berlaku → Belum Aktif sampai TMT → batalkan) + `tsc`, `eslint`, `next build` lolos.
33. **Front end Penonaktifan Karyawan** (13 Oktober 2026): menu Penonaktifan Karyawan (daftar, wizard 4 langkah, detail),
    status Nonaktif + `inactive_since` + masa kerja tanpa masa nonaktif, Pratinjau Dampak (jabatan, bawahan, regu), pembatalan,
    Pengaktifan Kembali di Penambahan, riwayat status gabungan (`status-history-mock.ts`), komponen dokumen bersama
    (`DocumentScopeSection`, `UploadDocumentDialog`). Perbaikan tumpang tindih kolom Kelengkapan di langkah 1 Penambahan.
    `STORE_VERSION` organisasi = 33, jadwal = 14. Diuji API + Chrome; `tsc`, `eslint`, `next build` lolos.
34. **Revisi penandatangan Mutasi + ERD v1.3** (13 Oktober 2026): penandatangan SK mutasi memakai `SignerFields`
    (Unit / Kantor Regional / Head Office; `signer_source`, `signer_name`, `signer_position`), dokumen dasar mutasi disamakan
    dengan Penambahan/Penonaktifan (jenis SK + `basis_signer_*`, `BasisDocumentFields` membungkus `StatusDocumentFields`),
    tampilan Tinjau & detail memakai `formatSigner`. ERD v1.3: kolom `transfers.basis_signer_*`, jenis SK di dokumen dasar,
    tata letak ERD 3 diperbaiki; docx utama ditimpa. `STORE_VERSION` = 35. Diuji API + Chrome; `tsc`, `eslint`, `next build` lolos.
35. **Kode Afdeling di Sub Unit + ERD v1.4** (13 Oktober 2026): `sub_units.afdeling_code` (opsional, unik, huruf besar) di tipe, mock,
    form, dan tabel Sub Unit; data awal AFD02 Kantor Induk & AFD03 Gunung Mas. ERD 1 + docx v1.4. `STORE_VERSION` = 37.
36. **Job Grade Jabatan + ERD v1.5** (13 Oktober 2026): `positions.job_grade` (opsional, 1–99) di tipe, mock, form, dan semua tabel
    yang memuat jabatan (kolom tersendiri; bisa diurutkan di DataTable, "-" di bawah). ERD 1 + docx v1.5. `STORE_VERSION` = 39.
37. **Filter Job Grade** (13 Oktober 2026): kolom Job Grade bisa difilter di semua DataTable (pilihan dari data + "- (belum diisi)");
    `meta.filter.options` boleh fungsi. `STORE_VERSION` = 40.
38. **Disambungkan ke backend Laravel** (15 Oktober 2026): `.env.local` diubah ke `AUTH_MOCK=false` (cadangan mode mock:
    `.env.local.bak-mock`), `BACKEND_URL=http://127.0.0.1:8000/api/v1`. Dicek otomatis: semua route handler `src/app/api/**`
    punya cabang `forward`/`forwardFile`/`callBackend`, dan setiap alamatnya ada di `../api/routes/api.php`; bentuk respons login
    (`data.token`, `data.user`) cocok. Kembali ke mock: `AUTH_MOCK=true`.
    Diuji di Chrome (15 Oktober 2026): login akun seeder berhasil; 17 endpoint daftar = 200 (database masih kosong, seeder Laravel
    hanya membuat akun login); CRUD Bidang + validasi 422 berhasil (data uji dihapus lagi). Perbaikan: `OrgToolbar` memakai
    `formatDate` bersama dan menampilkan "SK struktur organisasi belum diisi." saat SK kosong (sebelumnya "Invalid Date").
39. **Uji E2E seluruh alur dengan backend Laravel** (15 Oktober 2026), lewat BFF dari Chrome (akun seeder):
    master (Bidang, Sub Unit + kode afdeling, Kategori, Objek, Jabatan + Job Grade), Penambahan (draf, karyawan via
    `activation_id`, submit kolektif HO / per orang Unit + Memo, Mutasi Masuk, unggah dokumen menyusul, lengkapi draf via PUT
    multipart), Ubah Atasan + riwayat, Mutasi (pratinjau, template → unduh SK → unggah scan → Berlaku, unggah langsung,
    batal Berlaku, draf + hapus), Penonaktifan (pratinjau dampak, Berlaku → Nonaktif + bawahan dialihkan, batal → kembali,
    Pengaktifan Kembali), Shift/Hari Libur/Pola/Regu/proyeksi, Jadwal (Draf → ubah sel → Terbit → ubah sel beralasan →
    buat ulang → Kunci), akhiri anggota, serta semua validasi 422/409 yang diuji — SEMUA sesuai.
    **Bug backend (belum diperbaiki, `../api` tidak disentuh):** `POST /employee-terminations/{id}/cancel` DITERIMA (200)
    walaupun karyawannya sudah diaktifkan kembali lewat Penambahan; mock front end menolaknya (409).
    Catatan: PDF di Chrome pengguna bisa 204 karena ekstensi pengunduh; Laravel langsung mengirim 200 application/pdf.
    Data uji (Rina, Euis, Budi, Asep, Dewi, dst.) masih ada di database lokal Laravel.
40. **Perbaikan Akhiri Keanggotaan Regu** (15 Oktober 2026): tombol di `MembersTable` kini tampil selama keanggotaan belum
    Selesai (sebelumnya hanya kalau `end_date` kosong, sehingga anggota dengan tanggal akhir di masa depan tidak bisa diubah).
    `EndMemberDialog` menjadi "Ubah Tanggal Terakhir" (terisi tanggal lama) untuk anggota yang sudah punya tanggal akhir.
41. **Perbaikan "Mengalihkan ke halaman login" yang macet** (15 Oktober 2026): kalau token di cookie ditolak backend
    (kedaluwarsa 8 jam / dicabut / database di-reset), `/api/auth/me` sekarang MEMBUANG cookie sesi saat 401. Sebelumnya
    RequireAuth mengarahkan ke /login, lalu proxy.ts (cookie masih ada) mengembalikan ke /dashboard tanpa henti.
42. **Tombol Ekspor Excel Data Karyawan — front end** (23 Oktober 2026): tombol "Ekspor Excel" di halaman Data Karyawan,
    route `GET /api/employees/export` (`forwardFile`, mock 501), `apiDownload` di `http-client.ts` (nama file dari
    Content-Disposition, cadangan dibuat di browser). Format & isi Excel diputuskan dikerjakan di backend Laravel
    (prompt spesifikasi lengkap diberikan ke sesi backend; endpoint `GET /employees/export` harus didaftarkan SEBELUM
    `apiResource('employees')`). Keputusan: ikut filter Status Kepegawaian; NIK REG = No. Registrasi, NIK SAP = NIK;
    REGIONAL "II", KOMODITI "AGROWISATA", KSO "NON KSO"; urut BRM tertinggi lalu nama; teks HURUF BESAR, email huruf kecil.
    `tsc`, `eslint`, `next build` lolos. Tombol dipindah ke dalam kartu, tepat di atas tabel (rata kanan).
    **Diuji di Chrome dengan backend Laravel** (23 Oktober 2026): unduhan ±5–8 detik (596 karyawan, 204 KB), nama file benar,
    toast muncul; filter Aktif / Semua / Belum Aktif / Nonaktif = 200 (Belum Aktif & Nonaktif hanya header karena semua
    karyawan Aktif), nilai salah = 422. Format dibandingkan otomatis dengan file acuan (Python/openpyxl): nama sheet, teks
    header, 70 sel gabung, lebar & kolom tersembunyi H–P, tinggi baris 30/54/30, warna 215F9A/00B050, Tahoma 11, freeze,
    zoom 55, autofilter, format tanggal — SAMA; satu-satunya beda: A1:A2 diberi border kanan (tidak terlihat, karena B1
    sudah ber-border kiri). Teks data huruf besar, NIK/KTP teks (0 di depan aman). Jabatan, pendidikan, batih, email kosong
    karena database belum berisi data itu (0 penugasan). Tanggal Pensiun kosong untuk karyawan Tetap yang belum ditempatkan
    — sama dengan aturan front end (`employee-retirement.ts`).
43. **Filter Periode Data di Data Karyawan — front end** (23 Oktober 2026): filter Bulan + Tahun (`PeriodFilter`,
    `lib/period-rules.ts`), tanggal acuan akhir bulan / hari ini, `GET /api/employees?period=` (mock: `toEmployeeProfileResource`
    + `findMainPosition` + `getServiceMonths` + `getActiveAssignments` menerima tanggal; 422 untuk format salah / bulan yang
    belum tiba), usia & pensiun di kartu statistik dan tabel per tanggal acuan, `useApiGet.refreshing`, tombol Ekspor Excel
    pindah sejajar filter periode dan mengirim `period` (nama file cadangan = bulan periode). Prompt untuk backend sudah
    diberikan (kontrak `GET /employees?period=` dan `GET /employees/export?period=&active_status=`).
    `tsc` & `eslint` lolos; `next build` berhasil compile + generate 80 halaman, lalu berhenti karena peringatan keamanan
    versi Next.js 16.4.0 (menunggu keputusan pemilik proyek). Aturan periode diuji dengan skrip (18 kasus, termasuk Februari
    kabisat).
    **Diuji di Chrome dengan backend Laravel** (23 Oktober 2026): tata letak (Periode Data kiri, Ekspor Excel kanan sebaris),
    November–Desember 2026 ter-disable, tahun 1990–2026, "Memuat data periode..." lalu "Data per 31 Desember 2025.", Bulan Ini
    kembali ke Oktober 2026. Data backend per periode cocok dengan Tanggal Masuk (Jun 2015 = 156 Aktif, Jan 2024 = 299,
    Des 2025 = 458, Jun 2026 = 474, Sep/Okt 2026 = 596; status & masa kerja 0 selisih), kartu statistik & tabel 458,
    rata-rata usia & usia baris per 31 Des 2025 benar; period salah / masa depan = 422. Ekspor Des 2025: nama file
    "… - Desember 2025.xlsx", 458 baris, tidak ada Tanggal Masuk > acuan, usia (O) per acuan benar.
    Format ekspor kini punya baris 3 KOSONG abu-abu D9D9D9 tinggi 20 di bawah header, autofilter A3:DD…, freeze di bawah
    baris 3, data mulai baris 4 — **DISENGAJA** (dikonfirmasi pemilik proyek 23 Oktober 2026), jangan dianggap selisih
    dari file acuan. Tampilan HP dicek 25 Oktober 2026 di browser bawaan (375 px): filter turun ke baris berikutnya,
    Ekspor Excel selebar layar di bawahnya, tanpa geser ke samping.
44. **Pengelompokan menu sidebar** (25 Oktober 2026): tiga dropdown baru di `navigation.ts` — Kepegawaian: Data Karyawan,
    Jabatan Karyawan, **Usulan Kepegawaian ▾** (Penambahan, Penonaktifan, Mutasi); Shift & Jadwal: Jadwal Kerja, Regu Kerja,
    **Pengaturan Jadwal ▾** (Pola Kerja, Shift, Hari Libur); Organisasi & Jabatan: Struktur Organisasi, **Master Organisasi ▾**
    (Bidang, Sub Unit, Kategori Objek, Objek Penempatan, Jabatan). Menu langsung 16 -> 8; alamat halaman tidak berubah.
    `NavGroupMenu`: badge di sub-menu + jumlahnya di menu induk saat tertutup; dropdown otomatis terbuka saat halaman di
    dalamnya dibuka. Diuji di browser bawaan (Chrome extension sedang tidak tersambung): struktur menu, buka otomatis saat
    datang dari link "Tambah Karyawan", breadcrumb "Dasbor › Master Organisasi › Bidang" / "… › Pengaturan Jadwal › Shift".
    Badge belum terlihat langsung karena saat diuji tidak ada usulan mutasi Menunggu Dokumen. `tsc` & `eslint` lolos.
45. **Menu yang belum dibuat dihapus dari sidebar** (25 Oktober 2026): Presensi, Kinerja, Pelatihan, dan grup Lainnya
    (Analitik SDM, Laporan, Pengaturan) dihapus dari `navigation.ts` beserta ikonnya; grup Menu Utama kini hanya Dasbor.
    Contoh di komentar `lib/active-menu.ts` disesuaikan dengan menu yang ada. Teks halaman login (LoginHeroPanel) yang
    menyebut "presensi, dan kinerja" dibiarkan. Dicek di browser bawaan; `tsc` & `eslint` lolos.
46. **Presensi & Upah — rancangan + Tahap 1 front end** (25 Oktober 2026): diskusi & analisis file Excel lama (Daftar Upah, Lembur
    Reguler, Lembur DW: rumus Rp/hari, jam pengali, cara Lembur DW dihitung, cost center, rekening). Keputusan dicatat di bagian 6.13.
    Front end Tahap 1: menu **Presensi & Upah › Pengaturan Upah ▾** (Skema Upah Karyawan, Kelompok Daftar Upah, Cost Center,
    Pengaturan Lembur), tab **Rekening & Cost Center** di detail karyawan, 13 route handler BFF (mock = 501), tipe `types/api/wage.ts`,
    `cost-center.ts`, `payroll-group.ts`, `overtime-setting.ts`, aturan `lib/wage-rules.ts` & `lib/overtime-rules.ts`, `EXCEL_RULE`.
    Prompt backend Tahap 1 (data dasar upah + fondasi tabel absensi tidak bergantung sumber) sudah diberikan.
    `tsc`, `eslint`, `next build` lolos. Dicek di browser bawaan: menu, breadcrumb, form & validasi Kelompok, tab Rekening & Cost Center
    tampil; **belum bisa diuji dengan data** karena endpoint backend Tahap 1 belum ada (404 "Alamat API tidak ditemukan").
    Nama isian kontrak (mis. `spkl_signers`, `payroll_signers`, `operational_position_allowance`) perlu dicocokkan dengan backend saat
    endpointnya selesai.
47. **Tahap 1 — dicocokkan dengan backend & diuji di Chrome** (25 Oktober 2026). Kontrak disesuaikan ke backend:
    pencatat `created_by` / `updated_by` (bukan `*_name`); penandatangan `role_label` (nama boleh null → dijadikan teks kosong);
    baris `/api/wage-schemes` DATAR (`id`, `name`, `registration_number`, `employment_status`, `position`, `sub_unit`,
    `placement_objects` [{id,name}], `wage_scheme`, `daily_rate`, `bank_account`, `cost_center`); skema berisi `payroll_group` (objek) +
    `daily_rate`, `cap_days` null kalau tidak dibatasi (front end mengirim null); pratinjau impor `row`, `errors` [{column,message}],
    `changes` {wage_scheme, bank_account, cost_center}, `summary.total_rows`. Tambahan: kolom **Jabatan** di tabel Skema Upah.
    Bug yang ditemukan & diperbaiki: nama penandatangan null dari server membuat isian tak terkendali dan `.trim()` error saat simpan.
    Diuji di Chrome: Cost Center (tambah + kode otomatis huruf besar, kode kembar ditolak di isiannya, edit, hapus), Kelompok (9 data
    awal, tambah dengan urutan, hapus), Pengaturan Lembur (contoh 3 jam → 5,5 jam → Rp 75.500; validasi; simpan uraian & 6 penandatangan
    dari file Excel; "Terakhir diubah … oleh Admin SDM"), Skema Upah (364 Casual & DW Oktober 2026; Atur Skema + validasi + Rp/hari
    langsung Rp 95.000; Ubah Sekaligus 2 karyawan + validasi + konfirmasi; Riwayat; isian awal Ubah Skema; Unduh Template 597 baris;
    Unggah Excel: file salah → 1 berubah/1 salah & Simpan terkunci, file benar → simpan 1 perubahan, hanya cost center yang bertambah),
    tab Rekening & Cost Center + Biodata, validasi dialog Rekening (No. Rekening angka saja) & isian awal dialog Cost Center.
    **Data uji yang tertinggal di database lokal** (riwayat tidak bisa dihapus): skema upah A. ROHMAN, A. SUKMANA, ACEP MAULANA
    (Harian, Rp 2.375.000, HKE 25, maks. 20 hari, Gunung Mas — sama dengan file Excel), cost center A. ROHMAN 4A44AGR007, isian
    Pengaturan Lembur. Cost center UJI001 & kelompok "Uji Kelompok" sudah dihapus. Simpan rekening bank tidak diuji (supaya tidak ada
    rekening palsu di riwayat). `tsc` & `eslint` lolos.
48. **Tahap 2 — Unggah Absensi, front end** (26 Oktober 2026): halaman `/dashboard/upah/absensi` dengan Tab Bar (Daftar Hadir, Lembur
    Reguler, Lembur DW), kotak unggah + riwayat + unduh template + dialog unggah berpratinjau, rekap daftar hadir + panel detail
    kalender + koreksi manual, daftar lembur per jenis, menu **Unggah Absensi**, 7 route handler BFF (mock = 501), dialog unggah umum
    `ExcelImportDialog` (ImportSkemaDialog ikut memakainya). Prompt backend Tahap 2 (termasuk `GET /overtime-entries`) sudah diberikan.
    `tsc`, `eslint`, `next build` lolos. Dicek di browser bawaan: menu, tab & `?tab=`, kotak unggah, dialog unggah (Periksa File mati
    sebelum file dipilih), pesan error rapi; **belum diuji dengan data** karena endpoint backend Tahap 2 belum ada (404).
49. **Tahap 2 — dicocokkan dengan backend & diuji di Chrome** (26 Oktober 2026). Kontrak disesuaikan: jejak perubahan
    `{id, date, action, source, reason, changed_by, created_at, items: [{field, old_value, new_value}]}` (front end menampilkan
    "K → S" dari item `status_code`, `describeChange`); batch unggahan + `deleted_count` & `status` ("aktif"/"diganti" → badge riwayat).
    Bagian lain (status, pratinjau, rekap, daftar lembur, detail) sudah sama.
    Diuji di Chrome: template Daftar Hadir (judul, tanggal + hari, Minggu diarsir, dropdown kode, COUNTIF, data tersimpan ikut terisi);
    unggah salah → 1 salah ("Kode X tidak dikenal") + 1 peringatan (K 22 > batas 20), Simpan terkunci; unggah benar → tersimpan, badge ✓,
    "Terakhir diunggah …", rekap; panel kalender (1 Okt = Kamis); koreksi manual 6 Okt K → S (validasi kode sama & alasan wajib; ✎;
    jejak; rekap K 21 S 1); unggah ulang → 1 konflik "Manual S → file K (tidak ditimpa)"; Lembur Reguler: tumpang tindih & hari berkode
    S = salah, lewat tengah malam (+1) benar, tersimpan (2 baris · 5 jam); Lembur DW: tumpang tindih dengan lembur reguler tersimpan =
    salah, 5 jam = peringatan tapi boleh disimpan (2 baris · 6,5 jam); rekap menampilkan jam lembur; riwayat unggahan; tab & `?tab=`.
    **Data uji yang tertinggal** (Oktober 2026): daftar hadir A. ROHMAN (K 1–26 Okt kecuali Minggu = L) & A. SUKMANA (1–10 Okt),
    **koreksi manual A. ROHMAN 6 Okt = S** (prioritas manual: TIDAK akan tertimpa unggahan Excel berikutnya — koreksi lagi kalau perlu),
    lembur reguler A. ROHMAN 5 Okt 17–19 & 7 Okt 22–01, lembur DW 8 Okt 17–18.30 & 9 Okt 17–22, beserta jejak perubahannya.
    Data Excel lain akan tergantikan saat unggah ulang. `tsc` & `eslint` lolos.
50. **Tahap 2 — kolom identitas upah di tabel** (26 Oktober 2026): rekap Daftar Hadir & daftar Lembur Reguler/DW ditambah kolom
    Jabatan (setelah Nama), Kelompok Upah, Cost Center, Uraian Cost Center (setelah Objek), urutan sama dengan template unggahan backend.
    Nilai per akhir periode (tanggal acuan). Kontrak: `AttendanceEmployeeWageInfo {position, payroll_group {id,name}, cost_center
    {id,code,name}}` di `AttendanceSummaryRow` & `OvertimeEntryRow`. Backend sudah mengirimnya; diuji di Chrome (Oktober 2026): kontrak
    cocok persis, rekap 364 karyawan (345 berjabatan, 341 berkelompok upah & cost center, sisanya "-"), filter Kelompok Upah benar,
    daftar Lembur Reguler (2 baris) & Lembur DW (2 baris) menampilkan keempat kolom.
51. **Tahap 3 — Lembur DW otomatis, front end** (26 Oktober 2026): keputusan — Hitung Rekomendasi mengganti baris Excel + rekomendasi
    lama karyawan yang dihitung, Unggah Excel DW mengganti semua baris Excel + rekomendasi periode, manual & mobile selalu tetap; ubah /
    hapus / tambah per baris (alasan wajib, jadi Manual) di kedua tab lembur; status "Sesuai" = selisih ≤ upah 30 menit; badge tab dari
    `entry_count`. Baru: `types/api/dw-overtime.ts`, `lib/dw-overtime-rules.ts`, `DwTargetSection`, `DwTargetTable`,
    `DwRecommendationDialog`, `OvertimeEntryDialog`, `OvertimeDeleteDialog`; `OvertimeEntryTable` + kolom Aksi; `LemburTab` + `locked` &
    `onChanged`; 5 route handler (lihat bagian 8). Prompt backend Tahap 3 sudah diberikan. `tsc` & `eslint` lolos.
52. **Tahap 3 — diuji di Chrome dengan backend** (26 Oktober 2026). Kontrak `/overtime-dw/targets`, pratinjau, simpan, `entry_count`,
    POST/PUT/DELETE `/overtime-entries` cocok. Diuji: ringkasan Target vs Upah (rumus 13.728/jam, 1,5 jam → 34.300, 5 jam → 130.400);
    Tambah Lembur (validasi 5 isian, simpan Manual, ringkasan ikut berubah); Hitung Rekomendasi semua karyawan (5× acak via API: semua
    tanggal K/DW, tidak bentrok reguler/manual, mulai 17.00, kelipatan 30 menit, ≤ 4 jam/hari, ≤ 18 jam/minggu, jumlah upah cocok;
    baris manual dipertahankan & dihitung; simpan persis pratinjau, Excel lama dihapus); Ubah baris rekomendasi → Manual + peringatan
    > 4 jam; Hapus (alasan wajib, `?reason=`); Unggah Excel DW 1 baris → 17 rekomendasi dihapus, manual tetap; Hitung Rekomendasi
    1 karyawan dicentang → baris Excel-nya diganti, batch Excel jadi "diganti", centang dikosongkan; badge tab dari `entry_count`.
    Perbaikan saat uji: jam berdetik dari Chrome ("18:00:00") dipotong ke "HH:MM" saat dikirim di `OvertimeEntryDialog` (memotong di
    `onChange` TextField merusak cara mengetik, jadi tidak dipakai); keterangan dialog unggah Lembur DW menyebut "dan hasil rekomendasi";
    kotak unggah menampilkan "Unggahan terakhir (…) sudah tergantikan seluruhnya" bila batch aktif tidak ada tapi riwayat ada.
    Catatan dev server: folder route bersarang baru (`/preview`) sempat 404 sampai filenya disentuh (watcher Turbopack di Windows).
    **Data uji yang tertinggal** (Oktober 2026): daftar hadir A. ROHMAN 22–24 Okt = DW (K lainnya tetap, 6 Okt S manual), A. SUKMANA
    12–13 K & 14–15 DW, ACEP MAULANA 1 K / 2 DW / 3 K, ADE HERMANSYAH 1 DW; lembur DW: 9 baris rekomendasi A. ROHMAN, manual
    A. SUKMANA 14 Okt 17–18, manual ACEP 1 Okt 17–22; lembur reguler A. ROHMAN 5 & 7 Okt; beserta jejaknya.
53. **Tahap 4 — Daftar Upah, Penanda Tangan, ekspor & SPKL, front end** (26 Oktober 2026). Format file lama dipelajari (sheet
    kelompok DU, REKAP DPU, PayRoll, blok DAFTAR LEMBUR). Keputusan lihat bagian 6.13 Tahap 4 (pengelompokan hanya Kelompok Daftar
    Upah / Bidang, penanda tangan fleksibel di menu tersendiri, Excel + PDF, salin potongan, kunci = potret). Penandatangan lama
    (`spkl_signers`, `payroll_signers`, `SignerSettingTable`) dihapus dari Pengaturan Lembur. Baru: menu Daftar Upah & Penanda Tangan ▾,
    6 halaman, 12 route handler (bagian 8). Prompt backend Tahap 4 sudah diberikan. `tsc` & `eslint` lolos; **belum diuji (menunggu
    backend)**.
54. **Tahap 4 — diuji di Chrome dengan backend** (26 Oktober 2026), memakai data September (DU INPUT ABSEN, blok SPKL CASUAL &
    SPL CASUAL dw) sebagai Oktober; 31 Okt dibuat dari 24 Okt (K jadi DW kalau K sudah mencapai batas). Kontrak semua endpoint cocok.
    Hasil: 341 karyawan berskema dicek ulang di browser (lembur per tanggal, batas hari, jumlah, diterima) = cocok semua; Gaji Upah
    254 sama dengan DU September + 64 bertambah karena 31 Okt + 4 beda karena data; total Rp 805,9 jt (Sept 797,7 jt). Penanda
    tangan Umum / per kelompok (Malabar) / per bidang (F&B) — editor, validasi, geser, karyawan → jabatan otomatis; tercetak benar
    di Excel & PDF. Daftar Upah: kesiapan, kartu, rekap + filter, Bidang, rincian, potongan satu & sekaligus, salin (kosong), kunci &
    buka kunci (September). Ekspor Excel DU (sheet kelompok = REKAP = PAYROLL = Rp 805.838.050) & SPKL Excel/PDF benar.
    Perbaikan front end saat uji: `useFormSubmit` menampilkan pesan 422 untuk isian yang tidak ada di form (mis. `employee_ids.0`)
    sebagai pesan umum; `apiDownload` menolak file kosong; Rincian Upah tidak lagi menulis "Rp -0"; salin potongan disesuaikan
    dengan backend (`employees` = daftar karyawan, bukan angka) + daftar namanya.
    **Masalah backend**: PDF besar (DU semua kelompok, SPKL semua) kehabisan memori dompdf (128 MB); tabel DU PDF terpotong di kanan
    (kolom Jumlah Potongan & Upah di Terima). Prompt perbaikan sudah diberikan. Catatan: di komputer owner, PDF diambil alih
    pengelola unduhan (kemungkinan IDM) sehingga fetch menerima 204 walau file tersimpan.
    **Keterbatasan data**: 23 karyawan tanpa No. Registrasi tidak bisa diisi lewat template lembur (kunci baris = No. Reg) dan juga
    belum punya skema upah.
    **Data uji Oktober 2026 masih ada** (menunggu konfirmasi owner untuk dihapus): daftar hadir, lembur reguler (236), lembur DW
    (1.698), potongan uji (A. ROHMAN BPJS 50.000; PPh 10.000 untuk A. ROHMAN, A. SUKMANA, ACEP MAULANA), perubahan penanda tangan
    Umum (bagian "Dibuat Oleh"), Malabar, Food and Beverage, dan riwayat kunci/buka September 2026.
55. **Perbaikan error Next** (31 Oktober 2026): (1) dev: `Route "/": Could not validate instant` karena halaman "/" hanya
    `redirect("/dashboard")` -> `export const instant = false` di `src/app/page.tsx`. (2) `next build`: "[backend] GET ... gagal:
    needs to bail out of prerendering ... nextUrl.search" — sinyal internal prerender tertangkap `try/catch` di `forward` /
    `forwardFile` (`lib/api-client.ts`) -> `unstable_rethrow(error)` di awal `catch`. Build bersih, semua `/api/*` dinamis (ƒ).
    Aturan: setiap `try/catch` di route handler / Server Component yang membungkus API Next (request, cookies, headers, redirect,
    notFound) WAJIB memanggil `unstable_rethrow(error)` dulu.
56. **Dashboard & Analitik SDM — Tahap A, front end** (31 Oktober 2026). Keputusan: tidak ada filter global; SETIAP kartu & grafik
    berdiri sendiri dengan periode rentang bulan (bawaan awal tahun s.d. hari ini, maks 24 bulan, `lib/period-range.ts`); grafik &
    matriks juga punya filter Sub Unit / Bidang / Segmen / Objek Penempatan / Cost Center / Kelompok Daftar Upah / Status
    (`lib/dashboard-filters.ts`); kartu ringkasan & KPI tanpa filter dimensi. Bagian: 1 Ringkasan Eksekutif, 2 Komposisi Tenaga
    Kerja, 3 Biaya Upah & Lembur (tanpa Target vs Upah Lembur DW), 4–7 (Kehadiran & Lembur, Pergerakan, Regenerasi & Pensiun,
    Organisasi) = Tahap B. Pilihan periode/filter tidak disimpan (kembali bawaan saat dibuka).
    Bentuk data widget seragam (`types/api/dashboard.ts`: kpi, series, distribution, matrix, table, list) -> komponen
    `components/shared/dashboard/` (WidgetCard, PeriodRangePicker, WidgetFilterDialog, FilterOptionsContext, KpiTile,
    SeriesChart [batang/garis/bertumpuk, mendatar otomatis, onSelect], DistributionChart [donat/batang], HeatMatrixTable
    [Jumlah/Persen], MiniTable, ActionList, DashboardSection); warna dari token `--chart-*` (`lib/chart-colors.ts`);
    `hooks/useDashboardWidget` (pakai data GET /api/dashboard selama bawaan, selain itu ambil ulang kartu itu saja).
    Halaman Analitik SDM (`/dashboard/analitik`, menu Menu Utama): Topik (Karyawan, Upah Casual & DW), Metrik, Periode, Lihat per,
    Pisah per (matriks), Filter (chip + telusuri dengan klik), Jumlah/Persen, Batang/Garis/Donat, Urutkan, Top N, Ekspor Excel
    (`features/analitik/`, `lib/analytics-rules.ts`, `types/api/analytics.ts`). Route BFF: `/api/dashboard`,
    `/api/dashboard/widgets/[key]`, `/api/dashboard/filter-options`, `/api/analytics`, `/api/analytics/export`.
    `tsc` & `eslint` lolos.
57. **Dashboard & Analitik SDM Tahap A — diuji dengan backend** (31 Oktober 2026). Kontrak disesuaikan ke backend: GET /dashboard
    `widgets` = DAFTAR (dipetakan per `key` di DashboardPage) + `from`, `to`, `period_label`; filter-options `employment_statuses`
    = [{id, name}]; GET /analytics = { topic, metric, group_by, split_by, unit, from, to, filters, type: "rows"|"matrix", summary,
    rows? , data? (matriks) } -> dirapikan `toAnalyticsView` (lib/analytics-rules.ts); `summary.count` = jumlah KELOMPOK (kartu
    "Jumlah Kelompok" & "Rata-rata per Kelompok"). 23 widget lengkap & bentuknya cocok; angka upah = Daftar Upah.
    Diuji: periode per kartu (hanya kartu itu diambil ulang, "Periode khusus", ↺), grafik bertumpuk + filter Sub Unit + Lihat per
    Segmen, Analitik (ringkasan, telusuri klik baris -> filter + Lihat per berikutnya, topik Upah + Pisah per = matriks, ekspor Excel).
    Perbaikan tampilan: kepala kartu (judul & tombol satu baris, keterangan selebar kartu), SeriesChart otomatis mendatar bila nama
    kategori panjang, ujung sumbu dibulatkan "cantik", tanpa desimal di sumbu, "Periode khusus" hanya bila periode diubah, kalimat
    "▲ x% dibanding periode sebelumnya". **Masalah backend**: `to` = hari ini ditolak ("Tanggal tidak boleh melewati hari ini") karena
    `Carbon::parse` memakai UTC sedangkan `DataPeriod::today()` WIB -> semua kartu dengan periode bawaan gagal; analitik Upah dengan
    Pisah per + filter butuh ±16 detik. Prompt perbaikan sudah diberikan; uji ulang periode bawaan, matriks, donat, tabel, dan
    Perlu Tindakan menunggu perbaikan itu.
