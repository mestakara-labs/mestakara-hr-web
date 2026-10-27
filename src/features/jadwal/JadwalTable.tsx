"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@mestakara/ui/button";

import {
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  rowNumberColumn,
  toFilterOptions,
} from "@/components/shared/data-table";
import type { WorkGroupResource } from "@/types/api/work-group";

const col = createDataTableColumnHelper<WorkGroupResource>();

/** Alamat detail jadwal satu regu. */
export function scheduleDetailHref(groupId: string): string {
  return `/dashboard/jadwal/${groupId}`;
}

/**
 * Kolom-kolom tabel Daftar Jadwal Kerja (satu baris = satu regu):
 *
 *   No | Regu (klik = detail jadwal) | Lokasi (filter) | Pola Kerja (filter) | Anggota | [Lihat Detail Jadwal]
 *
 * Pilihan filter Lokasi & Pola Kerja diambil dari data regu yang ada.
 */
function createJadwalTableConfig(groups: WorkGroupResource[]) {
  const unique = (values: string[]) => [...new Set(values)].sort();
  const locationOptions = toFilterOptions(unique(groups.map((group) => group.sub_unit.name)));
  const patternOptions = toFilterOptions(unique(groups.map((group) => group.work_pattern.name)));

  return defineTableConfig<WorkGroupResource>({
    getRowId: (group) => group.id,
    emptyMessage: "Tidak ada regu yang cocok dengan pencarian atau filter.",
    tableClassName: "min-w-200",
    columns: col.columns([
      rowNumberColumn<WorkGroupResource>(),

      col.accessor("name", {
        header: "Regu",
        meta: { search: { placeholder: "Cari regu..." }, width: "min-w-56" },
        cell: ({ row }) => (
          <Link
            href={scheduleDetailHref(row.original.id)}
            className="font-medium text-fg-heading hover:text-fg-brand hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      }),

      col.accessor((group) => group.sub_unit.name, {
        id: "location",
        header: "Lokasi",
        meta: { search: { placeholder: "Cari lokasi..." }, filter: { options: locationOptions } },
        cell: ({ row }) => (
          <>
            <p className="text-fg-primary">{row.original.sub_unit.name}</p>
            {row.original.placement_object && (
              <p className="typo-body-s text-fg-tertiary">{row.original.placement_object.name}</p>
            )}
          </>
        ),
      }),

      col.accessor((group) => group.work_pattern.name, {
        id: "pattern",
        header: "Pola Kerja",
        meta: {
          search: { placeholder: "Cari pola..." },
          filter: { options: patternOptions },
          cellClassName: "text-fg-primary",
        },
      }),

      col.accessor("active_member_count", {
        header: "Anggota",
        meta: { nowrap: true, cellClassName: "text-fg-primary" },
        cell: ({ getValue }) => `${getValue()} orang`,
      }),

      col.display({
        id: "actions",
        header: "Aksi",
        enableSorting: false,
        meta: { nowrap: true },
        cell: ({ row }) => (
          <Button variant="outline" size="sm" asChild>
            <Link href={scheduleDetailHref(row.original.id)}>
              <CalendarDays />
              Lihat Detail Jadwal
            </Link>
          </Button>
        ),
      }),
    ]),
  });
}

/** Tabel Daftar Jadwal Kerja. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function JadwalTable({ groups }: { groups: WorkGroupResource[] }) {
  // Konfigurasi dibuat ulang hanya kalau datanya berubah, supaya tabel tidak di-reset.
  const config = useMemo(() => createJadwalTableConfig(groups), [groups]);

  return <DataTable config={config} data={groups} />;
}
