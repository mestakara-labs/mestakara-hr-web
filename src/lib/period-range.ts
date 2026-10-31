/**
 * PERIODE RENTANG BULAN (Dashboard & Analitik SDM), mis. "Jan – Okt 2026".
 *
 *   - Bawaan: Januari tahun berjalan s.d. bulan berjalan (dihitung sampai HARI INI)
 *   - Satu bulan saja = "Dari" dan "s.d." bulan yang sama
 *   - Maksimal 24 bulan; bulan yang belum tiba tidak boleh; "Dari" setelah "s.d." ditukar otomatis
 *
 * Yang dikirim ke backend: from = tanggal 1 bulan "Dari", to = tanggal acuan bulan "s.d."
 * (akhir bulan, atau hari ini untuk bulan berjalan — aturan yang sama dengan Periode Data, lihat period-rules.ts).
 */
import { MONTH_NAMES } from "@/lib/date";
import { currentPeriod, periodReferenceDate, toPeriodParam, type DataPeriod } from "@/lib/period-rules";

export interface PeriodRange {
  from: DataPeriod;
  to: DataPeriod;
}

/** Rentang terpanjang yang boleh dipilih. */
export const MAX_RANGE_MONTHS = 24;

/** Tahun paling awal di pilihan tahun dashboard. */
export const FIRST_DASHBOARD_YEAR = 2024;

/** Bawaan: awal tahun berjalan s.d. bulan berjalan. */
export function defaultRange(today: Date = new Date()): PeriodRange {
  const to = currentPeriod(today);
  return { from: { year: to.year, month: 1 }, to };
}

/** Nomor urut bulan supaya mudah dibandingkan: { 2026, 10 } -> 2026 * 12 + 9. */
function monthIndex(period: DataPeriod): number {
  return period.year * 12 + (period.month - 1);
}

function fromMonthIndex(index: number): DataPeriod {
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Jumlah bulan dalam rentang (Jan–Okt = 10). */
export function rangeMonths(range: PeriodRange): number {
  return monthIndex(range.to) - monthIndex(range.from) + 1;
}

/**
 * Rapikan pilihan user:
 *   - bulan yang belum tiba -> bulan berjalan
 *   - "Dari" setelah "s.d." -> ditukar
 *   - lebih dari 24 bulan   -> "Dari" dimajukan supaya pas 24 bulan
 */
export function normalizeRange(range: PeriodRange, today: Date = new Date()): PeriodRange {
  const now = monthIndex(currentPeriod(today));
  let from = Math.min(monthIndex(range.from), now);
  let to = Math.min(monthIndex(range.to), now);
  if (from > to) [from, to] = [to, from];
  from = Math.max(from, to - MAX_RANGE_MONTHS + 1);
  return { from: fromMonthIndex(from), to: fromMonthIndex(to) };
}

/** Apakah rentang sama dengan bawaan (awal tahun s.d. bulan berjalan)? */
export function isDefaultRange(range: PeriodRange, today: Date = new Date()): boolean {
  const base = defaultRange(today);
  return toPeriodParam(range.from) === toPeriodParam(base.from) && toPeriodParam(range.to) === toPeriodParam(base.to);
}

/** Isian untuk backend: { from: "2026-01-01", to: "2026-10-31" } (bulan berjalan: to = hari ini). */
export function rangeToParams(range: PeriodRange, today: Date = new Date()): { from: string; to: string } {
  return { from: `${toPeriodParam(range.from)}-01`, to: periodReferenceDate(range.to, today) };
}

/** Nama bulan pendek: 1 -> "Jan", 8 -> "Agu". */
export function shortMonthName(month: number): string {
  return MONTH_NAMES[month - 1].slice(0, 3);
}

/**
 * Teks rentang:
 *   Okt–Okt 2026        -> "Okt 2026"
 *   Jan–Okt 2026        -> "Jan – Okt 2026"
 *   Nov 2025 – Okt 2026 -> "Nov 2025 – Okt 2026"
 */
export function rangeLabel(range: PeriodRange): string {
  const { from, to } = range;
  if (rangeMonths(range) === 1) return `${shortMonthName(to.month)} ${to.year}`;
  if (from.year === to.year) return `${shortMonthName(from.month)} – ${shortMonthName(to.month)} ${to.year}`;
  return `${shortMonthName(from.month)} ${from.year} – ${shortMonthName(to.month)} ${to.year}`;
}
