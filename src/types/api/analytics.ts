/**
 * ANALITIK SDM: satu metrik dikelompokkan per satu dimensi ("Lihat per"), boleh dipisah lagi per dimensi kedua
 * ("Pisah per") menjadi matriks. Daftar topik, metrik, dan dimensi ada di src/lib/analytics-rules.ts.
 *
 * GET /api/analytics?topic=&metric=&group_by=&split_by=&from=&to=&filters[..][]=&sort=&limit=
 *   tanpa split_by -> type "rows",   isinya di `rows`
 *   dengan split_by -> type "matrix", isinya di `data` (baris = Lihat per, kolom = Pisah per)
 * Tampilan memakai bentuk yang sudah dirapikan: AnalyticsView (lihat toAnalyticsView di lib/analytics-rules.ts).
 */
import type { DashboardUnit, MatrixData } from "./dashboard";

/** Satu kelompok hasil, mis. { key: "01a...", label: "Gunung Mas", value: 393, share: 65.8 }. */
export interface AnalyticsRow {
  key: string;
  label: string;
  value: number;
  /** Porsi dari total dalam persen (0–100) */
  share: number;
}

export interface AnalyticsSummary {
  /** Jumlah metrik semua kelompok */
  total: number;
  /** Jumlah kelompok */
  count: number;
  /** total ÷ jumlah kelompok */
  average: number;
  /** Total pada rentang sebelumnya yang sama panjang; null = tidak ada pembanding */
  previous: number | null;
}

/** Isi `data` GET /api/analytics, seperti yang dikirim backend. */
export interface AnalyticsResource {
  topic: string;
  metric: string;
  group_by: string;
  split_by: string | null;
  unit: DashboardUnit;
  from: string;
  to: string;
  filters: Record<string, string[]>;
  type: "rows" | "matrix";
  summary: AnalyticsSummary;
  /** Ada kalau type "rows" (sudah diurutkan & dibatasi Top N) */
  rows?: AnalyticsRow[];
  /** Ada kalau type "matrix" */
  data?: MatrixData;
}

/** Bentuk yang dipakai grafik & tabel: `rows` selalu ada, `matrix` hanya kalau "Pisah per" dipakai. */
export interface AnalyticsView {
  unit: DashboardUnit;
  summary: AnalyticsSummary;
  rows: AnalyticsRow[];
  matrix: MatrixData | null;
}
