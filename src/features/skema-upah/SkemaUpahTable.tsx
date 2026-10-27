"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@mestakara/ui/badge";

import {
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  rowNumberColumn,
  selectColumn,
  toFilterOptions,
  type RowSelection,
} from "@/components/shared/data-table";
import { formatDate } from "@/lib/date";
import { formatRupiah, WAGE_EMPLOYMENT_STATUSES, WAGE_TYPES } from "@/lib/wage-rules";
import type { WageEmployeeResource } from "@/types/api/wage";

import { SkemaUpahRowActions } from "./SkemaUpahRowActions";

const col = createDataTableColumnHelper<WageEmployeeResource>();

/** Isi sel kosong. */
const EMPTY = "-";
/** Tulisan Jenis Upah untuk karyawan yang skemanya belum diatur (juga pilihan filter). */
const UNSET = "Belum diatur";

/** Sel angka rupiah rata kanan; "-" kalau skema belum diatur. */
function rupiahCell(value: number | undefined) {
  return value === undefined ? <span className="text-fg-tertiary">{EMPTY}</span> : formatRupiah(value);
}

interface TableActions {
  onEdit: (row: WageEmployeeResource) => void;
  onShowHistory: (row: WageEmployeeResource) => void;
}

/**
 * Kolom-kolom tabel Skema Upah Karyawan:
 *
 *   ☐ | No | Nama + No. Reg (cari) | Jabatan (cari) | Status (filter) | Sub Unit / AFD (filter) | Objek (filter)
 *     | Jenis Upah (filter, "Belum diatur") | Gaji Pokok | HKE | Rp/hari | Batas Hari | Tunj. Operasional & Jabatan
 *     | Insentif | Uang Makan/hari | Kelompok (filter) | Berlaku Mulai | Aksi
 */
function createSkemaUpahTableConfig({ onEdit, onShowHistory }: TableActions) {
  return defineTableConfig<WageEmployeeResource>({
    getRowId: (row) => row.id,
    defaultSorting: [{ id: "name", desc: false }],
    emptyMessage: "Tidak ada karyawan yang cocok dengan pencarian atau filter.",
    tableClassName: "min-w-400",
    columns: col.columns([
      selectColumn<WageEmployeeResource>((row) => row.name),
      rowNumberColumn<WageEmployeeResource>(),

      // Nama (klik = detail karyawan) + No. Registrasi di bawahnya. Bisa dicari dengan nama atau No. Registrasi.
      col.accessor((row) => `${row.name} ${row.registration_number ?? ""}`, {
        id: "name",
        header: "Nama",
        meta: { search: { placeholder: "Cari nama / no. reg..." }, width: "min-w-56" },
        cell: ({ row }) => (
          <>
            <Link href={`/dashboard/karyawan/${row.original.id}`} className="font-medium text-fg-heading hover:underline">
              {row.original.name}
            </Link>
            <p className="typo-body-s text-fg-tertiary">{row.original.registration_number ?? "tanpa No. Registrasi"}</p>
          </>
        ),
      }),

      col.accessor((row) => row.position ?? EMPTY, {
        id: "position",
        header: "Jabatan",
        meta: { search: { placeholder: "Cari jabatan..." }, width: "min-w-48" },
      }),

      // "Karyawan Casual" -> "Casual", supaya kolomnya tidak terlalu lebar.
      col.accessor((row) => row.employment_status.replace("Karyawan ", ""), {
        id: "status",
        header: "Status",
        meta: { filter: { options: toFilterOptions(WAGE_EMPLOYMENT_STATUSES.map((status) => status.replace("Karyawan ", ""))) }, nowrap: true },
      }),

      col.accessor((row) => row.sub_unit?.name ?? EMPTY, {
        id: "subUnit",
        header: "Sub Unit",
        meta: { filter: { options: (values) => toFilterOptions([...new Set(values)].sort()) }, nowrap: true },
        cell: ({ row }) => (
          <>
            <p>{row.original.sub_unit?.name ?? EMPTY}</p>
            {row.original.sub_unit?.afdeling_code && (
              <p className="typo-body-s text-fg-tertiary">{row.original.sub_unit.afdeling_code}</p>
            )}
          </>
        ),
      }),

      // Objek bisa lebih dari satu: filter mencocokkan salah satunya.
      col.accessor((row) => (row.placement_objects.length > 0 ? row.placement_objects.map((item) => item.name) : [EMPTY]), {
        id: "objects",
        header: "Objek Penempatan",
        enableSorting: false,
        meta: { filter: { options: (values) => toFilterOptions([...new Set(values)].sort()) } },
        cell: ({ getValue }) => getValue().join(", "),
      }),

      col.accessor((row) => row.wage_scheme?.wage_type ?? UNSET, {
        id: "wageType",
        header: "Jenis Upah",
        meta: { filter: { options: toFilterOptions([...WAGE_TYPES, UNSET]) }, nowrap: true },
        cell: ({ getValue }) =>
          getValue() === UNSET ? <Badge variant="warning">{UNSET}</Badge> : <Badge variant="neutral" dot={false}>{getValue()}</Badge>,
      }),

      col.accessor((row) => row.wage_scheme?.base_salary, {
        id: "baseSalary",
        header: "Gaji Pokok",
        sortUndefined: "last",
        meta: { alignRight: true, nowrap: true },
        cell: ({ getValue }) => rupiahCell(getValue()),
      }),

      col.accessor((row) => row.wage_scheme?.working_days, {
        id: "workingDays",
        header: "HKE",
        sortUndefined: "last",
        meta: { alignRight: true, nowrap: true },
        cell: ({ getValue }) => getValue() ?? EMPTY,
      }),

      col.accessor((row) => row.daily_rate ?? undefined, {
        id: "dailyRate",
        header: "Rp/hari",
        sortUndefined: "last",
        meta: { alignRight: true, nowrap: true },
        cell: ({ getValue }) => rupiahCell(getValue()),
      }),

      col.accessor((row) => (row.wage_scheme?.is_capped ? `Maks. ${row.wage_scheme.cap_days} hari` : EMPTY), {
        id: "cap",
        header: "Batas Hari",
        enableSorting: false,
        meta: { nowrap: true },
      }),

      col.accessor((row) => row.wage_scheme?.operational_position_allowance, {
        id: "operational",
        header: "Tunj. Operasional & Jabatan",
        sortUndefined: "last",
        meta: { alignRight: true, nowrap: true },
        cell: ({ getValue }) => rupiahCell(getValue()),
      }),

      col.accessor((row) => row.wage_scheme?.incentive, {
        id: "incentive",
        header: "Insentif",
        sortUndefined: "last",
        meta: { alignRight: true, nowrap: true },
        cell: ({ getValue }) => rupiahCell(getValue()),
      }),

      // Tidak diberi uang makan -> "-".
      col.accessor((row) => (row.wage_scheme?.has_meal_allowance ? row.wage_scheme.meal_allowance_per_day : undefined), {
        id: "meal",
        header: "Uang Makan/hari",
        sortUndefined: "last",
        meta: { alignRight: true, nowrap: true },
        cell: ({ getValue }) => rupiahCell(getValue()),
      }),

      col.accessor((row) => row.wage_scheme?.payroll_group?.name ?? EMPTY, {
        id: "group",
        header: "Kelompok",
        meta: { filter: { options: (values) => toFilterOptions([...new Set(values)].sort()) }, nowrap: true },
      }),

      // Accessor mengembalikan "YYYY-MM-DD" supaya urutannya benar.
      col.accessor((row) => row.wage_scheme?.effective_date, {
        id: "effectiveDate",
        header: "Berlaku Mulai",
        sortUndefined: "last",
        meta: { nowrap: true },
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() ?? null) : EMPTY),
      }),

      col.display({
        id: "actions",
        header: "Aksi",
        enableSorting: false,
        meta: { width: "w-16" },
        cell: ({ row }) => <SkemaUpahRowActions row={row.original} onEdit={onEdit} onShowHistory={onShowHistory} />,
      }),
    ]),
  });
}

interface SkemaUpahTableProps extends TableActions {
  rows: WageEmployeeResource[];
  selection: RowSelection;
}

/** Tabel Skema Upah Karyawan. Cari, filter, urut, halaman, dan centang baris diurus oleh DataTable. */
export function SkemaUpahTable({ rows, selection, onEdit, onShowHistory }: SkemaUpahTableProps) {
  // Konfigurasi dibuat sekali saja (bukan di setiap render) supaya tabel tidak di-reset.
  const config = useMemo(() => createSkemaUpahTableConfig({ onEdit, onShowHistory }), [onEdit, onShowHistory]);

  return <DataTable config={config} data={rows} selection={selection} />;
}
