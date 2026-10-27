"use client";

import { useMemo } from "react";
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
import { minutesToHours, SOURCE_LABELS } from "@/lib/attendance-rules";
import { DW_TARGET_STATUSES, formatDifference } from "@/lib/dw-overtime-rules";
import { formatRupiah } from "@/lib/wage-rules";
import type { AttendanceSource } from "@/types/api/attendance";
import type { DwOvertimeTargetRow } from "@/types/api/dw-overtime";

const col = createDataTableColumnHelper<DwOvertimeTargetRow>();

/** Isi sel kosong. */
const EMPTY = "-";

/** Pilihan filter dari isi kolom: nilai unik, urut abjad. */
const optionsFromValues = (values: string[]) => toFilterOptions([...new Set(values)].sort());

/** Urutan sumber di kolom Sumber. */
const SOURCE_ORDER = ["import_excel", "rekomendasi_sistem", "manual", "mobile"] as const satisfies AttendanceSource[];

/** Asal baris lembur DW, mis. "Excel 2 · Manual 1". Belum ada baris = "-". */
function describeSources(sources: DwOvertimeTargetRow["sources"]): string {
  const parts = SOURCE_ORDER.filter((source) => sources[source] > 0).map((source) => `${SOURCE_LABELS[source]} ${sources[source]}`);
  return parts.length > 0 ? parts.join(" · ") : EMPTY;
}

/**
 * Kolom-kolom tabel TARGET vs UPAH LEMBUR DW:
 *
 *   ☐ | No | Nama + No. Reg (cari) | Jabatan | Sub Unit / AFD | Kelompok Upah | Hari DW | Rp/hari | Target
 *     | Jam DW | Upah Lembur DW | Selisih (urut) | Status (filter) | Sumber
 */
const dwTargetTableConfig = defineTableConfig<DwOvertimeTargetRow>({
  getRowId: (row) => row.id,
  defaultSorting: [{ id: "name", desc: false }],
  emptyMessage: "Tidak ada karyawan yang cocok dengan pencarian atau filter.",
  tableClassName: "min-w-400",
  columns: col.columns([
    selectColumn<DwOvertimeTargetRow>((row) => row.name),
    rowNumberColumn<DwOvertimeTargetRow>(),

    col.accessor((row) => `${row.name} ${row.registration_number ?? ""}`, {
      id: "name",
      header: "Nama",
      meta: { search: { placeholder: "Cari nama / no. reg..." }, width: "min-w-56" },
      cell: ({ row }) => (
        <>
          <p className="font-medium text-fg-heading">{row.original.name}</p>
          <p className="typo-body-s text-fg-tertiary">{row.original.registration_number ?? "tanpa No. Registrasi"}</p>
        </>
      ),
    }),

    col.accessor((row) => row.position ?? EMPTY, {
      id: "position",
      header: "Jabatan",
      meta: { filter: { options: optionsFromValues }, width: "min-w-48" },
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

    col.accessor((row) => row.payroll_group?.name ?? EMPTY, {
      id: "payrollGroup",
      header: "Kelompok Upah",
      meta: { filter: { options: optionsFromValues }, nowrap: true },
    }),

    col.accessor("dw_days", {
      header: "Hari DW",
      meta: { alignRight: true, nowrap: true },
    }),

    col.accessor((row) => row.daily_rate ?? -1, {
      id: "dailyRate",
      header: "Rp/hari",
      meta: { alignRight: true, nowrap: true },
      cell: ({ row }) => (row.original.daily_rate === null ? EMPTY : formatRupiah(row.original.daily_rate)),
    }),

    col.accessor("target_amount", {
      header: "Target",
      meta: { alignRight: true, nowrap: true, cellClassName: "font-medium text-fg-heading" },
      cell: ({ getValue }) => formatRupiah(getValue()),
    }),

    col.accessor("dw_minutes", {
      header: "Jam DW",
      meta: { alignRight: true, nowrap: true },
      cell: ({ row }) => `${minutesToHours(row.original.dw_minutes)} jam`,
    }),

    col.accessor("dw_pay", {
      header: "Upah Lembur DW",
      meta: { alignRight: true, nowrap: true, cellClassName: "font-medium text-fg-heading" },
      cell: ({ getValue }) => formatRupiah(getValue()),
    }),

    // Urut selisih: yang paling kurang di atas (urut naik).
    col.accessor("difference", {
      header: "Selisih",
      meta: { alignRight: true, nowrap: true },
      cell: ({ getValue }) => (
        <span className={getValue() < 0 ? "text-fg-warning" : "text-fg-secondary"}>{formatDifference(getValue())}</span>
      ),
    }),

    col.accessor((row) => DW_TARGET_STATUSES[row.status].label, {
      id: "status",
      header: "Status",
      meta: { filter: { options: optionsFromValues }, nowrap: true },
      cell: ({ row }) => {
        const status = DW_TARGET_STATUSES[row.original.status];
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    }),

    col.accessor((row) => describeSources(row.sources), {
      id: "sources",
      header: "Sumber",
      enableSorting: false,
      meta: { nowrap: true, cellClassName: "text-fg-secondary" },
    }),
  ]),
});

interface DwTargetTableProps {
  rows: DwOvertimeTargetRow[];
  /** Centang baris -> Hitung Rekomendasi untuk karyawan yang dicentang */
  selection: RowSelection;
}

/** Tabel Target vs Upah Lembur DW per karyawan. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function DwTargetTable({ rows, selection }: DwTargetTableProps) {
  // Konfigurasi tidak bergantung pada apa pun, jadi cukup satu untuk semua render.
  const config = useMemo(() => dwTargetTableConfig, []);

  return <DataTable config={config} data={rows} selection={selection} />;
}
