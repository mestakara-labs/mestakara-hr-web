"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@mestakara/ui/badge";

import {
  actionsColumn,
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  rowNumberColumn,
  toFilterOptions,
} from "@/components/shared/data-table";
import { ROTATION_MODE, ROTATION_MODES } from "@/lib/schedule-rules";
import type { WorkGroupResource } from "@/types/api/work-group";

const col = createDataTableColumnHelper<WorkGroupResource>();

/**
 * Kolom-kolom tabel Regu Kerja:
 *
 *   No | Nama Regu (klik = detail) | Lokasi | Pola Kerja | Rotasi (filter) | Anggota | Aksi
 */
function createReguKerjaTableConfig(onDelete: (group: WorkGroupResource) => void) {
  return defineTableConfig<WorkGroupResource>({
    getRowId: (group) => group.id,
    emptyMessage: "Tidak ada regu kerja yang cocok dengan pencarian atau filter.",
    tableClassName: "min-w-240",
    columns: col.columns([
      rowNumberColumn<WorkGroupResource>(),

      col.accessor("name", {
        header: "Nama Regu",
        meta: { search: { placeholder: "Cari nama..." }, width: "min-w-56" },
        cell: ({ row }) => (
          <>
            <Link
              href={`/dashboard/jadwal/regu/${row.original.id}`}
              className="font-medium text-fg-heading hover:text-fg-brand hover:underline"
            >
              {row.original.name}
            </Link>
            {row.original.leader && (
              <p className="typo-body-s text-fg-tertiary">Ketua: {row.original.leader.name}</p>
            )}
          </>
        ),
      }),

      col.accessor((group) => group.sub_unit.name, {
        id: "location",
        header: "Lokasi",
        meta: { search: { placeholder: "Cari lokasi..." } },
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
        meta: { search: { placeholder: "Cari pola..." }, cellClassName: "text-fg-primary" },
      }),

      col.accessor("rotation_mode", {
        header: "Rotasi",
        meta: { filter: { options: toFilterOptions(ROTATION_MODES) }, nowrap: true },
        cell: ({ row }) =>
          row.original.rotation_mode === ROTATION_MODE.rotating ? (
            <Badge variant="info">Bergilir tiap {row.original.rotate_every_days} hari</Badge>
          ) : (
            <Badge variant="neutral">Tetap</Badge>
          ),
      }),

      col.accessor("active_member_count", {
        header: "Anggota",
        meta: { nowrap: true },
        cell: ({ row }) => (
          <span className="text-fg-primary">
            {row.original.active_member_count} orang
            <span className="typo-body-s text-fg-tertiary"> · {row.original.slot_count} slot</span>
          </span>
        ),
      }),

      actionsColumn<WorkGroupResource>({
        label: (group) => `Aksi untuk ${group.name}`,
        viewHref: (group) => `/dashboard/jadwal/regu/${group.id}`,
        editHref: (group) => `/dashboard/jadwal/regu/${group.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface ReguKerjaTableProps {
  groups: WorkGroupResource[];
  onDelete: (group: WorkGroupResource) => void;
}

/** Tabel Regu Kerja. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function ReguKerjaTable({ groups, onDelete }: ReguKerjaTableProps) {
  // Konfigurasi dibuat sekali saja (bukan di setiap render) supaya tabel tidak di-reset.
  const config = useMemo(() => createReguKerjaTableConfig(onDelete), [onDelete]);

  return <DataTable config={config} data={groups} />;
}
