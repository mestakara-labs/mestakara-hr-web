/**
 * PILIHAN HALAMAN ANALITIK SDM: nilai bawaan, isian alamat untuk backend, dan aturan "telusuri" (klik batang / baris).
 *
 * Dipisah dari file tampilan supaya alurnya mudah dibaca:
 *   AnalitikControls mengubah pilihan -> toAnalyticsQuery -> GET /api/analytics -> grafik & tabel
 */
import { ANALYTICS_DIMENSIONS, defaultMetric, type AnalyticsTopic } from "@/lib/analytics-rules";
import { appendFilters, type WidgetFilters } from "@/lib/dashboard-filters";
import { defaultRange, rangeToParams, type PeriodRange } from "@/lib/period-range";

export interface AnalyticsState {
  topic: AnalyticsTopic;
  metric: string;
  range: PeriodRange;
  /** Dimensi "Lihat per" */
  groupBy: string;
  /** Dimensi "Pisah per"; "" = tidak dipisah */
  splitBy: string;
  filters: WidgetFilters;
  /** Jumlah apa adanya, atau porsi dari total */
  mode: "value" | "share";
  chart: "bar" | "line" | "donut";
  sort: string;
  /** "" = semua, selain itu Top N */
  limit: string;
}

/** Pilihan saat halaman dibuka: jumlah karyawan per Sub Unit, awal tahun s.d. hari ini. */
export function defaultAnalyticsState(): AnalyticsState {
  return {
    topic: "workforce",
    metric: defaultMetric("workforce"),
    range: defaultRange(),
    groupBy: "sub_unit",
    splitBy: "",
    filters: {},
    mode: "value",
    chart: "bar",
    sort: "value_desc",
    limit: "",
  };
}

/** Pilihan -> isian alamat GET /api/analytics (dan ekspornya). */
export function toAnalyticsQuery(state: AnalyticsState): URLSearchParams {
  const query = new URLSearchParams({
    topic: state.topic,
    metric: state.metric,
    group_by: state.groupBy,
    ...rangeToParams(state.range),
    sort: state.sort,
  });
  if (state.splitBy) query.set("split_by", state.splitBy);
  if (state.limit) query.set("limit", state.limit);
  appendFilters(query, state.filters);
  return query;
}

/**
 * TELUSURI: klik satu kelompok (mis. Sub Unit "Malabar")
 *   -> kelompok itu jadi filter (Sub Unit: Malabar)
 *   -> "Lihat per" pindah ke dimensi organisasi berikutnya yang belum difilter (mis. Bidang)
 * Dimensi yang tidak bisa jadi filter (gender, bulan, ...) tidak ditelusuri.
 */
export function drillDown(state: AnalyticsState, key: string): AnalyticsState {
  const current = ANALYTICS_DIMENSIONS.find((dimension) => dimension.value === state.groupBy);
  if (!current?.filter || !key) return state;

  const filters: WidgetFilters = { ...state.filters, [current.filter]: [key] };
  const next = ANALYTICS_DIMENSIONS.find(
    (dimension) => dimension.filter && dimension.value !== state.groupBy && !(filters[dimension.filter]?.length ?? 0),
  );

  return {
    ...state,
    filters,
    groupBy: next?.value ?? state.groupBy,
    // "Pisah per" tidak boleh sama dengan "Lihat per".
    splitBy: state.splitBy === next?.value ? "" : state.splitBy,
  };
}
