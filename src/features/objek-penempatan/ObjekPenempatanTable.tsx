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
import type { PlacementCategoryResource } from "@/types/api/placement-category";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";

const col = createDataTableColumnHelper<PlacementObjectResource>();

interface ObjekPenempatanTableConfigOptions {
  /** Master kategori & sub unit, untuk pilihan filter */
  categories: PlacementCategoryResource[];
  subUnits: SubUnitResource[];
  onDelete: (placementObject: PlacementObjectResource) => void;
}

/**
 * Kolom-kolom tabel Objek Penempatan:
 *
 *   No | Nama Objek (cari, urut) | Kategori (cari, filter, urut) | Sub Unit (cari, filter)
 *      | Keterangan (cari) | Penugasan Aktif (urut) | Aksi
 *
 * Kolom Sub Unit berisi DAFTAR nama sub unit. Filternya meloloskan objek yang
 * tersedia di SALAH SATU sub unit yang dicentang.
 */
function createObjekPenempatanTableConfig({ categories, subUnits, onDelete }: ObjekPenempatanTableConfigOptions) {
  return defineTableConfig<PlacementObjectResource>({
    getRowId: (placementObject) => placementObject.id,
    emptyMessage: "Tidak ada objek penempatan yang cocok dengan pencarian atau filter.",
    tableClassName: "min-w-220",
    columns: col.columns([
      rowNumberColumn<PlacementObjectResource>(),

      col.accessor("name", {
        header: "Nama Objek",
        meta: { search: { placeholder: "Cari nama..." }, cellClassName: "font-medium text-fg-heading" },
      }),

      col.accessor("category_name", {
        header: "Kategori",
        meta: {
          search: { placeholder: "Cari kategori..." },
          filter: { options: toFilterOptions(categories.map((category) => category.name)) },
          nowrap: true,
        },
        cell: ({ getValue }) => (
          <Badge variant="info" dot={false}>
            {getValue()}
          </Badge>
        ),
      }),

      // Accessor mengembalikan daftar nama sub unit, mis. ["Agrowisata Gunung Mas", "Agrowisata Malabar"].
      col.accessor((placementObject) => placementObject.sub_units.map((subUnit) => subUnit.name), {
        id: "subUnits",
        header: "Sub Unit",
        enableSorting: false,
        meta: {
          search: { placeholder: "Cari sub unit..." },
          filter: { options: toFilterOptions(subUnits.map((subUnit) => subUnit.name)) },
        },
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.sub_units.map((subUnit) => (
              <Badge key={subUnit.id} variant="neutral" dot={false}>
                {subUnit.name}
              </Badge>
            ))}
          </div>
        ),
      }),

      // Accessor mengembalikan "-" untuk keterangan kosong, supaya bisa dicari.
      col.accessor((placementObject) => placementObject.description ?? "-", {
        id: "description",
        header: "Keterangan",
        enableSorting: false,
        meta: { search: { placeholder: "Cari keterangan..." }, cellClassName: "text-fg-secondary" },
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

      actionsColumn<PlacementObjectResource>({
        label: (placementObject) => `Aksi untuk ${placementObject.name}`,
        editHref: (placementObject) => `/dashboard/organisasi/objek-penempatan/${placementObject.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface ObjekPenempatanTableProps extends ObjekPenempatanTableConfigOptions {
  placementObjects: PlacementObjectResource[];
}

/** Tabel master Objek Penempatan. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function ObjekPenempatanTable({ placementObjects, categories, subUnits, onDelete }: ObjekPenempatanTableProps) {
  // Konfigurasi hanya dibuat ulang kalau datanya berubah.
  const config = useMemo(
    () => createObjekPenempatanTableConfig({ categories, subUnits, onDelete }),
    [categories, subUnits, onDelete],
  );

  return <DataTable config={config} data={placementObjects} />;
}
