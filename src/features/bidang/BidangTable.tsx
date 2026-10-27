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
import type { DivisionResource } from "@/types/api/division";

const col = createDataTableColumnHelper<DivisionResource>();

/**
 * Kolom-kolom tabel Bidang:
 *
 *   No | Kode (cari, urut) | Nama Bidang (cari, urut) | Keterangan (cari) | Jumlah Jabatan (urut) | Aksi
 */
function createBidangTableConfig(onDelete: (division: DivisionResource) => void) {
  return defineTableConfig<DivisionResource>({
    getRowId: (division) => division.id,
    emptyMessage: "Tidak ada bidang yang cocok dengan pencarian.",
    tableClassName: "min-w-180",
    columns: col.columns([
      rowNumberColumn<DivisionResource>(),

      col.accessor("code", {
        header: "Kode",
        meta: { search: { placeholder: "Cari kode..." }, width: "w-36", nowrap: true, cellClassName: "typo-label-m" },
      }),

      col.accessor("name", {
        header: "Nama Bidang",
        meta: { search: { placeholder: "Cari nama..." }, cellClassName: "font-medium text-fg-heading" },
      }),

      // Accessor mengembalikan "-" untuk keterangan kosong, supaya bisa dicari & diurutkan.
      col.accessor((division) => division.description ?? "-", {
        id: "description",
        header: "Keterangan",
        enableSorting: false,
        meta: { search: { placeholder: "Cari keterangan..." }, cellClassName: "text-fg-secondary" },
      }),

      col.accessor("position_count", {
        header: "Jumlah Jabatan",
        meta: { alignRight: true, nowrap: true },
        cell: ({ getValue }) => (
          <Badge variant="neutral" dot={false}>
            {getValue()} jabatan
          </Badge>
        ),
      }),

      actionsColumn<DivisionResource>({
        label: (division) => `Aksi untuk ${division.name}`,
        editHref: (division) => `/dashboard/organisasi/bidang/${division.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface BidangTableProps {
  divisions: DivisionResource[];
  onDelete: (division: DivisionResource) => void;
}

/** Tabel master Bidang. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function BidangTable({ divisions, onDelete }: BidangTableProps) {
  // Konfigurasi dibuat sekali saja (bukan di setiap render) supaya tabel tidak di-reset.
  const config = useMemo(() => createBidangTableConfig(onDelete), [onDelete]);

  return <DataTable config={config} data={divisions} />;
}
