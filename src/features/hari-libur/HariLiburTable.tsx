"use client";

import { useMemo } from "react";
import { Badge } from "@mestakara/ui/badge";

import {
  actionsColumn,
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  rowNumberColumn,
  toFilterOptions,
} from "@/components/shared/data-table";
import { formatDate, formatDayName } from "@/lib/date";
import { HOLIDAY_TYPE_OPTIONS } from "@/lib/holiday-rules";
import type { HolidayResource } from "@/types/api/holiday";

const col = createDataTableColumnHelper<HolidayResource>();

/** Warna badge setiap jenis hari libur. */
const TYPE_VARIANT = { "Libur Nasional": "danger", "Cuti Bersama": "warning", "Libur Perusahaan": "info" } as const;

/**
 * Kolom-kolom tabel Hari Libur:
 *
 *   No | Tanggal (urut, + nama hari) | Nama (cari) | Jenis (filter) | Keterangan | Aksi
 */
function createHariLiburTableConfig(onDelete: (holiday: HolidayResource) => void) {
  return defineTableConfig<HolidayResource>({
    getRowId: (holiday) => holiday.id,
    emptyMessage: "Tidak ada hari libur yang cocok dengan pencarian atau filter.",
    tableClassName: "min-w-200",
    columns: col.columns([
      rowNumberColumn<HolidayResource>(),

      // Accessor = "YYYY-MM-DD" supaya urutannya benar; tampilannya "17 Agustus 2026 (Senin)".
      col.accessor("date", {
        header: "Tanggal",
        meta: { nowrap: true },
        cell: ({ getValue }) => (
          <>
            <p className="font-medium text-fg-heading">{formatDate(getValue())}</p>
            <p className="typo-body-s text-fg-tertiary">{formatDayName(getValue())}</p>
          </>
        ),
      }),

      col.accessor("name", {
        header: "Nama Hari Libur",
        meta: { search: { placeholder: "Cari nama..." }, cellClassName: "text-fg-primary" },
      }),

      col.accessor("type", {
        header: "Jenis",
        meta: { filter: { options: toFilterOptions(HOLIDAY_TYPE_OPTIONS) }, nowrap: true },
        cell: ({ getValue }) => (
          <Badge variant={TYPE_VARIANT[getValue() as keyof typeof TYPE_VARIANT] ?? "neutral"}>{getValue()}</Badge>
        ),
      }),

      col.accessor((holiday) => holiday.description ?? "-", {
        id: "description",
        header: "Keterangan",
        enableSorting: false,
        meta: { cellClassName: "text-fg-secondary" },
      }),

      actionsColumn<HolidayResource>({
        label: (holiday) => `Aksi untuk ${holiday.name}`,
        editHref: (holiday) => `/dashboard/jadwal/hari-libur/${holiday.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface HariLiburTableProps {
  holidays: HolidayResource[];
  onDelete: (holiday: HolidayResource) => void;
}

/** Tabel master Hari Libur. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function HariLiburTable({ holidays, onDelete }: HariLiburTableProps) {
  // Konfigurasi dibuat sekali saja (bukan di setiap render) supaya tabel tidak di-reset.
  const config = useMemo(() => createHariLiburTableConfig(onDelete), [onDelete]);

  return <DataTable config={config} data={holidays} />;
}
