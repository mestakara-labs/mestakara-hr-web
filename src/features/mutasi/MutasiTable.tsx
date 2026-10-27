"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@mestakara/ui/button";

import {
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  rowNumberColumn,
  toFilterOptions,
} from "@/components/shared/data-table";
import { formatDate, formatDateTime } from "@/lib/date";
import { TRANSFER_STATUSES, TRANSFER_TYPES } from "@/lib/transfer-rules";
import type { TransferResource } from "@/types/api/transfer";

import { TransferStatusBadge } from "./TransferStatusBadge";

const col = createDataTableColumnHelper<TransferResource>();

/**
 * Kolom-kolom tabel usulan mutasi:
 *
 *   No | No. SK (cari, urut) | Jenis (filter) | Karyawan (cari) | TMT Berlaku (urut)
 *      | Status (filter) | Dibuat (urut) | Aksi
 */
const transferTableConfig = defineTableConfig<TransferResource>({
  getRowId: (transfer) => transfer.id,
  emptyMessage: "Belum ada usulan mutasi yang cocok dengan pencarian atau filter.",
  tableClassName: "min-w-240",
  columns: col.columns([
    rowNumberColumn<TransferResource>(),

    col.accessor((transfer) => transfer.decree_number ?? "-", {
      id: "decreeNumber",
      header: "No. SK",
      meta: { search: { placeholder: "Cari nomor..." }, nowrap: true },
      cell: ({ row }) => (
        <>
          <p className="typo-label-m text-fg-heading">{row.original.decree_number ?? "Belum diisi"}</p>
          <p className="typo-body-s text-fg-tertiary">{formatDate(row.original.decree_date) || "-"}</p>
        </>
      ),
    }),

    col.accessor("type", {
      header: "Jenis",
      meta: { filter: { options: toFilterOptions(TRANSFER_TYPES) }, nowrap: true },
    }),

    // Accessor = nama-nama karyawan, supaya bisa dicari per nama.
    col.accessor((transfer) => transfer.items.map((item) => item.employee.name).join(", "), {
      id: "employees",
      header: "Karyawan",
      enableSorting: false,
      meta: { search: { placeholder: "Cari karyawan..." } },
      cell: ({ row }) => {
        const names = row.original.items.map((item) => item.employee.name);
        return (
          <>
            <p className="text-fg-primary">{names.slice(0, 2).join(", ")}</p>
            {names.length > 2 && <p className="typo-body-s text-fg-tertiary">+ {names.length - 2} karyawan lain</p>}
          </>
        );
      },
    }),

    col.accessor((transfer) => transfer.effective_date ?? "", {
      id: "effectiveDate",
      header: "TMT Berlaku",
      meta: { nowrap: true, cellClassName: "text-fg-secondary" },
      cell: ({ getValue }) => formatDate(getValue()) || "-",
    }),

    col.accessor("status", {
      header: "Status",
      meta: { filter: { options: toFilterOptions(TRANSFER_STATUSES) }, nowrap: true },
      cell: ({ getValue }) => <TransferStatusBadge status={getValue()} />,
    }),

    col.accessor("created_at", {
      header: "Dibuat",
      meta: { nowrap: true },
      cell: ({ row }) => (
        <>
          <p className="text-fg-secondary">{formatDateTime(row.original.created_at)}</p>
          <p className="typo-body-s text-fg-tertiary">{row.original.created_by}</p>
        </>
      ),
    }),

    col.display({
      id: "actions",
      header: "Aksi",
      enableSorting: false,
      meta: { width: "w-24" },
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/mutasi/${row.original.id}`}>
            <Eye />
            Lihat
          </Link>
        </Button>
      ),
    }),
  ]),
});

/** Tabel usulan mutasi. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function MutasiTable({ transfers }: { transfers: TransferResource[] }) {
  return <DataTable config={transferTableConfig} data={transfers} />;
}
