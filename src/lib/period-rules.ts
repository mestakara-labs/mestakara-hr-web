/**
 * PERIODE DATA (bulan + tahun), mis. "September 2026".
 *
 * Dipakai filter "Periode Data" di halaman Data Karyawan (browser) DAN mock backend
 * (route handler), supaya aturan tanggal acuannya sama persis di kedua tempat.
 *
 * TANGGAL ACUAN = tanggal yang dipakai untuk menghitung data pada periode itu:
 *   - bulan yang sudah lewat -> tanggal TERAKHIR bulan itu   (September 2026 -> 2026-09-30)
 *   - bulan berjalan         -> HARI INI                      (sisa bulannya belum terjadi)
 *   - bulan yang belum tiba  -> tidak boleh dipilih
 */
import { MONTH_NAMES, toDateText } from "@/lib/date";

/** Satu periode. `month` 1 = Januari ... 12 = Desember. */
export interface DataPeriod {
  year: number;
  month: number;
}

/** Periode bulan berjalan, mis. { year: 2026, month: 10 }. */
export function currentPeriod(today: Date = new Date()): DataPeriod {
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
}

/** Apakah `period` adalah bulan berjalan? */
export function isCurrentPeriod(period: DataPeriod, today: Date = new Date()): boolean {
  const now = currentPeriod(today);
  return period.year === now.year && period.month === now.month;
}

/** Apakah `period` belum tiba (setelah bulan berjalan)? */
export function isFuturePeriod(period: DataPeriod, today: Date = new Date()): boolean {
  return toPeriodParam(period) > toPeriodParam(currentPeriod(today));
}

/**
 * Tanggal acuan periode, "YYYY-MM-DD":
 *   bulan lalu  { 2026, 9 }  -> "2026-09-30"
 *   bulan ini   { 2026, 10 } -> hari ini, mis. "2026-10-23"
 */
export function periodReferenceDate(period: DataPeriod, today: Date = new Date()): string {
  if (isCurrentPeriod(period, today)) return toDateText(today);

  // Tanggal 0 bulan berikutnya = tanggal terakhir bulan ini (otomatis benar untuk Februari kabisat).
  return toDateText(new Date(period.year, period.month, 0));
}

/** Periode -> teks untuk alamat API: { 2026, 9 } -> "2026-09". */
export function toPeriodParam(period: DataPeriod): string {
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

/**
 * Teks alamat API -> periode: "2026-09" -> { 2026, 9 }.
 * null kalau formatnya salah, mis. "2026-9", "2026-13", atau "September".
 */
export function parsePeriodParam(text: string): DataPeriod | null {
  const match = /^(\d{4})-(\d{2})$/.exec(text);
  if (!match) return null;

  const period = { year: Number(match[1]), month: Number(match[2]) };
  return period.month >= 1 && period.month <= 12 ? period : null;
}

/** Periode -> "September 2026". */
export function periodLabel(period: DataPeriod): string {
  return `${MONTH_NAMES[period.month - 1]} ${period.year}`;
}

/**
 * Pilihan tahun: dari `firstYear` sampai tahun ini, tanpa ada yang terlewat.
 *   firstYear 2021 (per 2026) -> [2021, 2022, 2023, 2024, 2025, 2026]
 */
export function periodYearOptions(firstYear: number, today: Date = new Date()): number[] {
  const lastYear = today.getFullYear();
  const start = Math.min(firstYear, lastYear);
  return Array.from({ length: lastYear - start + 1 }, (_, index) => start + index);
}

/**
 * Tahun paling awal di antara tanggal-tanggal "YYYY-MM-DD" (yang kosong dilewati), untuk pilihan tahun.
 * Semua kosong -> tahun ini.
 *   ["2015-03-01", null, "2009-07-15"] -> 2009
 */
export function firstYearOf(dates: (string | null)[], today: Date = new Date()): number {
  const years = dates.flatMap((date) => (date ? [Number(date.slice(0, 4))] : []));
  return years.length > 0 ? Math.min(...years) : today.getFullYear();
}

/** Bulan terakhir yang boleh dipilih di tahun `year`: tahun ini = bulan berjalan, tahun lalu = Desember. */
export function lastMonthOf(year: number, today: Date = new Date()): number {
  return year === today.getFullYear() ? today.getMonth() + 1 : 12;
}
