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
 */
import type { AttendanceImportType, AttendanceSource } from "@/types/api/attendance";

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

/** Tiga jenis unggahan, urut seperti tab. */
export const ATTENDANCE_IMPORTS: AttendanceImportConfig[] = [
  {
    type: "daftar_hadir",
    title: "Daftar Hadir",
    tab: "daftar-hadir",
    description: "Satu kode per tanggal: K, DW, I, S, M, C, L. Hanya K yang dibayar; sel kosong = tidak masuk.",
    rowUnit: "karyawan",
  },
  {
    type: "lembur_reguler",
    title: "Lembur Reguler",
    tab: "lembur-reguler",
    description: "Satu baris = satu karyawan, satu tanggal, satu rentang jam, beserta uraian pekerjaan.",
    rowUnit: "baris lembur",
  },
  {
    type: "lembur_dw",
    title: "Lembur DW",
    tab: "lembur-dw",
    description:
      "Lembur pengganti hari DW. Susunan barisnya sama dengan Lembur Reguler. Unggahan menggantikan semua baris Excel & hasil rekomendasi; baris manual & mobile tetap.",
    rowUnit: "baris lembur",
  },
];

/** Konfigurasi dari alamat tab; tab tidak dikenal -> Daftar Hadir. */
export function findImportByTab(tab: string | null): AttendanceImportConfig {
  return ATTENDANCE_IMPORTS.find((item) => item.tab === tab) ?? ATTENDANCE_IMPORTS[0];
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
