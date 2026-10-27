"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@mestakara/ui/input-group";
import { TableHead, TableRow } from "@mestakara/ui/table";

import { useDataTableContext } from "./DataTableContext";
import type { DataTableColumnMeta } from "./dataTableFeatures";

/** Jeda sebelum ketikan diterapkan, supaya tabel tidak disaring ulang di setiap huruf. */
const TYPING_DELAY_MS = 400;

/**
 * Baris kedua di judul tabel: kotak cari di bawah setiap kolom yang punya
 * `meta.search`. Kolom lain diberi sel kosong supaya lebarnya tetap sejajar.
 * Tidak tampil sama sekali kalau tidak ada kolom yang bisa dicari.
 */
export function DataTableSearchRow() {
  const { table } = useDataTableContext();
  const columns = table.getAllLeafColumns();

  const hasSearchableColumn = columns.some(
    (column) => (column.columnDef.meta as DataTableColumnMeta | undefined)?.search,
  );
  if (!hasSearchableColumn) return null;

  return (
    <TableRow className="bg-surface hover:bg-surface">
      {columns.map((column) => {
        const search = (column.columnDef.meta as DataTableColumnMeta | undefined)?.search;

        return (
          <TableHead key={column.id} className="py-2">
            {search && <SearchCell columnId={column.id} placeholder={search.placeholder ?? "Cari..."} />}
          </TableHead>
        );
      })}
    </TableRow>
  );
}

/** Satu kotak cari untuk satu kolom. */
function SearchCell({ columnId, placeholder }: { columnId: string; placeholder: string }) {
  const { labelOf, filterValueOf, setColumnSearch } = useDataTableContext();
  const appliedText = filterValueOf(columnId)?.search ?? "";

  // Yang sedang diketik user; baru diterapkan ke tabel setelah jeda.
  const [typedText, setTypedText] = useState(appliedText);

  // Kalau pencarian dihapus dari luar (chip × atau tombol Reset), kotak ini ikut kosong.
  const [lastAppliedText, setLastAppliedText] = useState(appliedText);
  if (appliedText !== lastAppliedText) {
    setLastAppliedText(appliedText);
    setTypedText(appliedText);
  }

  // Terapkan ketikan setelah user berhenti mengetik selama TYPING_DELAY_MS.
  useEffect(() => {
    if (typedText.trim() === appliedText) return;

    const timer = setTimeout(() => setColumnSearch(columnId, typedText), TYPING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [typedText, appliedText, columnId, setColumnSearch]);

  return (
    <InputGroup className="h-8 min-w-28 bg-surface">
      <InputGroupAddon>
        <Search className="size-3.5" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={typedText}
        onChange={(event) => setTypedText(event.target.value)}
        onKeyDown={(event) => {
          // Enter = terapkan sekarang tanpa menunggu jeda
          if (event.key === "Enter") setColumnSearch(columnId, typedText);
        }}
        placeholder={placeholder}
        aria-label={`Cari ${labelOf(columnId)}`}
        className="typo-body-s font-normal"
      />
    </InputGroup>
  );
}
