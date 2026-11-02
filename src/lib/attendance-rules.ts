/**
 * ATURAN ABSENSI karyawan Casual & Daily Worker.
 *
 *   Kode  Arti            Dibayar?
 *   K     Kerja           ya   (juga dasar uang makan)
 *   DW    Daily Worker    tidak — hanya alat bantu admin (hari lebih untuk Casual yang dibatasi; dibayar lewat Lembur DW)
 *   I     Izin            tidak
 *   S     Sakit           tidak
 *   M     Mangkir         tidak
 *   C     Cuti            tidak
 *   L     Libur           tidak
 *   (kosong)              tidak masuk, tidak dibayar
 *
 * Absensi dipisah per KATEGORI KARYAWAN (tab di halaman Unggah Absensi):
 *   Karyawan Casual        Daftar Hadir (semua kode) + Lembur Reguler + Lembur DW
 *   Karyawan Daily Worker  Daftar Hadir TANPA kode DW (tanpa batas hari kerja) + Lembur Reguler; tidak ada Lembur DW
 * Istilah: "Daily Worker" = kategori karyawan; "DW" = kode hari ke-21 dst / Lembur DW milik Casual.
 */
import type { AttendanceImportType, AttendanceSource, EmployeeCategory } from "@/types/api/attendance";

/** Satu kode daftar hadir. */
export interface AttendanceCodeInfo {
  code: "K" | "DW" | "I" | "S" | "M" | "C" | "L";
  label: string;
  /** Hanya K yang dibayar */
  isPaid: boolean;
  /** Warna sel kalender (kelas tema) */
  className: string;
}

/** Semua kode, urut seperti kolom jumlah di template. */
export const ATTENDANCE_CODES: AttendanceCodeInfo[] = [
  { code: "K", label: "Kerja", isPaid: true, className: "bg-brand-subtle text-fg-brand" },
  { code: "DW", label: "Daily Worker", isPaid: false, className: "bg-info-subtle text-fg-info" },
  { code: "I", label: "Izin", isPaid: false, className: "bg-warning-subtle text-fg-warning" },
  { code: "S", label: "Sakit", isPaid: false, className: "bg-warning-subtle text-fg-warning" },
  { code: "M", label: "Mangkir", isPaid: false, className: "bg-danger-subtle text-fg-danger" },
  { code: "C", label: "Cuti", isPaid: false, className: "bg-subtle text-fg-secondary" },
  { code: "L", label: "Libur", isPaid: false, className: "bg-subtle text-fg-tertiary" },
];

/** Info satu kode; undefined kalau kode tidak dikenal / kosong. */
export function findAttendanceCode(code: string | null): AttendanceCodeInfo | undefined {
  return ATTENDANCE_CODES.find((item) => item.code === code);
}

/** Konfigurasi satu jenis unggahan (= satu tab di halaman Unggah Absensi). */
export interface AttendanceImportConfig {
  type: AttendanceImportType;
  /** Judul tab & kotak unggah */
  title: string;
  /** Alamat tab di URL, mis. "?tab=lembur-dw" */
  tab: string;
  /** Penjelasan singkat di kotak unggah */
  description: string;
  /** Satuan jumlah baris, mis. "karyawan" atau "baris lembur" */
  rowUnit: string;
}

/** Daftar Hadir karyawan Casual (semua kode). */
const DAFTAR_HADIR_CASUAL: AttendanceImportConfig = {
  type: "daftar_hadir",
  title: "Daftar Hadir",
  tab: "daftar-hadir",
  description: "Satu kode per tanggal: K, DW, I, S, M, C, L. Hanya K yang dibayar; sel kosong = tidak masuk.",
  rowUnit: "karyawan",
};

/** Daftar Hadir karyawan Daily Worker (tanpa kode DW). */
const DAFTAR_HADIR_DAILY_WORKER: AttendanceImportConfig = {
  ...DAFTAR_HADIR_CASUAL,
  description: "Satu kode per tanggal: K, I, S, M, C, L (kode DW tidak dipakai). Hanya K yang dibayar; sel kosong = tidak masuk.",
};

/** Lembur Reguler (karyawan Casual & Daily Worker). */
const LEMBUR_REGULER: AttendanceImportConfig = {
  type: "lembur_reguler",
  title: "Lembur Reguler",
  tab: "lembur-reguler",
  description: "Satu baris = satu karyawan, satu tanggal, satu rentang jam, beserta uraian pekerjaan.",
  rowUnit: "baris lembur",
};

/** Lembur DW (hanya karyawan Casual). */
const LEMBUR_DW: AttendanceImportConfig = {
  type: "lembur_dw",
  title: "Lembur DW",
  tab: "lembur-dw",
  description:
    "Lembur pengganti hari DW. Susunan barisnya sama dengan Lembur Reguler. Unggahan menggantikan semua baris Excel & hasil rekomendasi; baris manual & mobile tetap.",
  rowUnit: "baris lembur",
};

/** Satu kategori karyawan = satu tab besar di halaman Unggah Absensi. */
export interface EmployeeCategoryConfig {
  /** Nilai yang dikirim ke backend (`employee_category`) */
  value: EmployeeCategory;
  /** Judul tab, mis. "Karyawan Casual" */
  label: string;
  /** Status Karyawan di data karyawan, mis. "Karyawan Casual" */
  employmentStatus: string;
  /** Alamat tab di URL, mis. "?kategori=daily-worker" */
  slug: string;
  /** Jenis unggahan kategori ini, urut seperti tab kecil */
  imports: AttendanceImportConfig[];
  /** Kode daftar hadir yang boleh dipakai */
  codes: AttendanceCodeInfo[];
  /** true = punya kode DW & Lembur DW (hanya Casual). Lembur Reguler ada di kedua kategori. */
  hasDwOvertime: boolean;
}

export const EMPLOYEE_CATEGORIES: EmployeeCategoryConfig[] = [
  {
    value: "casual",
    label: "Karyawan Casual",
    employmentStatus: "Karyawan Casual",
    slug: "casual",
    imports: [DAFTAR_HADIR_CASUAL, LEMBUR_REGULER, LEMBUR_DW],
    codes: ATTENDANCE_CODES,
    hasDwOvertime: true,
  },
  {
    value: "daily_worker",
    label: "Karyawan Daily Worker",
    employmentStatus: "Karyawan Daily Worker",
    slug: "daily-worker",
    imports: [DAFTAR_HADIR_DAILY_WORKER, LEMBUR_REGULER],
    codes: ATTENDANCE_CODES.filter((item) => item.code !== "DW"),
    hasDwOvertime: false,
  },
];

/** Kategori dari alamat; tidak dikenal / kosong (alamat lama) -> Karyawan Casual. */
export function findCategoryBySlug(slug: string | null): EmployeeCategoryConfig {
  return EMPLOYEE_CATEGORIES.find((item) => item.slug === slug) ?? EMPLOYEE_CATEGORIES[0];
}

/** Jenis unggahan dari alamat tab di dalam satu kategori; tab tidak dikenal -> Daftar Hadir. */
export function findImportByTab(category: EmployeeCategoryConfig, tab: string | null): AttendanceImportConfig {
  return category.imports.find((item) => item.tab === tab) ?? category.imports[0];
}

/** Nama asal data untuk ditampilkan. */
export const SOURCE_LABELS: Record<AttendanceSource, string> = {
  import_excel: "Excel",
  mobile: "Mobile",
  manual: "Manual",
  rekomendasi_sistem: "Rekomendasi",
};

/** Menit -> "1 jam 30 menit", "45 menit", "2 jam". */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} menit`;
  return rest === 0 ? `${hours} jam` : `${hours} jam ${rest} menit`;
}

/** Menit -> jam berkoma: 90 -> "1,5". */
export function minutesToHours(minutes: number): string {
  return (minutes / 60).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}
