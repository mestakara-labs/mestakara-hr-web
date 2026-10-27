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
import type { PlacementCategoryResource } from "@/types/api/placement-category";

const col = createDataTableColumnHelper<PlacementCategoryResource>();

/**
 * Kolom-kolom tabel Kategori Objek:
 *
 *   No | Nama Kategori (cari, urut) | Keterangan (cari) | Jumlah Objek (urut) | Aksi
 */
function createKategoriObjekTableConfig(onDelete: (category: PlacementCategoryResource) => void) {
  return defineTableConfig<PlacementCategoryResource>({
    getRowId: (category) => category.id,
    emptyMessage: "Tidak ada kategori objek yang cocok dengan pencarian.",
    tableClassName: "min-w-160",
    columns: col.columns([
      rowNumberColumn<PlacementCategoryResource>(),

      col.accessor("name", {
        header: "Nama Kategori",
        meta: { search: { placeholder: "Cari nama..." }, cellClassName: "font-medium text-fg-heading" },
      }),

      // Accessor mengembalikan "-" untuk keterangan kosong, supaya bisa dicari.
      col.accessor((category) => category.description ?? "-", {
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

      actionsColumn<PlacementCategoryResource>({
        label: (category) => `Aksi untuk ${category.name}`,
        editHref: (category) => `/dashboard/organisasi/kategori-objek/${category.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface KategoriObjekTableProps {
  categories: PlacementCategoryResource[];
  onDelete: (category: PlacementCategoryResource) => void;
}

/** Tabel master Kategori Objek. Cari, urut, dan halaman diurus oleh DataTable. */
export function KategoriObjekTable({ categories, onDelete }: KategoriObjekTableProps) {
  // Konfigurasi dibuat sekali saja (bukan di setiap render) supaya tabel tidak di-reset.
  const config = useMemo(() => createKategoriObjekTableConfig(onDelete), [onDelete]);

  return <DataTable config={config} data={categories} />;
}
