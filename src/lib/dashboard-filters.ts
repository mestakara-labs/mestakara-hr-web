/**
 * FILTER DIMENSI GRAFIK (Dashboard & Analitik SDM): Sub Unit, Bidang, Segmen, Objek Penempatan, Cost Center,
 * Kelompok Daftar Upah, Status Karyawan. Satu dimensi boleh beberapa nilai; antar dimensi digabung "dan".
 *
 * Dikirim ke backend sebagai filters[sub_unit][]=id&filters[segment][]=id ...
 */
import type { SearchOption } from "@/components/shared/SearchSelect";
import type { FilterDimension, FilterOptionsResource } from "@/types/api/dashboard";

/** Nilai filter satu grafik, mis. { sub_unit: ["id1"], segment: ["id2", "id3"] }. Dimensi kosong boleh tidak ada. */
export type WidgetFilters = Partial<Record<FilterDimension, string[]>>;

/** Nama setiap dimensi, urut seperti di panel filter. */
export const FILTER_DIMENSIONS: { key: FilterDimension; label: string }[] = [
  { key: "sub_unit", label: "Sub Unit" },
  { key: "division", label: "Bidang" },
  { key: "segment", label: "Segmen" },
  { key: "placement_object", label: "Objek Penempatan" },
  { key: "cost_center", label: "Cost Center" },
  { key: "payroll_group", label: "Kelompok Daftar Upah" },
  { key: "employment_status", label: "Status Karyawan" },
];

/** Semua dimensi (bawaan grafik karyawan). */
export const ALL_DIMENSIONS: FilterDimension[] = FILTER_DIMENSIONS.map((dimension) => dimension.key);

/** Nama dimensi: "segment" -> "Segmen". */
export function dimensionLabel(key: FilterDimension): string {
  return FILTER_DIMENSIONS.find((dimension) => dimension.key === key)?.label ?? key;
}

/** Pilihan satu dimensi untuk daftar centang (dari GET /api/dashboard/filter-options). */
export function dimensionOptions(key: FilterDimension, options: FilterOptionsResource | null): SearchOption[] {
  if (!options) return [];
  switch (key) {
    case "sub_unit":
      return options.sub_units.map((item) => ({ value: item.id, label: item.name }));
    case "division":
      return options.divisions.map((item) => ({ value: item.id, label: item.name }));
    case "segment":
      return options.segments.map((item) => ({ value: item.id, label: item.name }));
    case "placement_object":
      return options.placement_objects.map((item) => ({ value: item.id, label: item.name }));
    case "cost_center":
      return options.cost_centers.map((item) => ({ value: item.id, label: item.code, hint: item.name }));
    case "payroll_group":
      return options.payroll_groups.map((item) => ({ value: item.id, label: item.name }));
    case "employment_status":
      return options.employment_statuses.map((item) => ({ value: item.id, label: item.name }));
  }
}

/** Jumlah dimensi yang sedang dipakai, untuk tanda "Filter (2)". */
export function countActiveFilters(filters: WidgetFilters): number {
  return Object.values(filters).filter((values) => values && values.length > 0).length;
}

/** Tambahkan filter ke isian alamat: filters[sub_unit][]=id1&filters[sub_unit][]=id2 ... */
export function appendFilters(query: URLSearchParams, filters: WidgetFilters) {
  for (const [key, values] of Object.entries(filters)) {
    for (const value of values ?? []) query.append(`filters[${key}][]`, value);
  }
}

/**
 * Teks filter aktif untuk di bawah judul grafik, mis. "Sub Unit: Malabar · Segmen: Wahana, F&B".
 * Nama diambil dari pilihan filter; kalau belum termuat, tampil jumlahnya saja.
 */
export function describeFilters(filters: WidgetFilters, options: FilterOptionsResource | null): string {
  return FILTER_DIMENSIONS.filter(({ key }) => (filters[key]?.length ?? 0) > 0)
    .map(({ key, label }) => {
      const values = filters[key] ?? [];
      const names = dimensionOptions(key, options)
        .filter((option) => values.includes(option.value))
        .map((option) => option.label);
      return `${label}: ${names.length > 0 ? names.join(", ") : `${values.length} dipilih`}`;
    })
    .join(" · ");
}
