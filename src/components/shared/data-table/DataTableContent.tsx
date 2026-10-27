"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";
import { cn } from "cn";

import { ColumnHeader } from "./ColumnHeader";
import { SELECT_COLUMN_ID } from "./columnPresets";
import { useDataTableContext } from "./DataTableContext";
import type { DataTableColumnMeta } from "./dataTableFeatures";
import { DataTableSearchRow } from "./DataTableSearchRow";
import { SelectPageCheckbox } from "./RowSelectionCheckbox";

/**
 * Kotak tabel:
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ No  Kode ↕       Nama Jabatan ↕   Level ↕ ⏷   │  baris judul (urut + filter)
 *   │     [cari...]    [cari...]                   │  baris kotak cari
 *   ├──────────────────────────────────────────────┤
 *   │ 1   JAB-001      Manager          BRM-1      │  isi
 *   └──────────────────────────────────────────────┘
 *
 * Tabel yang lebar digulir ke samping di dalam kotak ini, bukan seluruh halaman.
 */
export function DataTableContent() {
  const { table, state, labelOf, showFilter, emptyMessage, tableClassName } = useDataTableContext();
  const rows = table.getRowModel().rows;
  const columnCount = table.getAllLeafColumns().length;
  const filteredColumnIds = state.columnFilters.map((filter) => filter.id);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table striped className={tableClassName}>
        <TableHeader>
          {/* Baris judul kolom */}
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const column = header.column;
                const meta = column.columnDef.meta as DataTableColumnMeta | undefined;

                // Kolom kotak centang: judulnya kotak "pilih semua di halaman ini".
                if (column.id === SELECT_COLUMN_ID) {
                  return (
                    <TableHead key={header.id} className={meta?.width}>
                      <SelectPageCheckbox />
                    </TableHead>
                  );
                }

                return (
                  <TableHead key={header.id} className={meta?.width}>
                    <ColumnHeader
                      label={labelOf(column.id)}
                      alignRight={meta?.alignRight}
                      canSort={column.getCanSort()}
                      sortDirection={column.getIsSorted()}
                      onSortClick={() => {
                        // Urutan klik: naik → turun → tidak diurutkan
                        const direction = column.getIsSorted();
                        if (direction === false) column.toggleSorting(false, false);
                        else if (direction === "asc") column.toggleSorting(true, false);
                        else column.clearSorting();
                      }}
                      onFilterClick={meta?.filter ? () => showFilter(column.id) : undefined}
                      isFiltered={filteredColumnIds.includes(column.id)}
                    />
                  </TableHead>
                );
              })}
            </TableRow>
          ))}

          {/* Kotak cari di bawah judul kolom */}
          <DataTableSearchRow />
        </TableHeader>

        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnCount} className="py-10 text-center text-fg-tertiary">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}

          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => {
                const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;

                return (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      meta?.nowrap ? "whitespace-nowrap" : "whitespace-normal",
                      meta?.alignRight && "text-right",
                      meta?.cellClassName,
                    )}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
