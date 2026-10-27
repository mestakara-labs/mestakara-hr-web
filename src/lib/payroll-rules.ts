/**
 * ATURAN TAMPILAN DAFTAR UPAH (Tahap 4). Perhitungannya di backend, lihat src/types/api/payroll.ts.
 */
import type { PayrollGroupBy, PayrollReadiness } from "@/types/api/payroll";

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
