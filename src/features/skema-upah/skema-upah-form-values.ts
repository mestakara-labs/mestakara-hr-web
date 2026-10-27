/**
 * ISIAN SKEMA UPAH: bentuk teks untuk form (rupiah diketik "2.375.000"), isian awal,
 * dan cara mengubahnya menjadi data yang dikirim ke server — untuk dialog "Ubah Skema"
 * (satu karyawan) maupun "Ubah Sekaligus" (banyak karyawan).
 *
 * Dipisah dari file tampilan supaya file tampilan tetap pendek. Aturan dasarnya di src/lib/wage-rules.ts.
 */
import { toDateText } from "@/lib/date";
import {
  DEFAULT_CAP_DAYS,
  DEFAULT_WORKING_DAYS,
  parseRupiah,
  toRupiahText,
  type WageSchemeText,
} from "@/lib/wage-rules";
import type { WageSchemeResource, WageSchemeValues } from "@/types/api/wage";

/** Semua isian dialog skema: isian skema (teks) + kelompok + berlaku mulai + keterangan. */
export interface SkemaFormValues extends WageSchemeText {
  /** "" = tanpa kelompok */
  payroll_group_id: string;
  /** "YYYY-MM-DD" */
  effective_date: string;
  notes: string;
}

/** Isian awal dialog: dari skema yang berlaku, atau nilai bawaan kalau belum diatur. */
export function toSkemaForm(scheme: WageSchemeResource | null): SkemaFormValues {
  return {
    wage_type: scheme?.wage_type ?? "",
    base_salary: toRupiahText(scheme?.base_salary),
    working_days: String(scheme?.working_days ?? DEFAULT_WORKING_DAYS),
    is_capped: scheme?.is_capped ?? false,
    cap_days: String(scheme?.cap_days ?? DEFAULT_CAP_DAYS),
    operational_position_allowance: toRupiahText(scheme?.operational_position_allowance ?? 0),
    incentive: toRupiahText(scheme?.incentive ?? 0),
    has_meal_allowance: scheme?.has_meal_allowance ?? false,
    meal_allowance_per_day: scheme?.has_meal_allowance ? toRupiahText(scheme.meal_allowance_per_day) : "",
    payroll_group_id: scheme?.payroll_group?.id ?? "",
    // Perubahan biasanya berlaku mulai tanggal 1 bulan ini.
    effective_date: toDateText(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    notes: "",
  };
}

/** Isian skema (teks) -> angka yang dikirim ke server. */
export function toSchemeValues(form: SkemaFormValues): WageSchemeValues {
  return {
    wage_type: form.wage_type,
    base_salary: parseRupiah(form.base_salary) ?? 0,
    working_days: Number(form.working_days),
    is_capped: form.is_capped,
    // Tidak dibatasi -> batas hari kosong (null).
    cap_days: form.is_capped ? Number(form.cap_days || DEFAULT_CAP_DAYS) : null,
    operational_position_allowance: parseRupiah(form.operational_position_allowance) ?? 0,
    incentive: parseRupiah(form.incentive) ?? 0,
    has_meal_allowance: form.has_meal_allowance,
    // Tidak diberi uang makan -> nominalnya 0.
    meal_allowance_per_day: form.has_meal_allowance ? (parseRupiah(form.meal_allowance_per_day) ?? 0) : 0,
    payroll_group_id: form.payroll_group_id || null,
  };
}

// ---------------------------------------------------------------------------
// Ubah sekaligus: hanya isian yang dicentang yang dikirim
// ---------------------------------------------------------------------------

/** Kelompok isian yang bisa dicentang "ubah" di dialog Ubah Sekaligus. */
export type BulkField =
  | "wage_type"
  | "base_salary"
  | "working_days"
  | "cap"
  | "operational_position_allowance"
  | "incentive"
  | "meal"
  | "payroll_group_id";

/** Label setiap kelompok isian, urut sesuai tampilan. */
export const BULK_FIELDS: { key: BulkField; label: string }[] = [
  { key: "wage_type", label: "Jenis Upah" },
  { key: "base_salary", label: "Gaji Pokok" },
  { key: "working_days", label: "HKE" },
  { key: "cap", label: "Batas Hari Kerja" },
  { key: "operational_position_allowance", label: "Tunjangan Operasional & Jabatan" },
  { key: "incentive", label: "Insentif" },
  { key: "meal", label: "Uang Makan" },
  { key: "payroll_group_id", label: "Kelompok Daftar Upah" },
];

/** Belum ada yang dicentang. */
export const NO_BULK_FIELDS: Record<BulkField, boolean> = {
  wage_type: false,
  base_salary: false,
  working_days: false,
  cap: false,
  operational_position_allowance: false,
  incentive: false,
  meal: false,
  payroll_group_id: false,
};

/** Ambil hanya isian yang dicentang untuk dikirim di `fields` (POST /api/wage-schemes/bulk). */
export function toBulkFields(form: SkemaFormValues, enabled: Record<BulkField, boolean>): Partial<WageSchemeValues> {
  const values = toSchemeValues(form);
  const fields: Partial<WageSchemeValues> = {};

  if (enabled.wage_type) fields.wage_type = values.wage_type;
  if (enabled.base_salary) fields.base_salary = values.base_salary;
  if (enabled.working_days) fields.working_days = values.working_days;
  if (enabled.cap) {
    fields.is_capped = values.is_capped;
    fields.cap_days = values.cap_days;
  }
  if (enabled.operational_position_allowance) fields.operational_position_allowance = values.operational_position_allowance;
  if (enabled.incentive) fields.incentive = values.incentive;
  if (enabled.meal) {
    fields.has_meal_allowance = values.has_meal_allowance;
    fields.meal_allowance_per_day = values.meal_allowance_per_day;
  }
  if (enabled.payroll_group_id) fields.payroll_group_id = values.payroll_group_id;

  return fields;
}
