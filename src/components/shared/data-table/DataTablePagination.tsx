"use client";

import type { MouseEvent } from "react";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@mestakara/ui/pagination";

import { useDataTableContext } from "./DataTableContext";
import { PAGE_SIZE_OPTIONS } from "./tableConfig";

/**
 * Nomor halaman yang ditampilkan, dengan "…" untuk bagian yang dilompati.
 * Contoh: 20 halaman, sedang di halaman 9 -> 1 … 8 9 10 … 20
 */
export function getPageNumbers(currentPage: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: (number | "…")[] = [1];
  if (currentPage > 3) pages.push("…");

  // Halaman sekarang dan tetangganya
  const from = Math.max(2, currentPage - 1);
  const to = Math.min(totalPages - 1, currentPage + 1);
  for (let page = from; page <= to; page++) pages.push(page);

  if (currentPage < totalPages - 2) pages.push("…");
  pages.push(totalPages);

  return pages;
}

/**
 * Baris di bawah tabel:
 *
 *   Tampilkan [10 ▾] baris · 11–20 dari 37 data        ‹ 1 [2] 3 4 ›
 */
export function DataTablePagination() {
  const { state, totalRows } = useDataTableContext();
  const { pageIndex, pageSize } = state.pagination;

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(pageIndex + 1, totalPages);
  const firstRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(currentPage * pageSize, totalRows);

  function goToPage(event: MouseEvent, page: number) {
    event.preventDefault(); // link "#" tidak dipakai untuk pindah alamat
    const validPage = Math.min(Math.max(page, 1), totalPages);
    state.setPagination({ pageIndex: validPage - 1, pageSize });
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 typo-body-s text-fg-secondary">
        <label className="flex items-center gap-2">
          Tampilkan
          <NativeSelect
            size="sm"
            value={pageSize}
            onChange={(event) => state.setPagination({ pageIndex: 0, pageSize: Number(event.target.value) })}
            aria-label="Jumlah baris per halaman"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <NativeSelectOption key={size} value={size}>
                {size}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          baris
        </label>
        <span>{totalRows === 0 ? "Tidak ada data" : `${firstRow}–${lastRow} dari ${totalRows} data`}</span>
      </div>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text="Sebelumnya"
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
              onClick={(event) => goToPage(event, currentPage - 1)}
            />
          </PaginationItem>

          {getPageNumbers(currentPage, totalPages).map((page, index) => (
            <PaginationItem key={`${page}-${index}`}>
              {page === "…" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink href="#" isActive={page === currentPage} onClick={(event) => goToPage(event, page)}>
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              text="Berikutnya"
              aria-disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
              onClick={(event) => goToPage(event, currentPage + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
