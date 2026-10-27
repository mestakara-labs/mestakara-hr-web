"use client";

import { useMemo } from "react";
import { Badge } from "@mestakara/ui/badge";

import {
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  rowNumberColumn,
  toFilterOptions,
} from "@/components/shared/data-table";
import { RowActions } from "@/components/shared/RowActions";
import { formatMinutes, SOURCE_LABELS } from "@/lib/attendance-rules";
import { formatDate } from "@/lib/date";
import type { OvertimeEntryRow } from "@/types/api/attendance";

const col = createDataTableColumnHelper<OvertimeEntryRow>();

/** Isi sel kosong. */
const EMPTY = "-";

/** Pilihan filter dari isi kolom: nilai unik, urut abjad. */
const optionsFromValues = (values: string[]) => toFilterOptions([...new Set(values)].sort());

/**
 * Kolom-kolom tabel DAFTAR LEMBUR (dipakai tab Lembur Reguler & Lembur DW):
 *
 *   No | Tanggal (urut) | Nama + No. Reg (cari) | Jabatan | Status | Sub Unit / AFD | Objek | Kelompok Upah
 *      | Cost Center | Uraian Cost Center | Jam | Durasi (urut) | Uraian Pekerjaan (cari) | Sumber (filter) | Catatan (peringatan)
 *      | Aksi (Edit / Hapus; tidak ada kalau periode dikunci)
 */
function createOvertimeTableConfig(actions: OvertimeRowActions | null) {
  return defineTableConfig<OvertimeEntryRow>({
    getRowId: (row) => row.id,
    defaultSorting: [{ id: "date", desc: false }],
    emptyMessage: "Tidak ada lembur yang cocok dengan pencarian atau filter.",
    tableClassName: "min-w-560",
    columns: col.columns([
      rowNumberColumn<OvertimeEntryRow>(),

      // Accessor "YYYY-MM-DD" supaya urutannya benar.
      col.accessor("date", {
        header: "Tanggal",
        meta: { nowrap: true },
        cell: ({ getValue }) => formatDate(getValue()),
      }),

      col.accessor((row) => `${row.employee.name} ${row.employee.registration_number ?? ""}`, {
        id: "name",
        header: "Nama",
        meta: { search: { placeholder: "Cari nama / no. reg..." }, width: "min-w-56" },
        cell: ({ row }) => (
          <>
            <p className="font-medium text-fg-heading">{row.original.employee.name}</p>
            <p className="typo-body-s text-fg-tertiary">{row.original.employee.registration_number ?? "tanpa No. Registrasi"}</p>
          </>
        ),
      }),

      col.accessor((row) => row.position ?? EMPTY, {
        id: "position",
        header: "Jabatan",
        meta: { filter: { options: optionsFromValues }, width: "min-w-48" },
      }),

      col.accessor((row) => row.employee.employment_status.replace("Karyawan ", ""), {
        id: "status",
        header: "Status",
        meta: { filter: { options: optionsFromValues }, nowrap: true },
      }),

      col.accessor((row) => row.sub_unit?.name ?? EMPTY, {
        id: "subUnit",
        header: "Sub Unit",
        meta: { filter: { options: optionsFromValues }, nowrap: true },
        cell: ({ row }) => (
          <>
            <p>{row.original.sub_unit?.name ?? EMPTY}</p>
            {row.original.sub_unit?.afdeling_code && (
              <p className="typo-body-s text-fg-tertiary">{row.original.sub_unit.afdeling_code}</p>
            )}
          </>
        ),
      }),

      col.accessor((row) => (row.placement_objects.length > 0 ? row.placement_objects.map((item) => item.name) : [EMPTY]), {
        id: "objects",
        header: "Objek Penempatan",
        enableSorting: false,
        meta: { filter: { options: optionsFromValues } },
        cell: ({ getValue }) => getValue().join(", "),
      }),

      col.accessor((row) => row.payroll_group?.name ?? EMPTY, {
        id: "payrollGroup",
        header: "Kelompok Upah",
        meta: { filter: { options: optionsFromValues }, nowrap: true },
      }),

      col.accessor((row) => row.cost_center?.code ?? EMPTY, {
        id: "costCenter",
        header: "Cost Center",
        meta: { filter: { options: optionsFromValues }, nowrap: true },
      }),

      col.accessor((row) => row.cost_center?.name ?? EMPTY, {
        id: "costCenterName",
        header: "Uraian Cost Center",
        meta: { width: "min-w-48" },
      }),

      // Jam selesai keesokan harinya ditandai "+1".
      col.accessor((row) => `${row.start_time}–${row.end_time}${row.crosses_midnight ? " (+1)" : ""}`, {
        id: "time",
        header: "Jam",
        enableSorting: false,
        meta: { nowrap: true },
      }),

      col.accessor("duration_minutes", {
        header: "Durasi",
        meta: { alignRight: true, nowrap: true },
        cell: ({ getValue }) => formatMinutes(getValue()),
      }),

      col.accessor("description", {
        header: "Uraian Pekerjaan",
        enableSorting: false,
        meta: { search: { placeholder: "Cari uraian..." }, width: "min-w-64", cellClassName: "text-fg-secondary" },
      }),

      col.accessor((row) => SOURCE_LABELS[row.source], {
        id: "source",
        header: "Sumber",
        meta: { filter: { options: optionsFromValues }, nowrap: true },
        cell: ({ getValue }) => <Badge variant="neutral" dot={false}>{getValue()}</Badge>,
      }),

      // Accessor = jumlah peringatan, supaya bisa diurutkan (yang bermasalah di atas).
      col.accessor((row) => row.warnings.length, {
        id: "notes",
        header: "Catatan",
        meta: { width: "min-w-56" },
        cell: ({ row }) =>
          row.original.warnings.length === 0 ? (
            <span className="text-fg-tertiary">{EMPTY}</span>
          ) : (
            row.original.warnings.map((warning) => (
              <p key={warning} className="typo-body-s text-fg-warning">
                {warning}
              </p>
            ))
          ),
      }),

      ...(actions
        ? [
            col.display({
              id: "actions",
              header: "Aksi",
              enableSorting: false,
              meta: { width: "w-16" },
              cell: ({ row }) => (
                <RowActions
                  label={`Aksi untuk lembur ${row.original.employee.name} ${formatDate(row.original.date)}`}
                  onEdit={() => actions.onEdit(row.original)}
                  onDelete={() => actions.onDelete(row.original)}
                />
              ),
            }),
          ]
        : []),
    ]),
  });
}

/** Aksi per baris (Edit / Hapus). */
export interface OvertimeRowActions {
  onEdit: (row: OvertimeEntryRow) => void;
  onDelete: (row: OvertimeEntryRow) => void;
}

interface OvertimeEntryTableProps {
  rows: OvertimeEntryRow[];
  /** null = tanpa kolom Aksi (periode dikunci) */
  actions: OvertimeRowActions | null;
}

/** Tabel daftar lembur. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function OvertimeEntryTable({ rows, actions }: OvertimeEntryTableProps) {
  // Konfigurasi dibuat ulang hanya kalau aksinya berubah (aksi dibungkus useCallback/useMemo oleh pemanggil).
  const config = useMemo(() => createOvertimeTableConfig(actions), [actions]);

  return <DataTable config={config} data={rows} />;
}
