"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from "lucide-react";
import { cn } from "cn";

interface ColumnHeaderProps {
  label: string;
  /** Kolom ini bisa diurutkan? */
  canSort: boolean;
  /** Urutan yang sedang berlaku: naik, turun, atau tidak diurutkan */
  sortDirection: "asc" | "desc" | false;
  /** Klik judul: tidak diurutkan → naik → turun → tidak diurutkan lagi */
  onSortClick: () => void;
  /** Diisi kalau kolom ini punya daftar centang (memunculkan ikon corong) */
  onFilterClick?: () => void;
  /** Ikon corong diberi warna kalau filter kolom ini sedang aktif */
  isFiltered: boolean;
  alignRight?: boolean;
}

/** Isi sel judul kolom: judul yang bisa diklik untuk mengurutkan + ikon corong filter. */
export function ColumnHeader({
  label,
  canSort,
  sortDirection,
  onSortClick,
  onFilterClick,
  isFiltered,
  alignRight = false,
}: ColumnHeaderProps) {
  const SortIcon = sortDirection === "asc" ? ArrowUp : sortDirection === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <div className={cn("flex items-center gap-1", alignRight && "justify-end")}>
      {canSort ? (
        <button
          type="button"
          onClick={onSortClick}
          aria-label={`Urutkan berdasarkan ${label}`}
          className={cn(
            "group flex items-center gap-1 whitespace-nowrap hover:text-fg-primary",
            sortDirection && "text-fg-heading",
          )}
        >
          {label}
          <SortIcon
            className={cn(
              "size-3.5 shrink-0",
              sortDirection ? "text-primary" : "text-fg-disabled group-hover:text-fg-tertiary",
            )}
          />
        </button>
      ) : (
        <span className="whitespace-nowrap">{label}</span>
      )}

      {onFilterClick && (
        <button
          type="button"
          onClick={onFilterClick}
          aria-label={`Filter ${label}`}
          aria-haspopup="dialog"
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-sm",
            isFiltered
              ? "bg-brand-subtle text-fg-brand"
              : "text-fg-disabled hover:bg-surface hover:text-fg-secondary",
          )}
        >
          <Filter className="size-3.5" />
        </button>
      )}
    </div>
  );
}
