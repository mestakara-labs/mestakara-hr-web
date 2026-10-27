/**
 * ATURAN PERHITUNGAN LEMBUR (reguler & DW), angka-angkanya dari Pengaturan Lembur.
 * Semua hari dihitung sebagai hari kerja biasa.
 *
 *   Tarif per jam  = Gaji Pokok ÷ 173, dibulatkan ke rupiah          2.375.000 ÷ 173 = 13.728
 *   Jam dibayar    = jam ke-1 × 1,5  +  jam ke-2 dst × 2             3 jam -> 1,5 + 2×2 = 5,5
 *   Upah lembur    = tarif per jam × jam dibayar, dibulatkan ke 100   13.728 × 5,5 = 75.504 -> 75.500
 *
 * Pembulatan tarif ke rupiah dulu, lalu hasil akhir ke ratusan — sama seperti file Excel Daftar Lembur lama.
 */
import type { OvertimeSettingValues } from "@/types/api/overtime-setting";

/** Angka pengaturan yang dipakai rumus lembur. */
export type OvertimeRates = Pick<
  OvertimeSettingValues,
  "hourly_divisor" | "first_hour_multiplier" | "next_hour_multiplier" | "rounding"
>;

/** Tarif lembur per jam = Gaji Pokok ÷ pembagi (173), dibulatkan ke rupiah. */
export function hourlyRate(baseSalary: number, rates: OvertimeRates): number {
  return rates.hourly_divisor > 0 ? Math.round(baseSalary / rates.hourly_divisor) : 0;
}

/**
 * Jam dibayar untuk lembur sepanjang `hours` jam dalam SATU hari:
 *   0,5 jam -> 0,5 × 1,5 = 0,75      1 jam -> 1,5      3 jam -> 1,5 + 2 × 2 = 5,5
 */
export function paidHours(hours: number, rates: OvertimeRates): number {
  const firstHour = Math.min(hours, 1);
  const nextHours = Math.max(hours - 1, 0);
  return firstHour * rates.first_hour_multiplier + nextHours * rates.next_hour_multiplier;
}

/** Bulatkan ke kelipatan `step` terdekat: (75504, 100) -> 75500. */
export function roundTo(amount: number, step: number): number {
  return step > 0 ? Math.round(amount / step) * step : Math.round(amount);
}

/** Upah lembur SATU hari: tarif per jam × jam dibayar, dibulatkan (ke ratusan). */
export function overtimePay(baseSalary: number, hours: number, rates: OvertimeRates): number {
  return roundTo(hourlyRate(baseSalary, rates) * paidHours(hours, rates), rates.rounding);
}
