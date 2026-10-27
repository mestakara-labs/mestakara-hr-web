"use client";

import Link from "next/link";
import { Badge } from "@mestakara/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { ActivationStatusBadge } from "@/features/penambahan/ActivationStatusBadge";
import { StatusDocumentSummary } from "@/features/penambahan/StatusDocumentSummary";
import { useApiGet } from "@/hooks/useApiGet";
import { formatDate } from "@/lib/date";
import type { EmployeeStatusEvent } from "@/types/api/employee-activation";

import { EmptyText } from "./DetailParts";

/**
 * Tab RIWAYAT STATUS KEPEGAWAIAN di detail karyawan: setiap kali karyawan menjadi aktif
 * (Penambahan) atau nonaktif (Penonaktifan), terbaru di atas, beserta dokumen dasarnya.
 *
 *   TMT          | Kejadian                     | Keterangan        | Dokumen         | Status  | Usulan
 *   1 Okt 2026   | [Penambahan] Mutasi Masuk    | Unit asal: Reg 1  | SK No. ... 📄   | Berlaku | Lihat
 */
export function StatusHistoryTab({ employeeId }: { employeeId: string }) {
  const { data: events, loading, error } = useApiGet<EmployeeStatusEvent[]>(
    `/api/employees/${employeeId}/status-history`,
  );

  if (loading) return <PageLoading label="Memuat riwayat status..." />;
  if (error || !events) return <PageError message={error ?? "Riwayat status gagal dimuat."} />;
  if (events.length === 0) {
    return <EmptyText>Belum ada riwayat. Karyawan diaktifkan lewat menu Penambahan Karyawan.</EmptyText>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="min-w-240">
        <TableHeader>
          <TableRow>
            <TableHead>TMT</TableHead>
            <TableHead>Kejadian</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead>Dokumen Dasar</TableHead>
            <TableHead>Status Usulan</TableHead>
            <TableHead className="w-24">Usulan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={`${event.source_id}-${event.effective_date}-${event.type}`}>
              <TableCell className="whitespace-nowrap text-fg-heading">{formatDate(event.effective_date)}</TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <Badge variant={event.kind === "Penambahan" ? "success" : "neutral"} dot={false}>
                    {event.kind}
                  </Badge>
                  <span className="font-medium text-fg-heading">{event.type}</span>
                </div>
              </TableCell>
              <TableCell className="text-fg-secondary">{event.description ?? "-"}</TableCell>
              <TableCell>
                <StatusDocumentSummary document={event.document} />
              </TableCell>
              <TableCell>
                <ActivationStatusBadge status={event.status} />
              </TableCell>
              <TableCell>
                <Link href={event.source_url} className="font-medium text-fg-brand hover:underline">
                  Lihat
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
