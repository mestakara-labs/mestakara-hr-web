"use client";

import { useMemo } from "react";
import { FileText, MoreVertical, Wallet } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mestakara/ui/dropdown-menu";

import {
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  rowNumberColumn,
  selectColumn,
  toFilterOptions,
  type RowSelection,
} from "@/components/shared/data-table";
import { formatRupiah } from "@/lib/wage-rules";
import type { PayrollRow } from "@/types/api/payroll";

const col = createDataTableColumnHelper<PayrollRow>();

/** Isi sel kosong. */
const EMPTY = "-";

/** Pilihan filter dari isi kolom: nilai unik, urut abjad. */
const optionsFromValues = (values: string[]) => toFilterOptions([...new Set(values)].sort());

/** Kolom rupiah rata kanan; `key` = nama isian angka di PayrollRow. */
function rupiahColumn(
  key: "base_pay" | "overtime_pay" | "operational_allowance" | "incentive" | "meal_allowance" | "gross" | "deductions_total" | "net",
  header: string,
  strong = false,
) {
  return col.accessor(key, {
    header,
    meta: { alignRight: true, nowrap: true, cellClassName: strong ? "font-medium text-fg-heading" : "" },
    cell: ({ getValue }) => formatRupiah(getValue()),
  });
}

interface TableActions {
  /** Nama kelompok dari kuncinya (pengelompokan yang sedang dipilih) */
  groupNameOf: (key: string) => string;
  onShowDetail: (row: PayrollRow) => void;
  /** null = periode dikunci (potongan tidak bisa diubah) */
  onEditDeductions: ((row: PayrollRow) => void) | null;
}

/**
 * Kolom tabel RINCIAN DAFTAR UPAH (satu baris per karyawan):
 *
 *   ☐ | No | Nama + No. Reg (cari) | Jabatan | Sub Unit / AFD | Kelompok (filter) | Cost Center | Rekening
 *     | HKE | Absen | Rp/HK | Gaji Upah | Lembur | Ops & Jab | Insentif | Uang Makan | Jumlah | Potongan | Diterima
 *     | Catatan | Aksi (Rincian Upah, Ubah Potongan)
 */
function createPayrollTableConfig({ groupNameOf, onShowDetail, onEditDeductions }: TableActions) {
  return defineTableConfig<PayrollRow>({
    getRowId: (row) => row.employee_id,
    defaultSorting: [{ id: "name", desc: false }],
    emptyMessage: "Tidak ada karyawan yang cocok dengan pencarian atau filter.",
    tableClassName: "min-w-560",
    columns: col.columns([
      selectColumn<PayrollRow>((row) => row.name),
      rowNumberColumn<PayrollRow>(),

      col.accessor((row) => `${row.name} ${row.registration_number ?? ""}`, {
        id: "name",
        header: "Nama",
        meta: { search: { placeholder: "Cari nama / no. reg..." }, width: "min-w-56" },
        cell: ({ row }) => (
          <>
            <button
              type="button"
              onClick={() => onShowDetail(row.original)}
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

      col.accessor((row) => groupNameOf(row.group_key), {
        id: "group",
        header: "Kelompok",
        meta: { filter: { options: optionsFromValues }, nowrap: true },
      }),

      col.accessor((row) => row.cost_center?.code ?? EMPTY, {
        id: "costCenter",
        header: "Cost Center",
        meta: { filter: { options: optionsFromValues }, nowrap: true },
        cell: ({ row }) => (
          <>
            <p>{row.original.cost_center?.code ?? EMPTY}</p>
            {row.original.cost_center && <p className="typo-body-s text-fg-tertiary">{row.original.cost_center.name}</p>}
          </>
        ),
      }),

      col.accessor((row) => row.bank_account?.account_number ?? EMPTY, {
        id: "bankAccount",
        header: "Rekening",
        enableSorting: false,
        meta: { nowrap: true },
        cell: ({ row }) =>
          row.original.bank_account ? (
            <>
              <p>{row.original.bank_account.account_number}</p>
              <p className="typo-body-s text-fg-tertiary">{row.original.bank_account.bank_name}</p>
            </>
          ) : (
            <span className="text-fg-warning">Belum ada</span>
          ),
      }),

      col.accessor("hke", { header: "HKE", meta: { alignRight: true, nowrap: true } }),
      col.accessor("present_days", { header: "Absen", meta: { alignRight: true, nowrap: true, label: "Absen (jumlah K)" } }),
      col.accessor("daily_rate", {
        header: "Rp/HK",
        meta: { alignRight: true, nowrap: true },
        cell: ({ getValue }) => formatRupiah(getValue()),
      }),

      rupiahColumn("base_pay", "Gaji Upah"),
      rupiahColumn("overtime_pay", "Lembur"),
      rupiahColumn("operational_allowance", "Ops & Jab"),
      rupiahColumn("incentive", "Insentif"),
      rupiahColumn("meal_allowance", "Uang Makan"),
      rupiahColumn("gross", "Jumlah", true),
      rupiahColumn("deductions_total", "Potongan"),
      rupiahColumn("net", "Diterima", true),

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

      col.display({
        id: "actions",
        header: "Aksi",
        enableSorting: false,
        meta: { width: "w-16" },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Aksi untuk ${row.original.name}`}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onShowDetail(row.original)}>
                <FileText />
                Rincian Upah
              </DropdownMenuItem>
              {onEditDeductions && (
                <DropdownMenuItem onSelect={() => onEditDeductions(row.original)}>
                  <Wallet />
                  Ubah Potongan
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ]),
  });
}

interface PayrollTableProps extends TableActions {
  rows: PayrollRow[];
  selection: RowSelection;
}

/** Tabel rincian Daftar Upah. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function PayrollTable({ rows, selection, groupNameOf, onShowDetail, onEditDeductions }: PayrollTableProps) {
  // Konfigurasi dibuat ulang hanya kalau aksinya berubah (dibungkus useCallback oleh halaman).
  const config = useMemo(
    () => createPayrollTableConfig({ groupNameOf, onShowDetail, onEditDeductions }),
    [groupNameOf, onShowDetail, onEditDeductions],
  );

  return <DataTable config={config} data={rows} selection={selection} />;
}
