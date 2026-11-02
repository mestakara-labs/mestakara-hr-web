/**
 * RINGKASAN BIAYA di halaman Unggah Absensi (kartu di atas tabel setiap tab).
 *
 * Angka upah TIDAK dihitung ulang di sini: diambil dari baris Daftar Upah (GET /api/payroll, dihitung backend),
 * jadi selalu sama dengan halaman Daftar Upah. Di sini hanya dijumlah & dikelompokkan.
 */
import type { AttendanceSummaryRow, OvertimeEntryRow } from "@/types/api/attendance";
import type { DwOvertimeTargetRow } from "@/types/api/dw-overtime";
import type { PayrollRow } from "@/types/api/payroll";

import type { EmployeeCategoryConfig } from "./attendance-rules";

/** Baris Daftar Upah milik satu kategori karyawan (Casual / Daily Worker). */
export function payrollRowsOf(rows: PayrollRow[], category: EmployeeCategoryConfig): PayrollRow[] {
  return rows.filter((row) => row.employment_status === category.employmentStatus);
}

/** Rata-rata yang aman: total 0 orang -> 0. */
function average(total: number, count: number): number {
  return count === 0 ? 0 : total / count;
}

/** Upah satu sub unit / afdeling. */
export interface SubUnitCost {
  /** Mis. "Gunung Mas (AFD03)" atau "Tanpa Sub Unit" */
  label: string;
  amount: number;
}

export interface AttendanceCostSummary {
  employees: number;
  dailyWage: number;
  flatWage: number;
  /** Karyawan yang skema upahnya belum diatur (upahnya Rp 0) */
  withoutScheme: number;
  /** Total hari K */
  presentDays: number;
  averagePresentDays: number;
  /** Hari K di atas batas hari (tidak dibayar), hanya karyawan yang dibatasi */
  overCapDays: number;
  /** Upah hari kerja (Harian = K × Rp/hari, Flat = prorata) */
  basePay: number;
  averageBasePay: number;
  /** Upah hari kerja per sub unit / afdeling, dari yang terbesar */
  bySubUnit: SubUnitCost[];
}

/**
 * Ringkasan tab DAFTAR HADIR:
 *   jumlah karyawan & hari K dari rekap daftar hadir; jenis upah, upah hari kerja, dan upah per sub unit dari Daftar Upah.
 */
export function summarizeAttendanceCost(summaryRows: AttendanceSummaryRow[], payrollRows: PayrollRow[]): AttendanceCostSummary {
  const presentDays = summaryRows.reduce((sum, row) => sum + row.codes.K, 0);
  const basePay = payrollRows.reduce((sum, row) => sum + row.base_pay, 0);

  const bySubUnit = new Map<string, number>();
  for (const row of payrollRows) {
    const label = row.sub_unit
      ? `${row.sub_unit.name}${row.sub_unit.afdeling_code ? ` (${row.sub_unit.afdeling_code})` : ""}`
      : "Tanpa Sub Unit";
    bySubUnit.set(label, (bySubUnit.get(label) ?? 0) + row.base_pay);
  }

  return {
    employees: summaryRows.length,
    dailyWage: payrollRows.filter((row) => row.wage_type === "Harian").length,
    flatWage: payrollRows.filter((row) => row.wage_type === "Flat Bulanan").length,
    withoutScheme: payrollRows.filter((row) => row.wage_type === null).length,
    presentDays,
    averagePresentDays: average(presentDays, summaryRows.length),
    overCapDays: payrollRows.reduce(
      (sum, row) => sum + (row.cap_days !== null ? Math.max(row.present_days - row.cap_days, 0) : 0),
      0,
    ),
    basePay,
    averageBasePay: average(basePay, payrollRows.length),
    bySubUnit: [...bySubUnit].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount),
  };
}

export interface OvertimeCostSummary {
  minutes: number;
  entries: number;
  /** Karyawan yang punya lembur jenis ini */
  employees: number;
  pay: number;
  averagePay: number;
  /** Upah lembur ÷ upah hari kerja, dalam persen */
  shareOfBasePay: number;
  /** Karyawan dengan upah lembur terbesar; null = belum ada lembur */
  top: { name: string; pay: number; minutes: number } | null;
}

/**
 * Ringkasan tab LEMBUR REGULER: jam & baris dari daftar lembur; upah lembur reguler & upah hari kerja dari Daftar Upah.
 */
export function summarizeRegularOvertimeCost(entries: OvertimeEntryRow[], payrollRows: PayrollRow[]): OvertimeCostSummary {
  const minutesByEmployee = new Map<string, number>();
  for (const entry of entries) {
    minutesByEmployee.set(entry.employee.id, (minutesByEmployee.get(entry.employee.id) ?? 0) + entry.duration_minutes);
  }

  const paidRows = payrollRows.filter((row) => row.regular_overtime_pay > 0);
  const pay = paidRows.reduce((sum, row) => sum + row.regular_overtime_pay, 0);
  const basePay = payrollRows.reduce((sum, row) => sum + row.base_pay, 0);
  const topRow = paidRows.reduce<PayrollRow | null>(
    (best, row) => (best === null || row.regular_overtime_pay > best.regular_overtime_pay ? row : best),
    null,
  );

  return {
    minutes: entries.reduce((sum, entry) => sum + entry.duration_minutes, 0),
    entries: entries.length,
    employees: minutesByEmployee.size,
    pay,
    averagePay: average(pay, paidRows.length),
    shareOfBasePay: basePay === 0 ? 0 : (pay / basePay) * 100,
    top: topRow
      ? { name: topRow.name, pay: topRow.regular_overtime_pay, minutes: minutesByEmployee.get(topRow.employee_id) ?? 0 }
      : null,
  };
}

export interface DwCostSummary {
  minutes: number;
  entries: number;
  /** Karyawan yang punya lembur DW */
  employees: number;
  /** Karyawan yang punya hari DW */
  withDwDays: number;
  pay: number;
  target: number;
  /** Karyawan yang belum sesuai target */
  notMatched: number;
}

/** Ringkasan tab LEMBUR DW, dari daftar Target vs Upah Lembur DW (dihitung backend). */
export function summarizeDwCost(rows: DwOvertimeTargetRow[]): DwCostSummary {
  return {
    minutes: rows.reduce((sum, row) => sum + row.dw_minutes, 0),
    entries: rows.reduce((sum, row) => sum + row.dw_entries, 0),
    employees: rows.filter((row) => row.dw_minutes > 0).length,
    withDwDays: rows.filter((row) => row.dw_days > 0).length,
    pay: rows.reduce((sum, row) => sum + row.dw_pay, 0),
    target: rows.reduce((sum, row) => sum + row.target_amount, 0),
    notMatched: rows.filter((row) => row.status !== "sesuai").length,
  };
}
