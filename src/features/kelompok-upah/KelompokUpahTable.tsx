"use client";

import { useMemo } from "react";

import {
  actionsColumn,
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
} from "@/components/shared/data-table";
import type { PayrollGroupResource } from "@/types/api/payroll-group";

const col = createDataTableColumnHelper<PayrollGroupResource>();

/**
 * Kolom-kolom tabel Kelompok Daftar Upah:
 *
 *   Urutan (urut) | Nama Kelompok (cari, urut) | Keterangan (cari) | Aksi
 */
function createKelompokUpahTableConfig(onDelete: (group: PayrollGroupResource) => void) {
  return defineTableConfig<PayrollGroupResource>({
    getRowId: (group) => group.id,
    defaultSorting: [{ id: "sort_order", desc: false }],
    emptyMessage: "Tidak ada kelompok yang cocok dengan pencarian.",
    tableClassName: "min-w-160",
    columns: col.columns([
      col.accessor("sort_order", {
        header: "Urutan",
        meta: { width: "w-24", nowrap: true, cellClassName: "text-fg-tertiary" },
      }),

      col.accessor("name", {
        header: "Nama Kelompok",
        meta: { search: { placeholder: "Cari nama..." }, cellClassName: "font-medium text-fg-heading" },
      }),

      // Accessor mengembalikan "-" untuk keterangan kosong, supaya bisa dicari.
      col.accessor((group) => group.description ?? "-", {
        id: "description",
        header: "Keterangan",
        enableSorting: false,
        meta: { search: { placeholder: "Cari keterangan..." }, cellClassName: "text-fg-secondary" },
      }),

      actionsColumn<PayrollGroupResource>({
        label: (group) => `Aksi untuk ${group.name}`,
        editHref: (group) => `/dashboard/upah/kelompok/${group.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface KelompokUpahTableProps {
  groups: PayrollGroupResource[];
  onDelete: (group: PayrollGroupResource) => void;
}

/** Tabel master Kelompok Daftar Upah. Cari, urut, dan halaman diurus oleh DataTable. */
export function KelompokUpahTable({ groups, onDelete }: KelompokUpahTableProps) {
  // Konfigurasi dibuat sekali saja (bukan di setiap render) supaya tabel tidak di-reset.
  const config = useMemo(() => createKelompokUpahTableConfig(onDelete), [onDelete]);

  return <DataTable config={config} data={groups} />;
}
