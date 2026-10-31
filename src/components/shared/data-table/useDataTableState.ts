"use client";

import { useState } from "react";
import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";

import { DEFAULT_PAGE_SIZE } from "./tableConfig";

/**
 * Keadaan tabel: urutan (sort), filter per kolom, dan halaman.
 *
 * Aturan penting: setiap kali urutan atau filter berubah, tabel kembali ke
 * HALAMAN PERTAMA, supaya hasilnya langsung terlihat dari atas.
 */
export function useDataTableState(defaultSorting: SortingState = [], defaultColumnFilters: ColumnFiltersState = []) {
  const [sorting, setSortingState] = useState<SortingState>(defaultSorting);
  const [columnFilters, setColumnFiltersState] = useState<ColumnFiltersState>(defaultColumnFilters);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  function goToFirstPage() {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }

  const setSorting: OnChangeFn<SortingState> = (updater) => {
    setSortingState(updater);
    goToFirstPage();
  };

  const setColumnFilters: OnChangeFn<ColumnFiltersState> = (updater) => {
    setColumnFiltersState(updater);
    goToFirstPage();
  };

  /** Kembalikan urutan dan filter ke keadaan awal. */
  function reset() {
    setSortingState(defaultSorting);
    setColumnFiltersState(defaultColumnFilters);
    goToFirstPage();
  }

  /** true kalau urutan atau filter sudah diubah user (tombol Reset ditampilkan). */
  const isChanged =
    JSON.stringify(columnFilters) !== JSON.stringify(defaultColumnFilters) ||
    JSON.stringify(sorting) !== JSON.stringify(defaultSorting);

  return {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    pagination,
    setPagination,
    reset,
    isChanged,
  };
}

export type DataTableState = ReturnType<typeof useDataTableState>;
