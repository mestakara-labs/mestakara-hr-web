"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@mestakara/ui/avatar";

import {
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  jobGradeColumn,
  rowNumberColumn,
  selectColumn,
  toFilterOptions,
  type RowSelection,
} from "@/components/shared/data-table";
import { BrmLevelBadge } from "@/features/jabatan/BrmLevelBadge";
import { BRM_LEVEL_ORDER, getBrmLevel } from "@/features/organisasi/brm-level";
import { ASSIGNMENT_PERIODS, ASSIGNMENT_STATUSES } from "@/lib/assignment-rules";
import { formatDate } from "@/lib/date";
import { getInitials } from "@/lib/initials";
import type { AssignmentResource } from "@/types/api/assignment";
import type { DivisionResource } from "@/types/api/division";
import type { PositionResource } from "@/types/api/organization";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";

import { AssignmentRowActions } from "./AssignmentRowActions";
import { AssignmentPeriodBadge } from "./AssignmentPeriodBadge";
import { AssignmentStatusBadge } from "./AssignmentStatusBadge";

const col = createDataTableColumnHelper<AssignmentResource>();

/** Tulisan untuk isian kosong. */
const EMPTY = "-";

/** Warna badge kolom Masa Tugas. */
/** Buang teks yang kembar, mis. ["A", "B", "A"] -> ["A", "B"]. */
function unique(values: string[]): string[] {
  return [...new Set(values)];
}

interface JabatanKaryawanTableConfigOptions {
  /** Data master, untuk pilihan filter */
  positions: PositionResource[];
  divisions: DivisionResource[];
  subUnits: SubUnitResource[];
  placementObjects: PlacementObjectResource[];
  /** Menu "Ubah Atasan" & "Riwayat Atasan" di ujung baris */
  onChangeSupervisor: (assignment: AssignmentResource) => void;
  onShowHistory: (assignment: AssignmentResource) => void;
}

/**
 * Kolom-kolom tabel Jabatan Karyawan:
 *
 *   ☐ | No | Karyawan (cari, urut) | Jabatan (cari, filter, urut) | Level BRM (cari, filter, urut)
 *      | Bidang (filter, urut) | Sub Unit (cari, filter, urut) | Objek Penempatan (cari, filter, urut)
 *      | Status (filter) | Atasan Langsung (cari) | Masa Tugas (filter)
 *      | No. Dokumen (cari) | Dokumen (link buka file) | Aksi (Ubah Atasan, Riwayat Atasan)
 *
 * Kotak centang (☐) dipakai untuk "Ubah Atasan" beberapa karyawan sekaligus.
 *
 * Catatan: cari & filter mencocokkan nilai ACCESSOR kolom, jadi accessor
 * mengembalikan TEKS yang tampil (mis. "Kantor Induk", "BRM-3"), bukan id-nya.
 */
function createJabatanKaryawanTableConfig({
  positions,
  divisions,
  subUnits,
  placementObjects,
  onChangeSupervisor,
  onShowHistory,
}: JabatanKaryawanTableConfigOptions) {
  return defineTableConfig<AssignmentResource>({
    getRowId: (assignment) => assignment.id,
    emptyMessage: "Tidak ada penugasan yang cocok dengan pencarian atau filter.",
    tableClassName: "min-w-400",
    columns: col.columns([
      selectColumn<AssignmentResource>((assignment) => assignment.employee.name),
      rowNumberColumn<AssignmentResource>(),

      // Karyawan: foto + nama + NIK
      col.accessor((assignment) => assignment.employee.name, {
        id: "employee",
        header: "Karyawan",
        meta: { search: { placeholder: "Cari nama..." } },
        cell: ({ row }) => {
          const { employee } = row.original;

          return (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                {employee.photo_url && <AvatarImage src={employee.photo_url} alt={`Foto ${employee.name}`} />}
                <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-fg-heading">{employee.name}</p>
                <p className="typo-body-s text-fg-tertiary">NIK {employee.nik ?? EMPTY}</p>
              </div>
            </div>
          );
        },
      }),

      col.accessor((assignment) => assignment.position.title, {
        id: "position",
        header: "Jabatan",
        meta: {
          search: { placeholder: "Cari jabatan..." },
          // Nama jabatan bisa sama di dua wilayah (mis. "Pelaksana Panen"), jadi yang kembar dibuang.
          filter: { options: toFilterOptions(unique(positions.map((position) => position.title))) },
          cellClassName: "text-fg-heading",
        },
      }),

      // "BRM-1" … "BRM-6": urutan teksnya sama dengan urutan levelnya.
      col.accessor((assignment) => getBrmLevel(assignment.position.brm_level).label, {
        id: "brmLevel",
        header: "Level BRM",
        meta: {
          search: { placeholder: "Cari level..." },
          filter: { options: toFilterOptions(BRM_LEVEL_ORDER.map((level) => getBrmLevel(level).label)) },
          nowrap: true,
        },
        cell: ({ row }) => <BrmLevelBadge level={row.original.position.brm_level} />,
      }),

      jobGradeColumn<AssignmentResource>((assignment) => assignment.position.job_grade),

      col.accessor((assignment) => assignment.position.division_name ?? EMPTY, {
        id: "division",
        header: "Bidang",
        meta: {
          filter: { options: toFilterOptions([...divisions.map((division) => division.name), EMPTY]) },
          cellClassName: "text-fg-secondary",
        },
      }),

      col.accessor((assignment) => assignment.sub_unit.name, {
        id: "subUnit",
        header: "Sub Unit",
        meta: {
          search: { placeholder: "Cari sub unit..." },
          filter: { options: toFilterOptions(subUnits.map((subUnit) => subUnit.name)) },
          cellClassName: "text-fg-primary",
        },
      }),

      // Objek penempatan (bisa lebih dari satu) + kategorinya. Penugasan tanpa objek ditulis "-".
      // Accessor mengembalikan daftar nama objek, mis. ["Bungalow", "Pondokan"], supaya bisa dicari & difilter.
      col.accessor(
        (assignment) =>
          assignment.placement_objects.length > 0 ? assignment.placement_objects.map((item) => item.name) : [EMPTY],
        {
          id: "placementObjects",
          header: "Objek Penempatan",
          enableSorting: false,
          meta: {
            search: { placeholder: "Cari objek..." },
            filter: { options: toFilterOptions([...placementObjects.map((item) => item.name), EMPTY]) },
          },
          cell: ({ row }) => {
            const { placement_objects } = row.original;
            if (placement_objects.length === 0) return <span className="text-fg-tertiary">{EMPTY}</span>;

            return (
              <ul className="flex flex-col gap-1">
                {placement_objects.map((placementObject) => (
                  <li key={placementObject.id}>
                    <p className="text-fg-primary">{placementObject.name}</p>
                    <p className="typo-body-s text-fg-tertiary">{placementObject.category_name}</p>
                  </li>
                ))}
              </ul>
            );
          },
        },
      ),

      col.accessor("assignment_status", {
        header: "Status",
        meta: { filter: { options: toFilterOptions(ASSIGNMENT_STATUSES) }, nowrap: true },
        cell: ({ getValue }) => <AssignmentStatusBadge status={getValue()} />,
      }),

      // Atasan: "Nama (Jabatan)", bisa lebih dari satu
      col.accessor(
        (assignment) =>
          assignment.supervisors.map((supervisor) => supervisor.employee_name).join(", ") || EMPTY,
        {
          id: "supervisors",
          header: "Atasan Langsung",
          enableSorting: false,
          meta: { search: { placeholder: "Cari atasan..." } },
          cell: ({ row }) => {
            if (row.original.supervisors.length === 0) return <span className="text-fg-tertiary">{EMPTY}</span>;

            return (
              <ul className="flex flex-col gap-1">
                {row.original.supervisors.map((supervisor) => (
                  <li key={supervisor.assignment_id}>
                    <p className="text-fg-primary">{supervisor.employee_name}</p>
                    <p className="typo-body-s text-fg-tertiary">{supervisor.position_title}</p>
                  </li>
                ))}
              </ul>
            );
          },
        },
      ),

      // Masa tugas: Aktif / Akan Datang / Selesai + TMT mulai – selesai
      col.accessor("period", {
        header: "Masa Tugas",
        meta: { filter: { options: toFilterOptions(ASSIGNMENT_PERIODS) }, nowrap: true },
        cell: ({ row }) => <AssignmentPeriodBadge {...row.original} />,
      }),

      // Nomor dokumen dasar + jenisnya (SK / Memo / ...)
      col.accessor((assignment) => assignment.decree_number ?? EMPTY, {
        id: "decreeNumber",
        header: "No. Dokumen",
        meta: { search: { placeholder: "Cari nomor..." }, nowrap: true },
        cell: ({ row }) => {
          const { decree_number, decree_type, decree_date } = row.original;
          if (!decree_number) return <span className="text-fg-tertiary">{EMPTY}</span>;

          return (
            <>
              <p className="typo-label-m text-fg-primary">{decree_number}</p>
              <p className="typo-body-s text-fg-tertiary">
                {decree_type ?? "Dokumen"}
                {decree_date && ` · ${formatDate(decree_date)}`}
              </p>
              {/* Penugasan hasil mutasi: link ke usulan mutasinya */}
              {row.original.transfer && (
                <Link
                  href={`/dashboard/mutasi/${row.original.transfer.id}`}
                  className="typo-body-s font-medium text-fg-brand hover:underline"
                >
                  Lihat usulan mutasi
                </Link>
              )}
            </>
          );
        },
      }),

      // Link untuk membuka file dokumen (PDF / gambar) di tab baru
      col.display({
        id: "decreeFile",
        header: "Dokumen",
        meta: { nowrap: true },
        cell: ({ row }) => {
          const { decree_file, decree_file_url } = row.original;
          if (!decree_file || !decree_file_url) {
            return <span className="typo-body-s text-fg-tertiary">Belum diunggah</span>;
          }

          return (
            <a
              href={decree_file_url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Buka ${decree_file.name}`}
              className="inline-flex items-center gap-1.5 font-medium text-fg-brand hover:underline"
            >
              <FileText className="size-4 shrink-0" />
              Lihat dokumen
            </a>
          );
        },
      }),

      col.display({
        id: "actions",
        header: "Aksi",
        enableSorting: false,
        meta: { width: "w-16" },
        cell: ({ row }) => (
          <AssignmentRowActions
            assignment={row.original}
            onChangeSupervisor={onChangeSupervisor}
            onShowHistory={onShowHistory}
          />
        ),
      }),
    ]),
  });
}

interface JabatanKaryawanTableProps extends JabatanKaryawanTableConfigOptions {
  assignments: AssignmentResource[];
  /** Penugasan yang sedang dicentang */
  selection: RowSelection;
}

/** Tabel jabatan karyawan. Cari, filter, urut, halaman, dan kotak centang diurus oleh DataTable. */
export function JabatanKaryawanTable({
  assignments,
  selection,
  positions,
  divisions,
  subUnits,
  placementObjects,
  onChangeSupervisor,
  onShowHistory,
}: JabatanKaryawanTableProps) {
  // Konfigurasi hanya dibuat ulang kalau datanya berubah.
  const config = useMemo(
    () =>
      createJabatanKaryawanTableConfig({
        positions,
        divisions,
        subUnits,
        placementObjects,
        onChangeSupervisor,
        onShowHistory,
      }),
    [positions, divisions, subUnits, placementObjects, onChangeSupervisor, onShowHistory],
  );

  return <DataTable config={config} data={assignments} selection={selection} />;
}
