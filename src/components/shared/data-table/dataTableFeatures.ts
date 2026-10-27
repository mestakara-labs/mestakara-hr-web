/**
 * Pengaturan dasar TanStack Table yang dipakai SEMUA tabel di aplikasi:
 * fitur apa saja yang aktif (sort, filter, halaman), cara menyaring, dan
 * pilihan per kolom (`meta`).
 *
 * Diadaptasi dari proyek ptpn1-agrowth-fe (src/components/shared/data-table).
 */
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  type ColumnDef,
  type FilterFn,
  type RowData,
} from "@tanstack/react-table";

/** Satu pilihan di daftar centang filter, mis. { value: "BRM-3", label: "BRM-3" }. */
export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Pilihan per kolom, ditulis di `meta` saat mendefinisikan kolom.
 * Semuanya opsional — kolom paling sederhana cukup `header` + accessor.
 *
 * @example
 * col.accessor("code", {
 *   header: "Kode",
 *   meta: { search: { placeholder: "Cari kode..." }, nowrap: true },
 * })
 */
export interface DataTableColumnMeta {
  /** Judul untuk chip filter & judul dialog; bawaannya memakai `header` */
  label?: string;
  /** Munculkan kotak cari di bawah judul kolom */
  search?: { placeholder?: string };
  /**
   * Munculkan ikon corong yang membuka daftar centang. `options` boleh:
   *   - daftar tetap, mis. toFilterOptions(["BRM-1", "BRM-2"])
   *   - fungsi yang menerima semua nilai kolom ini di data (teks, tanpa kembar; "" = kosong),
   *     untuk pilihan yang mengikuti data, mis. Job Grade yang sudah diisi saja
   */
  filter?: { options: FilterOption[] | ((values: string[]) => FilterOption[]) };
  /** Rata kanan, mis. untuk kolom angka */
  alignRight?: boolean;
  /** Lebar kolom (kelas Tailwind), mis. "w-16" */
  width?: string;
  /** Isi sel tidak boleh turun ke baris kedua */
  nowrap?: boolean;
  /** Kelas tambahan untuk sel isi */
  cellClassName?: string;
}

/**
 * Filter yang sedang berlaku untuk SATU kolom. Dua-duanya boleh aktif bersamaan:
 * - `search` = teks dari kotak cari di bawah judul kolom
 * - `values` = nilai yang dicentang di dialog filter
 */
export interface ColumnFilterValue {
  search?: string;
  values?: string[];
}

/** true kalau filter kolom ini benar-benar menyaring sesuatu. */
export function isFilterActive(value: ColumnFilterValue | undefined): boolean {
  return Boolean(value?.search?.trim()) || Boolean(value?.values?.length);
}

/**
 * Cara menyaring baris: baris lolos kalau nilai kolomnya
 *   1. MENGANDUNG teks pencarian (huruf besar/kecil tidak dibedakan), dan
 *   2. ADA di antara nilai yang dicentang.
 *
 * Yang dicocokkan adalah nilai ACCESSOR kolom. Jadi kalau sel menampilkan nama
 * bidang, accessor-nya juga harus mengembalikan nama bidang (bukan id-nya).
 *
 * Accessor boleh mengembalikan DAFTAR teks, mis. ["Gunung Mas", "Malabar"].
 * Baris lolos filter centang kalau SALAH SATU isinya dicentang.
 */
// `any` dipakai karena fungsi ini berlaku untuk tabel bertipe data apa pun.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filterFn_column: FilterFn<any, any> = Object.assign(
  (row: { getValue: (id: string) => unknown }, columnId: string, filterValue: ColumnFilterValue) => {
    const rawValue = row.getValue(columnId);
    const cellValues = Array.isArray(rawValue) ? rawValue.map(String) : [String(rawValue ?? "")];
    const keyword = filterValue?.search?.trim().toLowerCase();

    if (keyword && !cellValues.join(", ").toLowerCase().includes(keyword)) return false;
    if (filterValue?.values?.length && !cellValues.some((value) => filterValue.values?.includes(value))) {
      return false;
    }

    return true;
  },
  {
    // Filter yang sudah kosong dibuang otomatis dari state tabel.
    autoRemove: (value: unknown) => !isFilterActive(value as ColumnFilterValue | undefined),
  },
);

/** Fitur TanStack Table yang aktif: sort, filter kolom, dan halaman. */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { column: filterFn_column },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, basic: sortFn_basic },
  columnMeta: {} as DataTableColumnMeta,
});

export type DataTableFeatures = typeof dataTableFeatures;

/** Tipe satu definisi kolom. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataTableColumnDef<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>;

/**
 * Alat bantu untuk menulis definisi kolom.
 *
 * @example
 * const col = createDataTableColumnHelper<DivisionResource>();
 * const columns = col.columns([
 *   col.accessor("code", { header: "Kode" }),
 * ]);
 */
export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}
