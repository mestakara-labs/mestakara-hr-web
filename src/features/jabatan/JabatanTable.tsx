"use client";

import { useMemo } from "react";

import {
  actionsColumn,
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  jobGradeColumn,
  rowNumberColumn,
  toFilterOptions,
} from "@/components/shared/data-table";
import { BRM_LEVEL_ORDER, getBrmLevel } from "@/features/organisasi/brm-level";
import type { DivisionResource } from "@/types/api/division";
import type { PositionResource } from "@/types/api/organization";

import { BrmLevelBadge } from "./BrmLevelBadge";

const col = createDataTableColumnHelper<PositionResource>();

/** Tulisan untuk jabatan tanpa bidang. */
const EMPTY = "-";

interface JabatanTableConfigOptions {
  /** Master bidang, untuk pilihan filter Bidang */
  divisions: DivisionResource[];
  onDelete: (position: PositionResource) => void;
}

/**
 * Kolom-kolom tabel Jabatan:
 *
 *   No | Kode (cari, urut) | Nama Jabatan (cari, urut) | Level (filter, urut)
 *      | Bidang (filter, urut) | Pemegang (urut) | Aksi
 *
 * Catatan: cari & filter mencocokkan nilai ACCESSOR kolom. Karena itu kolom
 * Level dan Bidang memakai accessor yang mengembalikan TEKS yang tampil
 * (mis. "BRM-3", "Operasional"), bukan id-nya.
 */
function createJabatanTableConfig({ divisions, onDelete }: JabatanTableConfigOptions) {
  return defineTableConfig<PositionResource>({
    getRowId: (position) => position.id,
    emptyMessage: "Tidak ada jabatan yang cocok dengan pencarian atau filter.",
    tableClassName: "min-w-200",
    columns: col.columns([
      rowNumberColumn<PositionResource>(),

      col.accessor("code", {
        header: "Kode",
        meta: { search: { placeholder: "Cari kode..." }, width: "w-36", nowrap: true, cellClassName: "typo-label-m" },
      }),

      col.accessor("title", {
        header: "Nama Jabatan",
        meta: { search: { placeholder: "Cari nama..." } },
        cell: ({ row }) => (
          <>
            <p className="font-medium text-fg-heading">{row.original.title}</p>
            {row.original.description && (
              <p className="typo-body-s text-fg-tertiary">{row.original.description}</p>
            )}
          </>
        ),
      }),

      // "BRM-1" … "BRM-6": urutan teksnya sama dengan urutan levelnya.
      col.accessor((position) => getBrmLevel(position.brm_level).label, {
        id: "level",
        header: "Level",
        meta: {
          filter: { options: toFilterOptions(BRM_LEVEL_ORDER.map((level) => getBrmLevel(level).label)) },
          width: "w-32",
          nowrap: true,
        },
        cell: ({ row }) => <BrmLevelBadge level={row.original.brm_level} />,
      }),

      jobGradeColumn<PositionResource>((position) => position.job_grade),

      col.accessor((position) => position.division_name ?? EMPTY, {
        id: "division",
        header: "Bidang",
        meta: {
          filter: { options: toFilterOptions([...divisions.map((division) => division.name), EMPTY]) },
          cellClassName: "text-fg-secondary",
        },
      }),

      // Jumlah pemegang = jumlah penugasan jabatan yang masih aktif.
      col.accessor((position) => position.employees.length, {
        id: "holders",
        header: "Pemegang",
        meta: { alignRight: true, nowrap: true, cellClassName: "text-fg-secondary" },
        cell: ({ getValue }) => `${getValue()} orang`,
      }),

      actionsColumn<PositionResource>({
        label: (position) => `Aksi untuk ${position.title}`,
        editHref: (position) => `/dashboard/organisasi/jabatan/${position.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface JabatanTableProps extends JabatanTableConfigOptions {
  positions: PositionResource[];
}

/** Tabel master Jabatan. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function JabatanTable({ positions, divisions, onDelete }: JabatanTableProps) {
  // Konfigurasi hanya dibuat ulang kalau datanya berubah.
  const config = useMemo(() => createJabatanTableConfig({ divisions, onDelete }), [divisions, onDelete]);

  return <DataTable config={config} data={positions} />;
}
