import {
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Database,
  LayoutDashboard,
  Network,
  ReceiptText,
  Signature,
  SlidersHorizontal,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/** Satu link di dalam menu yang bisa dibuka-tutup, mis. "Bidang" di dalam "Master Organisasi". */
export interface NavSubItem {
  title: string;
  url: string;
}

/**
 * Satu menu di sidebar.
 * - Tanpa `items`  -> langsung berupa link (mis. "Dasbor").
 * - Dengan `items` -> bisa dibuka-tutup dan berisi beberapa link.
 */
export interface NavItem {
  title: string;
  icon: LucideIcon;
  url?: string;
  items?: NavSubItem[];
}

/** Sekelompok menu dengan judul kecil di atasnya, mis. "Menu Utama". */
export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * DAFTAR MENU SIDEBAR.
 *
 * Untuk menambah / mengubah menu, cukup ubah data di bawah ini —
 * sidebar (src/components/layout/AppSidebar.tsx) dan breadcrumb di header
 * akan menyesuaikan sendiri.
 *
 * Pola pengelompokan: menu yang dipakai RUTIN tampil langsung; menu yang JARANG diubah
 * (data master, pengaturan) atau yang alurnya sama (usulan dengan SK) dikumpulkan dalam dropdown.
 * Memindah menu ke / dari dropdown TIDAK mengubah alamat halamannya.
 *
 * Hanya menu yang halamannya SUDAH ADA yang dicantumkan. Fitur baru (mis. Presensi) ditambahkan
 * di sini setelah halamannya dibuat.
 */
export const navigationConfig: NavGroup[] = [
  {
    label: "Menu Utama",
    items: [
      {
        title: "Dasbor",
        icon: LayoutDashboard,
        url: "/dashboard",
      },
      // Grafik yang diatur sendiri lewat tombol-tombol (topik, metrik, periode, lihat per, filter).
      { title: "Analitik SDM", icon: ChartNoAxesCombined, url: "/dashboard/analitik" },
    ],
  },
  {
    label: "Kepegawaian",
    items: [
      { title: "Data Karyawan", icon: Users, url: "/dashboard/karyawan" },
      { title: "Jabatan Karyawan", icon: BriefcaseBusiness, url: "/dashboard/jabatan-karyawan" },
      {
        // Ketiganya sama-sama usulan ber-SK dengan alur Draf -> Berlaku -> Dibatalkan.
        title: "Usulan Kepegawaian",
        icon: ClipboardList,
        items: [
          { title: "Penambahan Karyawan", url: "/dashboard/penambahan" },
          { title: "Penonaktifan Karyawan", url: "/dashboard/penonaktifan" },
          { title: "Mutasi & Penempatan", url: "/dashboard/mutasi" },
        ],
      },
    ],
  },
  {
    label: "Shift & Jadwal",
    items: [
      { title: "Jadwal Kerja", icon: CalendarDays, url: "/dashboard/jadwal" },
      { title: "Regu Kerja", icon: UsersRound, url: "/dashboard/jadwal/regu" },
      {
        // Pengaturan dasar jadwal: jarang diubah (Hari Libur cukup setahun sekali).
        title: "Pengaturan Jadwal",
        icon: SlidersHorizontal,
        items: [
          { title: "Pola Kerja", url: "/dashboard/jadwal/pola" },
          { title: "Shift", url: "/dashboard/jadwal/shift" },
          { title: "Hari Libur", url: "/dashboard/jadwal/hari-libur" },
        ],
      },
    ],
  },
  {
    label: "Presensi & Upah",
    items: [
      // Daftar Hadir, Lembur Reguler, dan Lembur DW (tiga tab dalam satu halaman).
      { title: "Unggah Absensi", icon: CalendarCheck2, url: "/dashboard/upah/absensi" },
      // Perhitungan upah per periode, kunci periode, ekspor Daftar Upah & SPKL.
      { title: "Daftar Upah", icon: ReceiptText, url: "/dashboard/upah/daftar-upah" },
      {
        // Data dasar upah karyawan Casual & Daily Worker.
        title: "Pengaturan Upah",
        icon: Wallet,
        items: [
          { title: "Skema Upah Karyawan", url: "/dashboard/upah/skema" },
          { title: "Kelompok Daftar Upah", url: "/dashboard/upah/kelompok" },
          { title: "Cost Center", url: "/dashboard/upah/cost-center" },
          { title: "Pengaturan Lembur", url: "/dashboard/upah/pengaturan-lembur" },
        ],
      },
      {
        // Penanda tangan Daftar Upah & SPKL: Umum, lalu khusus per kelompok / bidang.
        title: "Penanda Tangan",
        icon: Signature,
        items: [
          { title: "Umum", url: "/dashboard/upah/penanda-tangan/umum" },
          { title: "Per Kelompok Daftar Upah", url: "/dashboard/upah/penanda-tangan/kelompok" },
          { title: "Per Bidang", url: "/dashboard/upah/penanda-tangan/bidang" },
        ],
      },
    ],
  },
  {
    label: "Organisasi & Jabatan",
    items: [
      { title: "Struktur Organisasi", icon: Network, url: "/dashboard/organisasi" },
      {
        // Data master: diatur di awal, lalu hanya sesekali diubah (mis. saat ada SK struktur baru).
        title: "Master Organisasi",
        icon: Database,
        items: [
          { title: "Bidang", url: "/dashboard/organisasi/bidang" },
          { title: "Sub Unit", url: "/dashboard/organisasi/sub-unit" },
          { title: "Kategori Objek", url: "/dashboard/organisasi/kategori-objek" },
          { title: "Objek Penempatan", url: "/dashboard/organisasi/objek-penempatan" },
          { title: "Jabatan", url: "/dashboard/organisasi/jabatan" },
        ],
      },
    ],
  },
];
