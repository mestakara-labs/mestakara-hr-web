/**
 * ATURAN TAMPILAN DAFTAR UPAH (Tahap 4). Perhitungannya di backend, lihat src/types/api/payroll.ts.
 */
import type { PayrollGroupBy, PayrollReadiness, PayrollRow } from "@/types/api/payroll";

/** Pilihan pengelompokan, urut seperti di layar. */
export const PAYROLL_GROUP_BY: { value: PayrollGroupBy; label: string }[] = [
  { value: "payroll_group", label: "Kelompok Daftar Upah" },
  { value: "division", label: "Bidang" },
];

/** Nama pengelompokan: "payroll_group" -> "Kelompok Daftar Upah". */
export function groupByLabel(groupBy: PayrollGroupBy): string {
  return PAYROLL_GROUP_BY.find((option) => option.value === groupBy)?.label ?? groupBy;
}

/** Format file ekspor. */
export type ExportFormat = "xlsx" | "pdf";

export const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "pdf", label: "PDF" },
];

/** Tanggal "YYYY-MM-DD" menurut WIB (zona waktu kantor), mis. untuk tanggal tanda tangan. */
function toWibDateText(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

/**
 * Tanggal tanda tangan BAWAAN di dialog Ekspor (sama dengan aturan backend kalau `sign_date` tidak dikirim):
 * periode dikunci -> tanggal kunci (WIB); belum dikunci -> hari ini (WIB).
 */
export function defaultSignDate(lockedAt: string | null, today: Date = new Date()): string {
  return toWibDateText(lockedAt ? new Date(lockedAt) : today);
}

/** Tanggal tanda tangan paling awal = tanggal 1 bulan periode, mis. "2026-10" -> "2026-10-01". */
export function firstSignDate(period: string): string {
  return `${period}-01`;
}

/** Jenis dokumen yang bisa diekspor dari halaman Daftar Upah. */
export type PayrollDocument = "daftar_upah" | "payroll" | "spkl_all" | "spkl_reguler" | "spkl_dw";

/**
 * Pilihan JENIS DOKUMEN di dialog Ekspor. Setiap file berisi REKAP (kelompok terpilih) lalu rincian per kelompok.
 * `isSpkl` = dokumen lembur: hanya karyawan yang punya lembur jenis itu.
 * `casualOnly` = ada Lembur DW di dalamnya, jadi hanya untuk Karyawan Casual (Daily Worker hanya punya Lembur Reguler).
 */
export const PAYROLL_DOCUMENTS: { value: PayrollDocument; label: string; isSpkl: boolean; casualOnly: boolean }[] = [
  { value: "daftar_upah", label: "Daftar Upah", isSpkl: false, casualOnly: false },
  { value: "payroll", label: "Payroll (rekening & transfer)", isSpkl: false, casualOnly: false },
  { value: "spkl_all", label: "SPKL Lembur Reguler + DW", isSpkl: true, casualOnly: true },
  { value: "spkl_reguler", label: "SPKL Lembur Reguler", isSpkl: true, casualOnly: false },
  { value: "spkl_dw", label: "SPKL Lembur DW", isSpkl: true, casualOnly: true },
];

/** Info satu jenis dokumen. */
export function findPayrollDocument(value: PayrollDocument) {
  return PAYROLL_DOCUMENTS.find((item) => item.value === value) ?? PAYROLL_DOCUMENTS[0];
}

/** true kalau karyawan ini ikut dokumen tersebut (SPKL: hanya yang punya upah lembur jenis itu). */
export function rowInDocument(row: PayrollRow, document: PayrollDocument): boolean {
  if (document === "spkl_reguler") return row.regular_overtime_pay > 0;
  if (document === "spkl_dw") return row.dw_overtime_pay > 0;
  if (document === "spkl_all") return row.overtime_pay > 0;
  return true;
}

/** Satu baris di kotak Kesiapan. */
export interface ReadinessItem {
  /** true = sudah beres */
  ok: boolean;
  text: string;
  /** Halaman untuk membereskannya (opsional) */
  href?: string;
}

/**
 * Isi kotak KESIAPAN sebelum periode dikunci, mis.
 *   ⚠ 2 karyawan belum punya skema upah   (-> Skema Upah Karyawan)
 *   ✓ Daftar hadir sudah diunggah
 * Hanya peringatan; tidak menghalangi kunci periode.
 */
export function readinessItems(readiness: PayrollReadiness): ReadinessItem[] {
  const count = (value: number, text: string, href?: string): ReadinessItem => ({
    ok: value === 0,
    text: value === 0 ? `Semua karyawan sudah ${text}` : `${value} karyawan belum ${text}`,
    href,
  });

  return [
    {
      ok: readiness.attendance_uploaded,
      text: readiness.attendance_uploaded ? "Daftar hadir sudah diunggah" : "Daftar hadir periode ini belum diunggah",
      href: "/dashboard/upah/absensi?tab=daftar-hadir",
    },
    count(readiness.without_scheme, "punya skema upah", "/dashboard/upah/skema"),
    count(readiness.without_bank_account, "punya rekening bank", "/dashboard/upah/skema"),
    count(readiness.without_cost_center, "punya cost center", "/dashboard/upah/skema"),
    count(readiness.without_payroll_group, "masuk Kelompok Daftar Upah", "/dashboard/upah/skema"),
    count(readiness.without_division, "punya Bidang (jabatan utama)", "/dashboard/jabatan-karyawan"),
    {
      ok: readiness.dw_not_matched === 0,
      text:
        readiness.dw_not_matched === 0
          ? "Semua Lembur DW sudah sesuai target"
          : `${readiness.dw_not_matched} karyawan Lembur DW-nya belum sesuai target`,
      href: "/dashboard/upah/absensi?tab=lembur-dw",
    },
    {
      ok: readiness.k_over_cap === 0,
      text:
        readiness.k_over_cap === 0
          ? "Tidak ada K yang melebihi batas hari"
          : `${readiness.k_over_cap} karyawan K-nya melebihi batas hari (yang dibayar hanya sampai batas)`,
      href: "/dashboard/upah/absensi?tab=daftar-hadir",
    },
  ];
}
