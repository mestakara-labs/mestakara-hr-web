/**
 * DASHBOARD & ANALITIK SDM. Semua angka dihitung backend.
 *
 * Setiap kartu / grafik = satu WIDGET dengan kunci, mis. "payroll.trend". Bentuk datanya hanya 6 jenis,
 * supaya cukup sedikit komponen tampilan:
 *
 *   kpi          satu angka + pembanding + rincian        -> KpiTile
 *   series       kategori × beberapa seri (batang / garis) -> SeriesChart
 *   distribution porsi per kategori (donat / batang)       -> DistributionChart
 *   matrix       baris × kolom + total                     -> HeatMatrixTable
 *   table        tabel kecil                               -> MiniTable
 *   list         daftar "Perlu Tindakan" bertautan         -> ActionList
 *
 * Periode: from/to "YYYY-MM-DD". Angka akumulasi (upah, lembur, kehadiran, pergerakan) dijumlahkan sepanjang
 * rentang; angka posisi (jumlah karyawan, komposisi, jabatan, pensiun) memakai posisi pada tanggal `to`.
 */

/** Satuan angka; menentukan cara menulisnya (lihat lib/dashboard-format.ts). */
export type DashboardUnit = "orang" | "rupiah" | "persen" | "jam" | "hari" | "angka";

/** Kunci + nama, mis. { key: "01a...", label: "Gunung Mas" }. */
export interface KeyLabel {
  key: string;
  label: string;
}

export interface KpiData {
  value: number;
  unit: DashboardUnit;
  /** Nilai pada rentang sebelumnya yang sama panjang; null = tidak ada pembanding */
  previous: number | null;
  /** Perubahan dalam persen dibanding `previous`; null = tidak bisa dihitung */
  change_percent: number | null;
  /** Rincian kecil di bawah angka, mis. per status karyawan */
  breakdown?: (KeyLabel & { value: number })[];
  /** Catatan pendek, mis. "masuk 12 · keluar 3" */
  note?: string;
}

export interface SeriesData {
  categories: KeyLabel[];
  /** `values` sejajar dengan `categories`. `stack` sama = batang ditumpuk. */
  series: (KeyLabel & { kind: "bar" | "line"; stack?: string; values: number[] })[];
  unit: DashboardUnit;
}

export interface DistributionData {
  items: (KeyLabel & { value: number })[];
  total: number;
  unit: DashboardUnit;
}

export interface MatrixData {
  rows: KeyLabel[];
  columns: KeyLabel[];
  /** values[baris][kolom] */
  values: number[][];
  row_totals: number[];
  column_totals: number[];
  total: number;
  unit: DashboardUnit;
}

export interface TableData {
  columns: (KeyLabel & { unit?: DashboardUnit })[];
  /** Satu baris = { key, <kunci kolom>: nilai, href? } */
  rows: ({ key: string; href?: string } & Record<string, string | number | null | undefined>)[];
}

export interface ListData {
  items: (KeyLabel & { count: number; href: string })[];
}

/** Bagian yang sama di semua widget. */
interface WidgetBase {
  key: string;
  title: string;
  from: string;
  to: string;
  filters: Record<string, string[]>;
}

/** Satu widget; `type` menentukan bentuk `data`. */
export type DashboardWidget = WidgetBase &
  (
    | { type: "kpi"; data: KpiData }
    | { type: "series"; data: SeriesData }
    | { type: "distribution"; data: DistributionData }
    | { type: "matrix"; data: MatrixData }
    | { type: "table"; data: TableData }
    | { type: "list"; data: ListData }
  );

/** Isi `data` GET /api/dashboard?from=&to= : semua widget dengan periode bawaan, tanpa filter. */
export interface DashboardResource {
  from: string;
  to: string;
  /** Mis. "Januari – Oktober 2026" */
  period_label: string;
  /** Daftar widget; cari lewat `key` (lihat DashboardPage) */
  widgets: DashboardWidget[];
}

/** Dimensi filter grafik. */
export type FilterDimension =
  | "sub_unit"
  | "division"
  | "segment"
  | "placement_object"
  | "cost_center"
  | "payroll_group"
  | "employment_status";

/** Isi `data` GET /api/dashboard/filter-options : pilihan setiap dimensi filter. */
export interface FilterOptionsResource {
  sub_units: { id: string; name: string }[];
  divisions: { id: string; name: string }[];
  segments: { id: string; name: string }[];
  placement_objects: { id: string; name: string; segment_id: string | null }[];
  cost_centers: { id: string; code: string; name: string }[];
  payroll_groups: { id: string; name: string }[];
  /** Mis. { id: "Karyawan Tetap", name: "Tetap" } (id = teks status lengkap) */
  employment_statuses: { id: string; name: string }[];
}
