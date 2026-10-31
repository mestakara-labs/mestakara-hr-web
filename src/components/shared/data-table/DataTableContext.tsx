"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTable, type ColumnFiltersState, type ReactTable, type RowData } from "@tanstack/react-table";

import {
  dataTableFeatures,
  isFilterActive,
  type ColumnFilterValue,
  type DataTableColumnMeta,
  type DataTableFeatures,
} from "./dataTableFeatures";
import type { TableConfig } from "./tableConfig";
import { useDataTableState, type DataTableState } from "./useDataTableState";

// `any` = tabel bertipe data apa pun.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = ReactTable<DataTableFeatures, any>;

/** Kolom yang sedang dibuka dialog filternya. */
export interface OpenFilter {
  columnId: string;
  label: string;
  options: { value: string; label: string }[];
}

/**
 * Pilihan baris (kotak centang). Dipegang oleh halaman yang memakai tabel, supaya
 * halaman itu tahu baris mana saja yang dipilih, mis. untuk "Ubah Atasan (4 dipilih)".
 */
export interface RowSelection {
  /** Id baris yang sedang dipilih (lihat `getRowId` di konfigurasi tabel) */
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  /** Baris mana yang BOLEH dipilih. Kosongkan = semua baris boleh dipilih. */
  canSelect?: (rowId: string) => boolean;
}

/** Semua yang dibutuhkan bagian-bagian tabel (judul, kotak cari, chip, halaman). */
interface DataTableContextValue {
  table: AnyTable;
  state: DataTableState;
  /** null = tabel tanpa kotak centang */
  selection: RowSelection | null;
  emptyMessage: string;
  tableClassName: string;
  /** Jumlah baris setelah disaring (untuk info "Menampilkan 1–10 dari 37") */
  totalRows: number;
  /** Judul sebuah kolom, dari `meta.label` atau `header` */
  labelOf: (columnId: string) => string;
  /** Filter yang sedang berlaku untuk sebuah kolom */
  filterValueOf: (columnId: string) => ColumnFilterValue | undefined;
  /** Isi kotak cari satu kolom ("" = hapus pencarian kolom itu) */
  setColumnSearch: (columnId: string, keyword: string) => void;
  /** Isi daftar centang satu kolom (undefined = hapus centangnya) */
  setColumnValues: (columnId: string, values: string[] | undefined) => void;
  /** Dialog filter yang sedang terbuka; null = tidak ada */
  openFilter: OpenFilter | null;
  showFilter: (columnId: string) => void;
  closeFilter: () => void;
}

const DataTableContext = createContext<DataTableContextValue | null>(null);

/** Baca data tabel. Hanya bisa dipakai di dalam <DataTable>. */
export function useDataTableContext(): DataTableContextValue {
  const context = useContext(DataTableContext);
  if (!context) throw new Error("Komponen ini harus berada di dalam <DataTable>.");
  return context;
}

interface DataTableProviderProps<TRow extends RowData> {
  config: TableConfig<TRow>;
  data: TRow[];
  selection?: RowSelection;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  children: ReactNode;
}

/**
 * Menyiapkan tabel TanStack lalu membagikannya ke semua bagian tabel lewat context.
 * Semua data sudah ada di browser, jadi cari, filter, urut, dan halaman
 * diproses langsung di browser (mode client).
 */
export function DataTableProvider<TRow extends RowData>({
  config,
  data,
  selection,
  onColumnFiltersChange,
  children,
}: DataTableProviderProps<TRow>) {
  const state = useDataTableState(config.defaultSorting, config.defaultColumnFilters);

  // Kabari halaman setiap kali filter kolom berubah (mis. supaya Ekspor Excel ikut filter tabel).
  useEffect(() => {
    onColumnFiltersChange?.(state.columnFilters);
  }, [state.columnFilters, onColumnFiltersChange]);

  const table = useTable({
    features: dataTableFeatures,
    columns: config.columns,
    data,
    getRowId: config.getRowId,
    // Semua kolom memakai cara saring yang sama (lihat filterFn_column).
    defaultColumn: { filterFn: "column" },
    state: {
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      pagination: state.pagination,
    },
    onSortingChange: state.setSorting,
    onColumnFiltersChange: state.setColumnFilters,
    onPaginationChange: state.setPagination,
    // Kembali ke halaman 1 sudah diurus useDataTableState.
    autoResetPageIndex: false,
  });

  // Id kolom yang dialog filternya terbuka; null = tidak ada.
  const [openFilterColumnId, setOpenFilterColumnId] = useState<string | null>(null);

  function metaOf(columnId: string): DataTableColumnMeta | undefined {
    return table.getColumn(columnId)?.columnDef.meta as DataTableColumnMeta | undefined;
  }

  function labelOf(columnId: string): string {
    const header = table.getColumn(columnId)?.columnDef.header;
    return metaOf(columnId)?.label ?? (typeof header === "string" ? header : columnId);
  }

  function filterValueOf(columnId: string): ColumnFilterValue | undefined {
    return state.columnFilters.find((filter) => filter.id === columnId)?.value as
      | ColumnFilterValue
      | undefined;
  }

  /**
   * Ubah SATU bagian filter sebuah kolom (teks cari ATAU centang) tanpa
   * menyentuh bagian lain. Kalau kolom itu tidak lagi menyaring apa pun,
   * filternya dibuang (chip-nya ikut hilang).
   */
  function updateColumnFilter(columnId: string, change: ColumnFilterValue) {
    state.setColumnFilters((previous) => {
      const otherFilters = previous.filter((filter) => filter.id !== columnId);
      const nextValue = { ...filterValueOf(columnId), ...change };

      return isFilterActive(nextValue) ? [...otherFilters, { id: columnId, value: nextValue }] : otherFilters;
    });
  }

  /** Pilihan filter sebuah kolom: daftar tetap, atau dihitung dari semua nilai kolom itu di data. */
  function filterOptionsOf(columnId: string) {
    const options = metaOf(columnId)?.filter?.options;
    if (typeof options !== "function") return options;

    const values = table.getCoreRowModel().rows.flatMap((row) => {
      const value = row.getValue(columnId);
      return Array.isArray(value) ? value.map(String) : [String(value ?? "")];
    });
    return options([...new Set(values)]);
  }

  const openFilterOptions = openFilterColumnId ? filterOptionsOf(openFilterColumnId) : undefined;

  const value: DataTableContextValue = {
    table: table as AnyTable,
    state,
    selection: selection ?? null,
    emptyMessage: config.emptyMessage ?? "Tidak ada data yang cocok dengan pencarian atau filter.",
    tableClassName: config.tableClassName ?? "",
    totalRows: table.getFilteredRowModel().rows.length,
    labelOf,
    filterValueOf,
    setColumnSearch: (columnId, keyword) => updateColumnFilter(columnId, { search: keyword.trim() || undefined }),
    setColumnValues: (columnId, values) =>
      updateColumnFilter(columnId, { values: values?.length ? values : undefined }),
    openFilter:
      openFilterColumnId && openFilterOptions
        ? { columnId: openFilterColumnId, label: labelOf(openFilterColumnId), options: openFilterOptions }
        : null,
    showFilter: setOpenFilterColumnId,
    closeFilter: () => setOpenFilterColumnId(null),
  };

  return <DataTableContext.Provider value={value}>{children}</DataTableContext.Provider>;
}
