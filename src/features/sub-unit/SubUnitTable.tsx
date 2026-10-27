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
import type { SubUnitResource } from "@/types/api/sub-unit";

const col = createDataTableColumnHelper<SubUnitResource>();

/**
 * Kolom-kolom tabel Sub Unit:
 *
 *   No | Kode Afdeling (cari, urut) | Nama Sub Unit (cari, urut) | Keterangan (cari) | Jumlah Objek | Penugasan Aktif | Aksi
 */
function createSubUnitTableConfig(onDelete: (subUnit: SubUnitResource) => void) {
  return defineTableConfig<SubUnitResource>({
    getRowId: (subUnit) => subUnit.id,
    emptyMessage: "Tidak ada sub unit yang cocok dengan pencarian.",
    tableClassName: "min-w-180",
    columns: col.columns([
      rowNumberColumn<SubUnitResource>(),

      // Accessor mengembalikan "-" untuk kode kosong, supaya bisa dicari & diurutkan.
      col.accessor((subUnit) => subUnit.afdeling_code ?? "-", {
        id: "afdeling_code",
        header: "Kode Afdeling",
        meta: { search: { placeholder: "Cari kode..." }, width: "w-36", nowrap: true, cellClassName: "typo-label-m" },
      }),

      col.accessor("name", {
        header: "Nama Sub Unit",
        meta: { search: { placeholder: "Cari nama..." }, cellClassName: "font-medium text-fg-heading" },
      }),

      // Accessor mengembalikan "-" untuk keterangan kosong, supaya bisa dicari.
      col.accessor((subUnit) => subUnit.description ?? "-", {
        id: "description",
        header: "Keterangan",
        enableSorting: false,
        meta: { search: { placeholder: "Cari keterangan..." }, cellClassName: "text-fg-secondary" },
      }),

      col.accessor("object_count", {
        header: "Jumlah Objek",
        meta: { alignRight: true, nowrap: true },
        cell: ({ getValue }) => (
          <Badge variant="neutral" dot={false}>
            {getValue()} objek
          </Badge>
        ),
      }),

      col.accessor("assignment_count", {
        header: "Penugasan Aktif",
        meta: { alignRight: true, nowrap: true },
        cell: ({ getValue }) => (
          <Badge variant="neutral" dot={false}>
            {getValue()} orang
          </Badge>
        ),
      }),

      actionsColumn<SubUnitResource>({
        label: (subUnit) => `Aksi untuk ${subUnit.name}`,
        editHref: (subUnit) => `/dashboard/organisasi/sub-unit/${subUnit.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface SubUnitTableProps {
  subUnits: SubUnitResource[];
  onDelete: (subUnit: SubUnitResource) => void;
}

/** Tabel master Sub Unit. Cari, urut, dan halaman diurus oleh DataTable. */
export function SubUnitTable({ subUnits, onDelete }: SubUnitTableProps) {
  // Konfigurasi dibuat sekali saja (bukan di setiap render) supaya tabel tidak di-reset.
  const config = useMemo(() => createSubUnitTableConfig(onDelete), [onDelete]);

  return <DataTable config={config} data={subUnits} />;
}
