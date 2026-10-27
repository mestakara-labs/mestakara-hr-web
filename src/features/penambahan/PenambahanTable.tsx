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
import { ACTIVATION_STATUS, ACTIVATION_STATUSES, ACTIVATION_TYPES } from "@/lib/activation-rules";
import { formatDate } from "@/lib/date";
import type { ActivationResource } from "@/types/api/employee-activation";

import { ActivationStatusBadge } from "./ActivationStatusBadge";

/** Satu baris tabel daftar usulan penambahan. */
interface ActivationRow {
  activation: ActivationResource;
  createdDate: string;
  /** Nama karyawan, mis. "Asep, Rina, +3 lainnya" */
  employees: string;
  /** Jenis penambahan di usulan ini, mis. "Penerimaan Baru, Mutasi Masuk" */
  types: string;
  status: string;
}

function toRow(activation: ActivationResource): ActivationRow {
  const names = activation.items.map((item) => item.employee.name);
  const shown = names.slice(0, 2).join(", ");
  return {
    activation,
    createdDate: activation.created_at.slice(0, 10),
    employees: names.length > 2 ? `${shown}, +${names.length - 2} lainnya` : shown || "-",
    types: [...new Set(activation.items.map((item) => item.type))].join(", ") || "-",
    status: activation.status,
  };
}

const col = createDataTableColumnHelper<ActivationRow>();

/**
 * Kolom tabel Daftar Usulan Penambahan:
 *   No | Dibuat | Karyawan (jumlah) | Dasar Penambahan (filter) | Dokumen | Status (filter) | Aksi
 */
const penambahanTableConfig = defineTableConfig<ActivationRow>({
  getRowId: (row) => row.activation.id,
  emptyMessage: "Belum ada usulan penambahan karyawan.",
  tableClassName: "min-w-240",
  columns: col.columns([
    rowNumberColumn<ActivationRow>(),

    col.accessor("createdDate", {
      header: "Dibuat",
      meta: { nowrap: true },
      cell: ({ row }) => (
        <>
          <p className="text-fg-primary">{formatDate(row.original.createdDate)}</p>
          <p className="typo-body-s text-fg-tertiary">{row.original.activation.created_by}</p>
        </>
      ),
    }),

    col.accessor("employees", {
      header: "Karyawan",
      meta: { search: { placeholder: "Cari nama..." }, width: "min-w-56" },
      cell: ({ row }) => (
        <Link
          href={`/dashboard/penambahan/${row.original.activation.id}`}
          className="font-medium text-fg-heading hover:text-fg-brand hover:underline"
        >
          {row.original.employees}
          <span className="block typo-body-s font-normal text-fg-tertiary">{row.original.activation.items.length} orang</span>
        </Link>
      ),
    }),

    col.accessor("types", {
      header: "Dasar Penambahan",
      meta: { filter: { options: toFilterOptions(ACTIVATION_TYPES) }, cellClassName: "text-fg-primary" },
    }),

    col.accessor((row) => row.activation.missing_document_count, {
      id: "documents",
      header: "Dokumen",
      meta: { nowrap: true },
      cell: ({ row }) => {
        const { document_scope, missing_document_count } = row.original.activation;
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
        const { id, status } = row.original.activation;
        return status === ACTIVATION_STATUS.draft ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/penambahan/${id}/edit`}>
              <Pencil />
              Lanjutkan
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/penambahan/${id}`}>
              <Eye />
              Lihat Detail
            </Link>
          </Button>
        );
      },
    }),
  ]),
});

/** Tabel Daftar Usulan Penambahan. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function PenambahanTable({ activations }: { activations: ActivationResource[] }) {
  return <DataTable config={penambahanTableConfig} data={activations.map(toRow)} />;
}
