/**
 * Hitungan untuk kartu ringkasan di halaman Skema Upah Karyawan.
 */
import { WAGE_TYPE } from "@/lib/wage-rules";
import type { WageEmployeeResource } from "@/types/api/wage";

export interface SkemaUpahStats {
  total: number;
  /** Skema upah belum diatur */
  unset: number;
  daily: number;
  flat: number;
  /** Dibatasi maksimal sekian hari kerja */
  capped: number;
  /** Diberi uang makan */
  withMeal: number;
}

/** Hitung semua angka ringkasan sekaligus. */
export function calculateSkemaUpahStats(rows: WageEmployeeResource[]): SkemaUpahStats {
  const schemes = rows.flatMap((row) => (row.wage_scheme ? [row.wage_scheme] : []));

  return {
    total: rows.length,
    unset: rows.length - schemes.length,
    daily: schemes.filter((scheme) => scheme.wage_type === WAGE_TYPE.daily).length,
    flat: schemes.filter((scheme) => scheme.wage_type === WAGE_TYPE.flat).length,
    capped: schemes.filter((scheme) => scheme.is_capped).length,
    withMeal: schemes.filter((scheme) => scheme.has_meal_allowance).length,
  };
}
