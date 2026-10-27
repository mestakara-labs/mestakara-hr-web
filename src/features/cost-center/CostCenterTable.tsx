"use client";

import { useMemo } from "react";

import {
  actionsColumn,
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  rowNumberColumn,
} from "@/components/shared/data-table";
import type { CostCenterResource } from "@/types/api/cost-center";

const col = createDataTableColumnHelper<CostCenterResource>();

/**
 * Kolom-kolom tabel Cost Center:
 *
 *   No | Kode (cari, urut) | Uraian (cari, urut) | Keterangan (cari) | Aksi
 */
function createCostCenterTableConfig(onDelete: (costCenter: CostCenterResource) => void) {
  return defineTableConfig<CostCenterResource>({
    getRowId: (costCenter) => costCenter.id,
    defaultSorting: [{ id: "code", desc: false }],
    emptyMessage: "Tidak ada cost center yang cocok dengan pencarian.",
    tableClassName: "min-w-180",
    columns: col.columns([
      rowNumberColumn<CostCenterResource>(),

      col.accessor("code", {
        header: "Kode",
        meta: { search: { placeholder: "Cari kode..." }, width: "w-40", nowrap: true, cellClassName: "typo-label-m" },
      }),

      col.accessor("name", {
        header: "Uraian",
        meta: { search: { placeholder: "Cari uraian..." }, cellClassName: "font-medium text-fg-heading" },
      }),

      // Accessor mengembalikan "-" untuk keterangan kosong, supaya bisa dicari.
      col.accessor((costCenter) => costCenter.description ?? "-", {
        id: "description",
        header: "Keterangan",
        enableSorting: false,
        meta: { search: { placeholder: "Cari keterangan..." }, cellClassName: "text-fg-secondary" },
      }),

      actionsColumn<CostCenterResource>({
        label: (costCenter) => `Aksi untuk ${costCenter.code}`,
        editHref: (costCenter) => `/dashboard/upah/cost-center/${costCenter.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface CostCenterTableProps {
  costCenters: CostCenterResource[];
  onDelete: (costCenter: CostCenterResource) => void;
}

/** Tabel master Cost Center. Cari, urut, dan halaman diurus oleh DataTable. */
export function CostCenterTable({ costCenters, onDelete }: CostCenterTableProps) {
  // Konfigurasi dibuat sekali saja (bukan di setiap render) supaya tabel tidak di-reset.
  const config = useMemo(() => createCostCenterTableConfig(onDelete), [onDelete]);

  return <DataTable config={config} data={costCenters} />;
}
