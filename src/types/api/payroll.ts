/**
 * DAFTAR UPAH karyawan Casual & Daily Worker per periode (Tahap 4 Presensi & Upah). Dihitung backend:
 *
 *   Gaji Upah   = Harian: min(K, batas hari) × Rp/hari   ·   Flat: Gaji Pokok (prorata kalau masuk/keluar di tengah bulan)
 *   Jumlah      = Gaji Upah + Lembur (reguler + DW) + Tunj. Operasional & Jabatan + Insentif + Uang Makan
 *   Diterima    = Jumlah − Potongan (BPJS TK/KES + PPIP/PPh 21 + Kebun/Unit, diisi manual, bawaan 0)
 *
 * Dikelompokkan menurut Kelompok Daftar Upah atau Bidang (setiap karyawan tepat satu kelompok).
 * Periode yang DIKUNCI memakai potret angka & penanda tangan saat dikunci. Aturan tampilan: src/lib/payroll-rules.ts.
 */

/** Pengelompokan Daftar Upah. */
export type PayrollGroupBy = "payroll_group" | "division";

/** Status periode: "draf" = masih bisa berubah; "dikunci" = angka & penanda tangan dibekukan. */
export type PayrollStatus = "draf" | "dikunci";

/** Jumlah uang (dipakai per kelompok). */
export interface PayrollTotals {
  hke: number;
  present_days: number;
  base_pay: number;
  overtime_pay: number;
  operational_allowance: number;
  incentive: number;
  meal_allowance: number;
  gross: number;
  deductions: number;
  net: number;
}

/** Satu kelompok (Kelompok Daftar Upah / Bidang). Karyawan tanpa kelompok: key "tanpa". */
export interface PayrollGroup {
  key: string;
  name: string;
  /** Sub Unit + Kode Afdeling karyawan di kelompok ini */
  sub_units: { name: string; afdeling_code: string | null }[];
  employee_count: number;
  /** Tempat & apakah penanda tangannya memakai Umum */
  signature: { place: string; uses_general_payroll: boolean; uses_general_spkl: boolean };
  totals: PayrollTotals;
}

/** Potongan satu karyawan. */
export interface PayrollDeductions {
  bpjs: number;
  pph21: number;
  unit: number;
}

/** Satu karyawan di Daftar Upah. */
export interface PayrollRow {
  employee_id: string;
  registration_number: string | null;
  name: string;
  employment_status: string;
  position: string | null;
  sub_unit: { name: string; afdeling_code: string | null } | null;
  payroll_group: { id: string; name: string } | null;
  division: { id: string; name: string } | null;
  /** Kunci kelompoknya pada pengelompokan yang diminta */
  group_key: string;
  cost_center: { id: string; code: string; name: string } | null;
  bank_account: { bank_name: string; account_number: string; account_name: string } | null;
  /** "Harian" / "Flat Bulanan"; null = skema belum diatur */
  wage_type: string | null;
  hke: number;
  /** Absen = jumlah kode K */
  present_days: number;
  active_days: number;
  calendar_days: number;
  base_salary: number;
  daily_rate: number;
  /** null = tidak dibatasi */
  cap_days: number | null;
  base_pay: number;
  regular_overtime_pay: number;
  dw_overtime_pay: number;
  overtime_pay: number;
  operational_allowance: number;
  incentive: number;
  meal_allowance: number;
  gross: number;
  deductions: PayrollDeductions;
  deductions_total: number;
  net: number;
  /** Mis. ["K 22 melebihi batas 20 hari; yang dibayar 20"] */
  warnings: string[];
}

/** Hal yang perlu dibereskan sebelum periode dikunci (jumlah karyawan, kecuali attendance_uploaded). */
export interface PayrollReadiness {
  without_scheme: number;
  without_bank_account: number;
  without_cost_center: number;
  without_payroll_group: number;
  without_division: number;
  attendance_uploaded: boolean;
  dw_not_matched: number;
  k_over_cap: number;
}

/** Isi `data` GET /api/payroll?period=YYYY-MM&group_by=payroll_group|division. */
export interface PayrollResource {
  period: string;
  status: PayrollStatus;
  locked_at: string | null;
  locked_by: string | null;
  /** false untuk bulan berjalan / masa depan (belum boleh dikunci) */
  can_lock: boolean;
  lock_history: { action: "kunci" | "buka"; reason: string | null; by: string | null; at: string }[];
  readiness: PayrollReadiness;
  summary: { employees: number; gross: number; deductions: number; net: number };
  groups: PayrollGroup[];
  rows: PayrollRow[];
}

/** Isian PUT /api/payroll/deductions. Isian yang tidak dikirim tidak diubah (untuk ubah sekaligus). */
export interface PayrollDeductionPayload {
  period: string;
  employee_ids: string[];
  bpjs?: number;
  pph21?: number;
  unit?: number;
}

/** Isi `data` POST /api/payroll/deductions/copy-previous (pratinjau maupun hasil simpan). */
export interface CopyDeductionsResult {
  /** Periode asal, "YYYY-MM" */
  source_period: string;
  /** Karyawan yang disalin beserta potongan bulan lalunya */
  employees: ({ employee_id: string; registration_number: string | null; name: string } & PayrollDeductions)[];
  totals: PayrollDeductions;
}
