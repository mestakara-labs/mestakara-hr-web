"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mestakara/ui/table";

import { RowActions } from "./RowActions";

/** Satu kolom tabel daftar: judul + cara menampilkan isinya. */
export interface ListColumn<T> {
  header: string;
  cell: (item: T) => ReactNode;
}

interface ListSectionProps<T extends { id: string }> {
  /** Penjelasan singkat di atas tabel */
  description: string;
  /** Tulisan tombol tambah, mis. "Tambah Pendidikan" */
  addLabel: string;
  /** Tulisan saat daftar masih kosong */
  emptyText: string;
  items: T[];
  columns: ListColumn<T>[];
  /** Nama baris untuk pembaca layar, mis. (pendidikan) => pendidikan.level */
  itemLabel: (item: T) => string;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  /** Pesan error untuk daftar ini, mis. "Isi minimal satu riwayat pendidikan" */
  error?: string;
  disabled?: boolean;
}

/**
 * Daftar data yang bisa ditambah, diubah, dan dihapus di dalam form, mis.
 * riwayat pendidikan atau data batih:
 *
 *   Penjelasan singkat ...                      [+ Tambah Pendidikan]
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ Jenjang │ Institusi │ ... │ ⋮ (Edit / Hapus)                │
 *   └────────────────────────────────────────────────────────────┘
 *
 * Komponen ini hanya MENAMPILKAN. Tambah / ubah / hapus diurus pemanggilnya
 * (biasanya lewat dialog form).
 */
export function ListSection<T extends { id: string }>({
  description,
  addLabel,
  emptyText,
  items,
  columns,
  itemLabel,
  onAdd,
  onEdit,
  onDelete,
  error,
  disabled = false,
}: ListSectionProps<T>) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="typo-body-s text-fg-secondary">{description}</p>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onAdd}>
          <Plus />
          {addLabel}
        </Button>
      </div>

      {error && <p className="typo-body-s text-fg-danger">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-border">
        <Table striped className="min-w-180">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.header}>{column.header}</TableHead>
              ))}
              <TableHead className="w-14">
                <span className="sr-only">Aksi</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="py-8 text-center text-fg-tertiary">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}

            {items.map((item) => (
              <TableRow key={item.id}>
                {columns.map((column) => (
                  <TableCell key={column.header} className="whitespace-normal">
                    {column.cell(item)}
                  </TableCell>
                ))}
                <TableCell>
                  <RowActions
                    label={`Aksi untuk ${itemLabel(item)}`}
                    onEdit={() => onEdit(item)}
                    onDelete={() => onDelete(item)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
