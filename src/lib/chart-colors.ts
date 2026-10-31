/**
 * WARNA GRAFIK dari token design system @mestakara/ui (tidak ada kode warna hex di sini).
 *
 *   Seri ke-1..5  = --chart-1..5 (hijau, oranye, navy, biru langit, emas)
 *   Seri ke-6..12 = warna dasar lain yang masih serasi
 *   Matriks       = hijau --chart-1 dengan kepekatan sesuai besar nilainya
 */

/** Urutan warna seri. Lebih dari 12 seri -> warna berulang. */
export const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--color-forest-500)",
  "var(--color-red-500)",
  "var(--color-navy-300)",
  "var(--color-orange-300)",
  "var(--color-green-300)",
  "var(--color-gold-700)",
  "var(--color-sky-700)",
];

/** Warna seri ke-`index` (mulai 0). */
export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

/**
 * Warna sel matriks: makin besar `ratio` (0–1), makin pekat hijaunya.
 *   0 -> transparan, 1 -> hijau 70%
 */
export function heatColor(ratio: number): string {
  const percent = Math.round(Math.min(Math.max(ratio, 0), 1) * 70);
  return `color-mix(in srgb, var(--chart-1) ${percent}%, transparent)`;
}
