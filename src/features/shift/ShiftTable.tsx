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
import { formatMinutes, formatShiftTime } from "@/lib/shift-rules";
import type { ShiftResource } from "@/types/api/shift";

import { ShiftBadge } from "./ShiftBadge";

const col = createDataTableColumnHelper<ShiftResource>();

/**
 * Kolom-kolom tabel Shift:
 *
 *   No | Shift ([P] Pagi) | Jam (07.00–12.00) | Jam Kerja | Toleransi | Batas Scan | Dipakai | Aksi
 */
function createShiftTableConfig(onDelete: (shift: ShiftResource) => void) {
  return defineTableConfig<ShiftResource>({
    getRowId: (shift) => shift.id,
    emptyMessage: "Tidak ada shift yang cocok dengan pencarian.",
    tableClassName: "min-w-240",
    columns: col.columns([
      rowNumberColumn<ShiftResource>(),

      col.accessor("name", {
        header: "Shift",
        meta: { search: { placeholder: "Cari nama..." }, nowrap: true },
        cell: ({ row }) => <ShiftBadge shift={row.original} showName />,
      }),

      // Accessor = jam mulai "HH:MM" supaya urutannya dari yang paling pagi.
      col.accessor("start_time", {
        header: "Jam",
        meta: { nowrap: true },
        cell: ({ row }) => (
          <>
            <p className="text-fg-primary">{formatShiftTime(row.original.start_time, row.original.end_time)}</p>
            {row.original.crosses_midnight && (
              <p className="typo-body-s text-fg-tertiary">selesai keesokan harinya</p>
            )}
          </>
        ),
      }),

      col.accessor("work_minutes", {
        header: "Jam Kerja",
        meta: { nowrap: true },
        cell: ({ row }) => (
          <>
            <p className="text-fg-primary">{formatMinutes(row.original.work_minutes)}</p>
            {row.original.break_minutes > 0 && (
              <p className="typo-body-s text-fg-tertiary">istirahat {formatMinutes(row.original.break_minutes)}</p>
            )}
          </>
        ),
      }),

      col.accessor("late_tolerance_minutes", {
        header: "Toleransi Telat",
        meta: { nowrap: true, cellClassName: "text-fg-secondary" },
        cell: ({ getValue }) => `${getValue()} menit`,
      }),

      col.display({
        id: "scanWindow",
        header: "Batas Scan",
        meta: { nowrap: true },
        cell: ({ row }) => (
          <div className="typo-body-s text-fg-secondary">
            <p>Masuk: {formatMinutes(row.original.checkin_window_before_minutes)} sebelum</p>
            <p>Pulang: {formatMinutes(row.original.checkout_window_after_minutes)} sesudah</p>
          </div>
        ),
      }),

      col.accessor("pattern_count", {
        header: "Dipakai",
        meta: { nowrap: true },
        cell: ({ getValue }) => (
          <Badge variant="neutral" dot={false}>
            {getValue()} pola
          </Badge>
        ),
      }),

      actionsColumn<ShiftResource>({
        label: (shift) => `Aksi untuk ${shift.name}`,
        editHref: (shift) => `/dashboard/jadwal/shift/${shift.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface ShiftTableProps {
  shifts: ShiftResource[];
  onDelete: (shift: ShiftResource) => void;
}

/** Tabel master Shift. Cari, urut, dan halaman diurus oleh DataTable. */
export function ShiftTable({ shifts, onDelete }: ShiftTableProps) {
  // Konfigurasi dibuat sekali saja (bukan di setiap render) supaya tabel tidak di-reset.
  const config = useMemo(() => createShiftTableConfig(onDelete), [onDelete]);

  return <DataTable config={config} data={shifts} />;
}
