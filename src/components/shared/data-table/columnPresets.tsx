"use client";

import type { RowData } from "@tanstack/react-table";

import { RowActions } from "@/components/shared/RowActions";
import { formatJobGrade } from "@/lib/position-rules";

import { createDataTableColumnHelper, type DataTableColumnDef, type FilterOption } from "./dataTableFeatures";
import { RowCheckbox } from "./RowSelectionCheckbox";

/**
 * Kolom siap pakai yang muncul di banyak tabel: kotak centang, nomor urut, dan menu aksi.
 * Kolom lain cukup ditulis biasa dengan `createDataTableColumnHelper`.
 */

/** Ubah daftar teks menjadi pilihan daftar centang, mis. ["BRM-1"] -> [{ value: "BRM-1", label: "BRM-1" }]. */
export function toFilterOptions(values: string[]): FilterOption[] {
  return values.map((value) => ({ value, label: value }));
}

/** Id kolom kotak centang. Judul kolom ini diganti kotak "pilih semua di halaman ini". */
export const SELECT_COLUMN_ID = "select";

/**
 * Kolom KOTAK CENTANG untuk memilih baris. Taruh paling kiri, dan isi prop
 * `selection` di <DataTable> supaya pilihannya tersimpan.
 *
 * @param label  nama baris untuk pembaca layar, mis. (karyawan) => karyawan.name
 */
export function selectColumn<TRow extends RowData>(label: (row: TRow) => string): DataTableColumnDef<TRow> {
  const col = createDataTableColumnHelper<TRow>();

  return col.display({
    id: SELECT_COLUMN_ID,
    header: "Pilih",
    enableSorting: false,
    meta: { width: "w-10" },
    cell: ({ row }) => <RowCheckbox rowId={row.id} label={label(row.original)} />,
  });
}

/**
 * Kolom nomor urut (No). Nomornya mengikuti posisi baris yang TAMPIL,
 * jadi tetap 1, 2, 3, ... walaupun tabel sedang diurutkan atau difilter,
 * dan berlanjut di halaman berikutnya (11, 12, ...).
 */
export function rowNumberColumn<TRow extends RowData>(): DataTableColumnDef<TRow> {
  const col = createDataTableColumnHelper<TRow>();

  return col.display({
    id: "rowNumber",
    header: "No",
    enableSorting: false,
    meta: { width: "w-14", nowrap: true, cellClassName: "text-fg-tertiary" },
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.store.state.pagination;
      const positionInPage = table.getRowModel().rows.indexOf(row);
      return pageIndex * pageSize + positionInPage + 1;
    },
  });
}

interface ActionsColumnOptions<TRow> {
  /** Dibacakan pembaca layar, mis. (bidang) => `Aksi untuk ${bidang.name}` */
  label: (row: TRow) => string;
  /** Opsional: alamat halaman detail, mis. (karyawan) => `/dashboard/karyawan/${karyawan.id}` */
  viewHref?: (row: TRow) => string;
  /** Alamat halaman edit, mis. (bidang) => `/dashboard/organisasi/bidang/${bidang.id}/edit` */
  editHref: (row: TRow) => string;
  onDelete: (row: TRow) => void;
}

/** Kolom paling kanan berisi tombol titik tiga ((Lihat Detail) / Edit / Hapus). */
export function actionsColumn<TRow extends RowData>({
  label,
  viewHref,
  editHref,
  onDelete,
}: ActionsColumnOptions<TRow>): DataTableColumnDef<TRow> {
  const col = createDataTableColumnHelper<TRow>();

  return col.display({
    id: "actions",
    header: "Aksi",
    enableSorting: false,
    meta: { width: "w-16" },
    cell: ({ row }) => (
      <RowActions
        label={label(row.original)}
        viewHref={viewHref?.(row.original)}
        editHref={editHref(row.original)}
        onDelete={() => onDelete(row.original)}
      />
    ),
  });
}

/**
 * Pilihan filter Job Grade dari data: grade yang ada, urut angka, lalu "-" (belum diisi).
 *   ["14", "", "2", "14"] -> 2, 14, - (belum diisi)
 */
function jobGradeFilterOptions(values: string[]): FilterOption[] {
  const grades = values.filter((value) => value !== "").sort((a, b) => Number(a) - Number(b));
  const options = grades.map((grade) => ({ value: grade, label: grade }));
  return values.includes("") ? [...options, { value: "", label: "- (belum diisi)" }] : options;
}

/**
 * Kolom JOB GRADE jabatan (angka 1–99). Bisa diurutkan & difilter (daftar centang berisi grade
 * yang ada di data + "- (belum diisi)"). Jabatan tanpa grade tampil "-" dan selalu di urutan
 * paling bawah, baik urut naik maupun turun.
 *
 * @param getGrade  Job Grade baris ini, mis. (penugasan) => penugasan.position.job_grade
 */
export function jobGradeColumn<TRow extends RowData>(
  getGrade: (row: TRow) => number | null | undefined,
): DataTableColumnDef<TRow> {
  const col = createDataTableColumnHelper<TRow>();

  return col.accessor((row) => getGrade(row) ?? undefined, {
    id: "jobGrade",
    header: "Job Grade",
    sortUndefined: "last",
    meta: { filter: { options: jobGradeFilterOptions }, nowrap: true, cellClassName: "text-fg-primary" },
    cell: ({ getValue }) => formatJobGrade(getValue()),
  });
}
