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
import { minutesToHours, type EmployeeCategoryConfig } from "@/lib/attendance-rules";
import type { AttendanceSummaryRow } from "@/types/api/attendance";

const col = createDataTableColumnHelper<AttendanceSummaryRow>();

/** Isi sel kosong. */
const EMPTY = "-";

/** Pilihan filter dari isi kolom: nilai unik, urut abjad. */
const optionsFromValues = (values: string[]) => toFilterOptions([...new Set(values)].sort());

/**
 * Kolom-kolom tabel REKAP DAFTAR HADIR:
 *
 *   No | Nama + No. Reg (cari, klik = detail) | Jabatan | Status | Sub Unit / AFD | Objek | Kelompok Upah
 *      | Cost Center | Uraian Cost Center | K | DW | I | S | M | C | L | Kosong | Lembur Reguler (jam) | Lembur DW (jam) | Catatan (peringatan & konflik)
 *
 * Karyawan Daily Worker: tanpa kolom DW dan Lembur DW.
 */
function createRecapTableConfig(onOpen: (row: AttendanceSummaryRow) => void, category: EmployeeCategoryConfig) {
  return defineTableConfig<AttendanceSummaryRow>({
    getRowId: (row) => row.id,
    defaultSorting: [{ id: "name", desc: false }],
    emptyMessage: "Tidak ada karyawan yang cocok dengan pencarian atau filter.",
    tableClassName: "min-w-560",
    columns: col.columns([
      rowNumberColumn<AttendanceSummaryRow>(),

      // Nama (klik = panel detail absensi) + No. Registrasi. Bisa dicari dengan nama atau No. Registrasi.
      col.accessor((row) => `${row.name} ${row.registration_number ?? ""}`, {
        id: "name",
        header: "Nama",
        meta: { search: { placeholder: "Cari nama / no. reg..." }, width: "min-w-56" },
        cell: ({ row }) => (
          <>
            <button
              type="button"
              onClick={() => onOpen(row.original)}
              className="text-left font-medium text-fg-heading hover:underline"
            >
              {row.original.name}
            </button>
            <p className="typo-body-s text-fg-tertiary">{row.original.registration_number ?? "tanpa No. Registrasi"}</p>
          </>
        ),
      }),

      col.accessor((row) => row.position ?? EMPTY, {
        id: "position",
        header: "Jabatan",
        meta: { filter: { options: optionsFromValues }, width: "min-w-48" },
      }),

      // "Karyawan Casual" -> "Casual", supaya kolomnya tidak terlalu lebar.
      col.accessor((row) => row.employment_status.replace("Karyawan ", ""), {
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

      // Objek bisa lebih dari satu: filter mencocokkan salah satunya.
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

      // Satu kolom per kode, urut seperti template (K, DW, I, S, M, C, L).
      ...category.codes.map(({ code, label }) =>
        col.accessor((row) => row.codes[code], {
          id: `code${code}`,
          header: code,
          meta: { alignRight: true, nowrap: true, label: `${code} (${label})`, cellClassName: code === "K" ? "font-medium text-fg-heading" : "" },
        }),
      ),

      col.accessor("blank_days", {
        header: "Kosong",
        meta: { alignRight: true, nowrap: true, label: "Kosong (tidak masuk)" },
      }),

      col.accessor((row) => row.regular_overtime.minutes, {
        id: "regularOvertime",
        header: "Lembur Reguler",
        meta: { alignRight: true, nowrap: true },
        cell: ({ row }) => `${minutesToHours(row.original.regular_overtime.minutes)} jam`,
      }),

      ...(category.hasDwOvertime
        ? [
            col.accessor((row) => row.dw_overtime.minutes, {
              id: "dwOvertime",
              header: "Lembur DW",
              meta: { alignRight: true, nowrap: true },
              cell: ({ row }) => `${minutesToHours(row.original.dw_overtime.minutes)} jam`,
            }),
          ]
        : []),

      // Peringatan & konflik. Accessor = jumlahnya, supaya bisa diurutkan (yang bermasalah di atas).
      col.accessor((row) => row.warnings.length + row.conflict_count, {
        id: "notes",
        header: "Catatan",
        meta: { width: "min-w-56" },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.conflict_count > 0 && <Badge variant="info">{row.original.conflict_count} konflik</Badge>}
            {row.original.warnings.map((warning) => (
              <p key={warning} className="typo-body-s text-fg-warning">
                {warning}
              </p>
            ))}
            {row.original.warnings.length + row.original.conflict_count === 0 && <span className="text-fg-tertiary">{EMPTY}</span>}
          </div>
        ),
      }),
    ]),
  });
}

interface AttendanceRecapTableProps {
  rows: AttendanceSummaryRow[];
  /** Kategori karyawan (menentukan kolom kode & lembur) */
  category: EmployeeCategoryConfig;
  /** Dipanggil saat nama karyawan diklik (membuka panel detail) */
  onOpen: (row: AttendanceSummaryRow) => void;
}

/** Tabel rekap daftar hadir per karyawan. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function AttendanceRecapTable({ rows, category, onOpen }: AttendanceRecapTableProps) {
  // Konfigurasi dibuat sekali saja (bukan di setiap render) supaya tabel tidak di-reset.
  const config = useMemo(() => createRecapTableConfig(onOpen, category), [onOpen, category]);

  return <DataTable config={config} data={rows} />;
}
