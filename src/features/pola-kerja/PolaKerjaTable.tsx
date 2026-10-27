"use client";

import { useMemo } from "react";
import { Badge } from "@mestakara/ui/badge";

import {
  actionsColumn,
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  rowNumberColumn,
} from "@/components/shared/data-table";
import type { WorkPatternResource } from "@/types/api/work-pattern";

const col = createDataTableColumnHelper<WorkPatternResource>();

/**
 * Kolom-kolom tabel Pola Kerja:
 *
 *   No | Nama Pola + keterangan (cari) | Siklus | Slot (A B C D) | Dipakai | Aksi
 */
function createPolaKerjaTableConfig(onDelete: (pattern: WorkPatternResource) => void) {
  return defineTableConfig<WorkPatternResource>({
    getRowId: (pattern) => pattern.id,
    emptyMessage: "Tidak ada pola kerja yang cocok dengan pencarian.",
    tableClassName: "min-w-200",
    columns: col.columns([
      rowNumberColumn<WorkPatternResource>(),

      col.accessor("name", {
        header: "Nama Pola",
        meta: { search: { placeholder: "Cari nama..." } },
        cell: ({ row }) => (
          <>
            <p className="font-medium text-fg-heading">{row.original.name}</p>
            {row.original.description && (
              <p className="typo-body-s text-fg-tertiary">{row.original.description}</p>
            )}
          </>
        ),
      }),

      col.accessor("cycle_days", {
        header: "Siklus",
        meta: { nowrap: true, cellClassName: "text-fg-secondary" },
        cell: ({ getValue }) => `${getValue()} hari`,
      }),

      // Slot: kode setiap slot; slot yang tidak ikut bergilir diberi garis putus-putus.
      col.accessor((pattern) => pattern.slots.length, {
        id: "slots",
        header: "Slot",
        meta: { nowrap: true },
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.slots.map((slot) => (
              <Badge
                key={slot.id}
                variant={slot.rotates ? "brand" : "outline"}
                dot={false}
                title={`${slot.name}${slot.rotates ? "" : " (tetap, tidak bergilir)"}`}
              >
                {slot.code}
              </Badge>
            ))}
          </div>
        ),
      }),

      col.accessor("group_count", {
        header: "Dipakai",
        meta: { nowrap: true },
        cell: ({ getValue }) => (
          <Badge variant="neutral" dot={false}>
            {getValue()} regu
          </Badge>
        ),
      }),

      actionsColumn<WorkPatternResource>({
        label: (pattern) => `Aksi untuk ${pattern.name}`,
        editHref: (pattern) => `/dashboard/jadwal/pola/${pattern.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface PolaKerjaTableProps {
  patterns: WorkPatternResource[];
  onDelete: (pattern: WorkPatternResource) => void;
}

/** Tabel Pola Kerja. Cari, urut, dan halaman diurus oleh DataTable. */
export function PolaKerjaTable({ patterns, onDelete }: PolaKerjaTableProps) {
  // Konfigurasi dibuat sekali saja (bukan di setiap render) supaya tabel tidak di-reset.
  const config = useMemo(() => createPolaKerjaTableConfig(onDelete), [onDelete]);

  return <DataTable config={config} data={patterns} />;
}
