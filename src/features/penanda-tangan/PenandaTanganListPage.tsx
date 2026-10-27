"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";

import { createDataTableColumnHelper, DataTable, defineTableConfig } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { describeSignatureSummary, SIGNATURE_OWNERS, type SignatureOwnerKind } from "@/lib/signature-rules";
import type { OwnerSignatureSummary, SignatureSummary } from "@/types/api/signature";

const col = createDataTableColumnHelper<OwnerSignatureSummary>();

/** Sel ringkasan susunan: "Memakai penanda tangan Umum" ditulis lebih pudar. */
function summaryCell(summary: SignatureSummary) {
  return <span className={summary ? "text-fg-primary" : "text-fg-tertiary"}>{describeSignatureSummary(summary)}</span>;
}

/**
 * Kolom tabel PENANDA TANGAN per Kelompok Daftar Upah / per Bidang:
 *
 *   Nama (cari) | Tempat | Daftar Upah | SPKL | [Atur]
 */
function createOwnerTableConfig(pagePath: string) {
  return defineTableConfig<OwnerSignatureSummary>({
    getRowId: (row) => row.id,
    emptyMessage: "Tidak ada yang cocok dengan pencarian.",
    tableClassName: "min-w-200",
    columns: col.columns([
      col.accessor("name", {
        header: "Nama",
        meta: { search: { placeholder: "Cari nama..." }, cellClassName: "font-medium text-fg-heading" },
      }),
      col.accessor((row) => row.place ?? "Memakai tempat Umum", {
        id: "place",
        header: "Tempat",
        meta: { nowrap: true },
        cell: ({ row, getValue }) => <span className={row.original.place ? "" : "text-fg-tertiary"}>{getValue()}</span>,
      }),
      col.accessor((row) => describeSignatureSummary(row.payroll), {
        id: "payroll",
        header: "Daftar Upah",
        enableSorting: false,
        meta: { nowrap: true },
        cell: ({ row }) => summaryCell(row.original.payroll),
      }),
      col.accessor((row) => describeSignatureSummary(row.spkl), {
        id: "spkl",
        header: "SPKL",
        enableSorting: false,
        meta: { nowrap: true },
        cell: ({ row }) => summaryCell(row.original.spkl),
      }),
      col.display({
        id: "actions",
        header: "Aksi",
        enableSorting: false,
        meta: { width: "w-24" },
        cell: ({ row }) => (
          <Button asChild size="sm" variant="outline">
            <Link href={`${pagePath}/${row.original.id}`}>
              <PenLine />
              Atur
            </Link>
          </Button>
        ),
      }),
    ]),
  });
}

/**
 * Halaman PENANDA TANGAN per Kelompok Daftar Upah / per Bidang: daftar semua kelompok / bidang
 * beserta ringkasan susunannya. "Atur" membuka halaman pengaturan satu kelompok / bidang.
 */
export function PenandaTanganListPage({ kind }: { kind: SignatureOwnerKind }) {
  const owner = SIGNATURE_OWNERS[kind];
  const { data: rows, loading, error } = useApiGet<OwnerSignatureSummary[]>(owner.apiPath);
  const config = useMemo(() => createOwnerTableConfig(owner.pagePath), [owner.pagePath]);

  return (
    <>
      <PageHeader
        title={`Penanda Tangan per ${owner.title}`}
        description={`Penanda tangan Daftar Upah & SPKL setiap ${owner.title.toLowerCase()}. Yang belum diatur memakai penanda tangan Umum.`}
      />

      {loading && <PageLoading label="Memuat penanda tangan..." />}
      {error && <PageError message={error} />}

      {rows && (
        <Card>
          <CardContent>
            <DataTable config={config} data={rows} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
