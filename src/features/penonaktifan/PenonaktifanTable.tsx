"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@mestakara/ui/button";

import {
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  rowNumberColumn,
  toFilterOptions,
} from "@/components/shared/data-table";
import { ActivationStatusBadge } from "@/features/penambahan/ActivationStatusBadge";
import { ACTIVATION_STATUS, ACTIVATION_STATUSES } from "@/lib/activation-rules";
import { formatDate } from "@/lib/date";
import { TERMINATION_TYPES } from "@/lib/termination-rules";
import type { TerminationResource } from "@/types/api/employee-termination";

/** Satu baris tabel daftar usulan penonaktifan. */
interface TerminationRow {
  termination: TerminationResource;
  createdDate: string;
  /** Nama karyawan, mis. "Asep, Rina, +3 lainnya" */
  employees: string;
  /** Jenis penonaktifan di usulan ini, mis. "Pensiun, PHK" */
  types: string;
  /** TMT paling awal, untuk diurutkan */
  firstDate: string;
  status: string;
}

function toRow(termination: TerminationResource): TerminationRow {
  const names = termination.items.map((item) => item.employee.name);
  const shown = names.slice(0, 2).join(", ");
  const dates = termination.items.map((item) => item.effective_date).filter(Boolean).sort();
  return {
    termination,
    createdDate: termination.created_at.slice(0, 10),
    employees: names.length > 2 ? `${shown}, +${names.length - 2} lainnya` : shown || "-",
    types: [...new Set(termination.items.map((item) => item.type).filter(Boolean))].join(", ") || "-",
    firstDate: dates[0] ?? "",
    status: termination.status,
  };
}

const col = createDataTableColumnHelper<TerminationRow>();

/**
 * Kolom tabel Daftar Usulan Penonaktifan:
 *   No | Dibuat | Karyawan (jumlah) | Jenis (filter) | TMT Nonaktif | Dokumen | Status (filter) | Aksi
 */
const penonaktifanTableConfig = defineTableConfig<TerminationRow>({
  getRowId: (row) => row.termination.id,
  emptyMessage: "Belum ada usulan penonaktifan karyawan.",
  tableClassName: "min-w-240",
  columns: col.columns([
    rowNumberColumn<TerminationRow>(),

    col.accessor("createdDate", {
      header: "Dibuat",
      meta: { nowrap: true },
      cell: ({ row }) => (
        <>
          <p className="text-fg-primary">{formatDate(row.original.createdDate)}</p>
          <p className="typo-body-s text-fg-tertiary">{row.original.termination.created_by}</p>
        </>
      ),
    }),

    col.accessor("employees", {
      header: "Karyawan",
      meta: { search: { placeholder: "Cari nama..." }, width: "min-w-56" },
      cell: ({ row }) => (
        <Link
          href={`/dashboard/penonaktifan/${row.original.termination.id}`}
          className="font-medium text-fg-heading hover:text-fg-brand hover:underline"
        >
          {row.original.employees}
          <span className="block typo-body-s font-normal text-fg-tertiary">{row.original.termination.items.length} orang</span>
        </Link>
      ),
    }),

    col.accessor("types", {
      header: "Jenis",
      meta: { filter: { options: toFilterOptions(TERMINATION_TYPES) }, cellClassName: "text-fg-primary" },
    }),

    col.accessor("firstDate", {
      header: "TMT Nonaktif",
      meta: { nowrap: true, cellClassName: "text-fg-primary" },
      cell: ({ getValue }) => (getValue() ? formatDate(getValue()) : "-"),
    }),

    col.accessor((row) => row.termination.missing_document_count, {
      id: "documents",
      header: "Dokumen",
      meta: { nowrap: true },
      cell: ({ row }) => {
        const { document_scope, missing_document_count } = row.original.termination;
        return (
          <>
            <p className="text-fg-primary">{document_scope}</p>
            {missing_document_count > 0 ? (
              <p className="typo-body-s text-fg-warning">{missing_document_count} belum diunggah</p>
            ) : (
              <p className="typo-body-s text-fg-success">Lengkap</p>
            )}
          </>
        );
      },
    }),

    col.accessor("status", {
      header: "Status",
      meta: { filter: { options: toFilterOptions(ACTIVATION_STATUSES) }, nowrap: true },
      cell: ({ getValue }) => <ActivationStatusBadge status={getValue()} />,
    }),

    col.display({
      id: "actions",
      header: "Aksi",
      enableSorting: false,
      meta: { nowrap: true },
      cell: ({ row }) => {
        const { id, status } = row.original.termination;
        return status === ACTIVATION_STATUS.draft ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/penonaktifan/${id}/edit`}>
              <Pencil />
              Lanjutkan
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/penonaktifan/${id}`}>
              <Eye />
              Lihat Detail
            </Link>
          </Button>
        );
      },
    }),
  ]),
});

/** Tabel Daftar Usulan Penonaktifan. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function PenonaktifanTable({ terminations }: { terminations: TerminationResource[] }) {
  return <DataTable config={penonaktifanTableConfig} data={terminations.map(toRow)} />;
}
