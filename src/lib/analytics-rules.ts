/**
 * ATURAN HALAMAN ANALITIK SDM: topik, metrik, dan dimensi yang bisa dipilih.
 *
 *   Topik  Karyawan -> metrik Jumlah Karyawan (posisi akhir periode)
 *          Upah     -> Upah Diterima, Gaji, Lembur, Tunjangan, Potongan, Karyawan Dibayar (dijumlah sepanjang periode)
 *   Dimensi "Lihat per" / "Pisah per": organisasi (bisa jadi filter & ditelusuri) + demografi + bulan
 *
 * Topik Kehadiran, Lembur, dan Pergerakan menyusul (Tahap B).
 */
import type { AnalyticsResource, AnalyticsView } from "@/types/api/analytics";
import type { DashboardUnit, FilterDimension } from "@/types/api/dashboard";

export type AnalyticsTopic = "workforce" | "payroll";

export interface MetricOption {
  value: string;
  label: string;
  unit: DashboardUnit;
}

export const ANALYTICS_TOPICS: { value: AnalyticsTopic; label: string; metrics: MetricOption[] }[] = [
  {
    value: "workforce",
    label: "Karyawan",
    metrics: [{ value: "headcount", label: "Jumlah Karyawan", unit: "orang" }],
  },
  {
    value: "payroll",
    label: "Upah Casual & DW",
    metrics: [
      { value: "net", label: "Upah Diterima", unit: "rupiah" },
      { value: "base_pay", label: "Gaji Upah", unit: "rupiah" },
      { value: "overtime_pay", label: "Lembur", unit: "rupiah" },
      { value: "allowances", label: "Tunjangan", unit: "rupiah" },
      { value: "deductions", label: "Potongan", unit: "rupiah" },
      { value: "headcount", label: "Karyawan Dibayar", unit: "orang" },
    ],
  },
];

/** Dimensi "Lihat per" / "Pisah per". `filter` = bisa dijadikan filter (dan ditelusuri dengan klik). */
export const ANALYTICS_DIMENSIONS: { value: string; label: string; filter?: FilterDimension }[] = [
  { value: "sub_unit", label: "Sub Unit", filter: "sub_unit" },
  { value: "division", label: "Bidang", filter: "division" },
  { value: "segment", label: "Segmen", filter: "segment" },
  { value: "placement_object", label: "Objek Penempatan", filter: "placement_object" },
  { value: "cost_center", label: "Cost Center", filter: "cost_center" },
  { value: "payroll_group", label: "Kelompok Daftar Upah", filter: "payroll_group" },
  { value: "employment_status", label: "Status Karyawan", filter: "employment_status" },
  { value: "brm_level", label: "Level BRM" },
  { value: "gender", label: "Jenis Kelamin" },
  { value: "age_group", label: "Kelompok Usia" },
  { value: "education", label: "Pendidikan" },
  { value: "month", label: "Bulan" },
];

/** Nama dimensi: "segment" -> "Segmen". */
export function analyticsDimensionLabel(value: string): string {
  return ANALYTICS_DIMENSIONS.find((dimension) => dimension.value === value)?.label ?? value;
}

/** Pilihan urutan hasil. */
export const SORT_OPTIONS = [
  { value: "value_desc", label: "Nilai terbesar" },
  { value: "value_asc", label: "Nilai terkecil" },
  { value: "label", label: "Nama (A–Z)" },
];

/** Pilihan Top N; "" = semua. */
export const LIMIT_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "5", label: "Top 5" },
  { value: "10", label: "Top 10" },
  { value: "20", label: "Top 20" },
];

/** Metrik bawaan sebuah topik (yang pertama). */
export function defaultMetric(topic: AnalyticsTopic): string {
  return ANALYTICS_TOPICS.find((item) => item.value === topic)?.metrics[0]?.value ?? "";
}

/** Metrik terpilih beserta satuannya. */
export function findMetric(topic: AnalyticsTopic, metric: string): MetricOption | undefined {
  return ANALYTICS_TOPICS.find((item) => item.value === topic)?.metrics.find((item) => item.value === metric);
}

/** Rapikan respons backend menjadi bentuk tampilan: `rows` selalu ada, `matrix` hanya kalau "Pisah per" dipakai. */
export function toAnalyticsView(resource: AnalyticsResource): AnalyticsView {
  return {
    unit: resource.unit,
    summary: resource.summary,
    rows: resource.rows ?? [],
    matrix: resource.type === "matrix" ? (resource.data ?? null) : null,
  };
}
