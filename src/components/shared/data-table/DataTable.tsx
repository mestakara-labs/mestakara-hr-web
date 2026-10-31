"use client";

import type { ColumnFiltersState, RowData } from "@tanstack/react-table";

import { ColumnFilterDialog } from "./ColumnFilterDialog";
import { DataTableContent } from "./DataTableContent";
import { DataTableProvider, type RowSelection } from "./DataTableContext";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableToolbar } from "./DataTableToolbar";
import type { TableConfig } from "./tableConfig";

interface DataTableProps<TRow extends RowData> {
  /** Kolom + pilihan tabel, lihat `defineTableConfig` */
  config: TableConfig<TRow>;
  /** SEMUA baris data; cari, filter, urut, dan halaman diproses di browser */
  data: TRow[];
  /**
   * Isi kalau baris bisa DIPILIH dengan kotak centang (tambahkan juga `selectColumn()`
   * di daftar kolom). Kosongkan untuk tabel biasa.
   */
  selection?: RowSelection;
  /** Dipanggil setiap kali filter kolom berubah (termasuk saat pertama tampil). Kirim fungsi yang stabil, mis. setState. */
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
}

/**
 * Tabel data lengkap dengan fitur dari proyek ptpn1-agrowth-fe:
 *
 *   - URUT    : klik judul kolom (naik → turun → tanpa urutan)
 *   - CARI    : kotak cari di bawah judul kolom yang punya `meta.search`
 *   - FILTER  : ikon corong di judul kolom yang punya `meta.filter` (daftar centang)
 *   - CHIP    : filter yang aktif tampil di atas tabel, bisa dihapus satu per satu
 *   - HALAMAN : nomor halaman + pilihan jumlah baris per halaman
 *   - PILIH   : (opsional) kotak centang per baris, lihat prop `selection`
 *
 * Susunannya:
 *   DataTableToolbar     chip filter aktif + tombol Reset
 *   DataTableContent     tabel (judul, kotak cari, isi)
 *   DataTablePagination  halaman
 *   ColumnFilterDialog   dialog daftar centang (muncul saat ikon corong diklik)
 *
 * @example
 * <DataTable config={bidangTableConfig} data={divisions} />
 */
export function DataTable<TRow extends RowData>({ config, data, selection, onColumnFiltersChange }: DataTableProps<TRow>) {
  return (
    <DataTableProvider config={config} data={data} selection={selection} onColumnFiltersChange={onColumnFiltersChange}>
      <div className="flex flex-col gap-3">
        <DataTableToolbar />
        <DataTableContent />
        <DataTablePagination />
        <ColumnFilterDialog />
      </div>
    </DataTableProvider>
  );
}
