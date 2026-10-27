"use client";

import { Fragment } from "react";
import { X } from "lucide-react";
import { Button } from "@mestakara/ui/button";

import { useDataTableContext } from "./DataTableContext";
import type { ColumnFilterValue } from "./dataTableFeatures";

/**
 * Baris di atas tabel: chip untuk setiap filter yang sedang aktif, dan tombol
 * Reset. Filternya sendiri dipasang dari judul kolom (kotak cari / ikon corong).
 *
 *   Filter aktif: [Kode: "JAB" ×] [Level: 2 dipilih ×]      Reset filter & urutan
 */
export function DataTableToolbar() {
  const { state, labelOf, setColumnSearch, setColumnValues, showFilter } = useDataTableContext();

  return (
    <div className="flex min-h-8 flex-wrap items-center gap-2 typo-body-s">
      {state.columnFilters.length === 0 ? (
        <p className="text-fg-tertiary">
          Ketik di kotak bawah judul kolom untuk mencari, klik ikon corong untuk memfilter, atau klik
          judul kolom untuk mengurutkan.
        </p>
      ) : (
        <span className="text-fg-secondary">Filter aktif:</span>
      )}

      {state.columnFilters.map((filter) => {
        const label = labelOf(filter.id);
        const value = filter.value as ColumnFilterValue;

        return (
          <Fragment key={filter.id}>
            {/* Chip pencarian, mis. Kode: "JAB" */}
            {value.search && (
              <FilterChip
                label={`${label}: "${value.search}"`}
                removeLabel={`Hapus pencarian ${label}`}
                onRemove={() => setColumnSearch(filter.id, "")}
              />
            )}

            {/* Chip centang, mis. Level: 2 dipilih (klik untuk membuka dialognya lagi) */}
            {value.values?.length ? (
              <FilterChip
                label={`${label}: ${value.values.length} dipilih`}
                removeLabel={`Hapus filter ${label}`}
                onOpen={() => showFilter(filter.id)}
                onRemove={() => setColumnValues(filter.id, undefined)}
              />
            ) : null}
          </Fragment>
        );
      })}

      {state.isChanged && (
        <Button variant="link" size="sm" className="ml-auto h-auto px-0 text-fg-secondary" onClick={state.reset}>
          Reset filter &amp; urutan
        </Button>
      )}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  removeLabel: string;
  /** Diisi kalau chip bisa diklik untuk membuka dialog filternya lagi */
  onOpen?: () => void;
  onRemove: () => void;
}

/** Satu chip filter aktif dengan tombol × untuk menghapusnya. */
function FilterChip({ label, removeLabel, onOpen, onRemove }: FilterChipProps) {
  return (
    <span className="flex items-center gap-0.5 rounded-full bg-brand-subtle py-0.5 pr-1 pl-1 typo-label-s text-fg-brand">
      {onOpen ? (
        <button type="button" onClick={onOpen} className="rounded-full px-2 py-0.5 hover:bg-white/60">
          {label}
        </button>
      ) : (
        <span className="px-2 py-0.5">{label}</span>
      )}
      <button type="button" onClick={onRemove} aria-label={removeLabel} className="rounded-full p-0.5 hover:bg-white/60">
        <X className="size-3.5" />
      </button>
    </span>
  );
}
