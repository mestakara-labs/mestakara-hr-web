/**
 * UKURAN GRAFIK KATEGORI × SERI (SeriesChart), supaya label & batang tidak bertumpuk walaupun datanya banyak.
 *
 * Dua bentuk grafik:
 *
 *   MENDATAR (kategori di kiri)            TEGAK (kategori di bawah)
 *   Kantor Induk   ▇▇▇▇▇▇▇▇                 ▇
 *   Gunung Mas     ▇▇▇▇▇                   ▇  ▇     ▇
 *   Objek Wahana…  ▇▇▇                     ▇  ▇  ▇  ▇
 *                                          Jan Feb Mar Apr  (miring kalau padat)
 *
 * Aturannya:
 *   - Mendatar: tinggi grafik bertambah per kategori; lebar label kiri mengikuti nama terpanjang (ada batasnya),
 *     nama yang terlalu panjang dipotong "…" (nama lengkap tetap terlihat di tooltip).
 *   - Tegak: setiap kategori dapat lebar minimum. Kalau totalnya lebih lebar dari kartu, grafik bisa DIGESER
 *     ke samping (bukan dipadatkan). Label bawah dimiringkan kalau tidak muat mendatar di lebar kartu yang sebenarnya.
 *
 * Semua angka di bawah boleh diubah sendiri kalau tampilannya ingin disesuaikan.
 */
import type { SeriesData } from "@/types/api/dashboard";

/** Perkiraan lebar satu huruf label sumbu (huruf 11 px), dalam px. */
const CHAR_WIDTH = 6.5;

// --- Grafik MENDATAR ---------------------------------------------------------
/** Tinggi satu baris kategori (px). */
const ROW_HEIGHT = 32;
/** Nama kategori paling panjang yang ditulis utuh di label kiri; lebih dari ini dipotong "…". */
const MAX_LEFT_LABEL_CHARS = 28;
/** Batas lebar label kiri (px). */
const MIN_LEFT_LABEL_WIDTH = 64;
const MAX_LEFT_LABEL_WIDTH = 200;

// --- Grafik TEGAK ------------------------------------------------------------
/** Tinggi area grafik tegak (px), di luar label bawah. */
const VERTICAL_CHART_HEIGHT = 300;
/** Lebar minimum satu kategori (px) kalau batangnya bertumpuk / satu seri / garis. */
const MIN_CATEGORY_WIDTH = 28;
/** Tambahan lebar per batang kalau beberapa seri berdiri berdampingan (tidak bertumpuk). */
const SIDE_BY_SIDE_BAR_WIDTH = 10;
/** Nama kategori paling panjang di label bawah yang dimiringkan; lebih dari ini dipotong "…". */
const MAX_BOTTOM_LABEL_CHARS = 18;
/** Lebar sumbu angka di kiri (px). */
export const VALUE_AXIS_WIDTH = 72;

/** Nama kategori yang lebih panjang dari ini membuat grafik "auto" mendatar (supaya namanya terbaca). */
const LONG_LABEL = 14;
/** Lebih dari sekian kategori, grafik batang "auto" dibuat mendatar. */
const MANY_CATEGORIES = 8;

export type SeriesChartLayout = "auto" | "vertical" | "horizontal";

export interface ChartSize {
  /** true = kategori di kiri (batang mendatar) */
  horizontal: boolean;
  /** Tinggi grafik (px) */
  height: number;
  /** Lebar minimum grafik (px). Lebih lebar dari kartu -> bisa digeser ke samping. */
  minWidth: number;
  /** Mendatar: lebar label kiri (px). Tegak: tinggi label bawah (px). */
  categoryAxisSize: number;
  /** Tegak saja: label bawah dimiringkan */
  rotateLabels: boolean;
  /** Jumlah huruf maksimum label kategori sebelum dipotong "…" */
  maxLabelChars: number;
}

/**
 * Hitung bentuk & ukuran grafik dari datanya.
 * `containerWidth` = lebar kartu tempat grafik (px), dipakai untuk menentukan label bawah perlu miring atau tidak.
 */
export function calculateChartSize(data: SeriesData, layout: SeriesChartLayout, containerWidth: number): ChartSize {
  const labels = data.categories.map((category) => category.label);
  const longestLabel = Math.max(0, ...labels.map((label) => label.length));
  const allBars = data.series.every((item) => item.kind === "bar");
  const horizontal =
    layout === "horizontal" ||
    (layout === "auto" && allBars && (labels.length > MANY_CATEGORIES || longestLabel > LONG_LABEL));

  if (horizontal) {
    const shownChars = Math.min(longestLabel, MAX_LEFT_LABEL_CHARS);
    return {
      horizontal: true,
      height: Math.max(240, labels.length * ROW_HEIGHT + 48),
      minWidth: 0,
      categoryAxisSize: clamp(shownChars * CHAR_WIDTH + 8, MIN_LEFT_LABEL_WIDTH, MAX_LEFT_LABEL_WIDTH),
      rotateLabels: false,
      maxLabelChars: MAX_LEFT_LABEL_CHARS,
    };
  }

  // Batang yang TIDAK bertumpuk berdiri berdampingan, jadi setiap kategori butuh tempat lebih lebar.
  const sideBySideBars = data.series.filter((item) => item.kind === "bar" && !item.stack).length;
  const categoryWidth = Math.max(MIN_CATEGORY_WIDTH, sideBySideBars * SIDE_BY_SIDE_BAR_WIDTH + 12);
  const minWidth = labels.length * categoryWidth + VALUE_AXIS_WIDTH + 24;

  // Lebar satu kategori yang SEBENARNYA: grafik melebar mengisi kartu, tapi tidak lebih sempit dari minWidth.
  const actualCategoryWidth = (Math.max(containerWidth, minWidth) - VALUE_AXIS_WIDTH - 24) / labels.length;
  // Label dimiringkan kalau nama terpanjang tidak muat di lebar satu kategori.
  const rotateLabels = longestLabel * CHAR_WIDTH > actualCategoryWidth;
  const shownChars = Math.min(longestLabel, MAX_BOTTOM_LABEL_CHARS);
  // Label miring 40°: tingginya kira-kira 0,65 × panjangnya.
  const bottomLabelHeight = rotateLabels ? Math.ceil(shownChars * CHAR_WIDTH * 0.65) + 12 : 30;

  return {
    horizontal: false,
    height: VERTICAL_CHART_HEIGHT + bottomLabelHeight,
    minWidth,
    categoryAxisSize: bottomLabelHeight,
    rotateLabels,
    maxLabelChars: rotateLabels ? MAX_BOTTOM_LABEL_CHARS : MAX_LEFT_LABEL_CHARS,
  };
}

/** Potong nama yang terlalu panjang: ("Objek Wisata Kebun Teh Malabar", 18) -> "Objek Wisata Kebu…". */
export function shortenLabel(label: string, maxChars: number): string {
  return label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
