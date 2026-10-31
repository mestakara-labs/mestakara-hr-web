import type { ColumnFiltersState, RowData, SortingState } from "@tanstack/react-table";

import type { DataTableColumnDef } from "./dataTableFeatures";

/**
 * Konfigurasi satu tabel: daftar kolom + pilihan tampilannya.
 * Ditulis sekali per fitur (mis. src/features/bidang/BidangTable.tsx).
 */
export interface TableConfig<TRow extends RowData> {
  columns: DataTableColumnDef<TRow>[];
  /** Id unik setiap baris, mis. (bidang) => bidang.id */
  getRowId: (row: TRow) => string;
  /** Urutan awal, mis. [{ id: "code", desc: false }] */
  defaultSorting?: SortingState;
  /**
   * Filter kolom saat tabel pertama kali tampil (dan setelah Reset), mis. hanya karyawan Aktif:
   * [{ id: "active_status", value: { values: ["Aktif"] } }]
   */
  defaultColumnFilters?: ColumnFiltersState;
  /** Pesan saat tidak ada baris yang cocok */
  emptyMessage?: string;
  /** Lebar minimum tabel, mis. "min-w-200" untuk tabel berkolom banyak */
  tableClassName?: string;
}

/** Pilihan jumlah baris per halaman. */
export const PAGE_SIZE_OPTIONS = [5, 10, 15, 25, 50];

/** Jumlah baris per halaman saat tabel pertama kali tampil. */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Tandai sebuah objek sebagai konfigurasi tabel. Isinya tidak diubah; fungsi
 * ini hanya membantu TypeScript mengenali tipe kolom-kolomnya.
 */
export function defineTableConfig<TRow extends RowData>(config: TableConfig<TRow>): TableConfig<TRow> {
  return config;
}
