"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, ChevronLeft, Pencil, Trash2, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@mestakara/ui/card";
import { toast } from "@mestakara/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { toSignerOptions } from "@/features/jabatan-karyawan/assignment-options";
import { EmployeeActiveStatusBadge } from "@/features/karyawan/EmployeeActiveStatusBadge";
import { ActivationStatusBadge } from "@/features/penambahan/ActivationStatusBadge";
import { StatusDocumentSummary } from "@/features/penambahan/StatusDocumentSummary";
import { UploadDocumentDialog, type DocumentTarget } from "@/features/penambahan/UploadDocumentDialog";
import { useApiGet } from "@/hooks/useApiGet";
import { ACTIVATION_STATUS, DOCUMENT_SCOPE, EMPLOYEE_ACTIVE_STATUS } from "@/lib/activation-rules";
import { formatDate, formatDateTime } from "@/lib/date";
import { ApiError, apiDelete } from "@/lib/http-client";
import type { AssignmentResource } from "@/types/api/assignment";
import type { TerminationResource } from "@/types/api/employee-termination";

import { CancelTerminationDialog } from "./CancelTerminationDialog";
import { PENONAKTIFAN_URL } from "./PenonaktifanWizard";
import { TerminationImpactList } from "./TerminationImpactList";

/**
 * Halaman DETAIL USULAN PENONAKTIFAN KARYAWAN:
 *
 *   [←] Usulan Penonaktifan Karyawan  [Berlaku]               [Batalkan]   (Draf: [Lanjutkan] [Hapus Draf])
 *       Dibuat 14 Okt 2026 oleh Admin SDM · Berlaku 14 Okt 2026
 *   Dokumen Dasar: Kolektif — SK No. ... 📄   [Ganti Dokumen]
 *   No | Karyawan | Jenis | TMT Nonaktif | Keterangan | (Dokumen per orang) | Status Karyawan
 *   Dampak per karyawan (Draf: perkiraan; Berlaku: yang diterapkan)
 */
export function PenonaktifanDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const terminationRequest = useApiGet<TerminationResource>(`/api/employee-terminations/${id}`);
  const assignmentsRequest = useApiGet<AssignmentResource[]>("/api/position-assignments");
  const [documentTarget, setDocumentTarget] = useState<DocumentTarget | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  if (terminationRequest.loading) return <PageLoading label="Memuat usulan penonaktifan..." />;
  const termination = terminationRequest.data;
  if (terminationRequest.error || !termination) {
    return <PageError message={terminationRequest.error ?? "Usulan penonaktifan tidak ditemukan."} />;
  }

  const isDraft = termination.status === ACTIVATION_STATUS.draft;
  const isEffective = termination.status === ACTIVATION_STATUS.effective;
  const isCollective = termination.document_scope === DOCUMENT_SCOPE.collective;
  const signerOptions = toSignerOptions(assignmentsRequest.data ?? []);

  async function deleteDraft() {
    setDeleteBusy(true);
    try {
      const response = await apiDelete(`/api/employee-terminations/${id}`);
      toast.success(response.message);
      router.push(PENONAKTIFAN_URL);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Draf gagal dihapus.");
      setDeleteBusy(false);
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Judul + aksi */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
            <Link href={PENONAKTIFAN_URL} aria-label="Kembali">
              <ChevronLeft />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="typo-h3 text-fg-heading">Usulan Penonaktifan Karyawan</h1>
              <ActivationStatusBadge status={termination.status} />
            </div>
            <p className="mt-1 typo-body-m text-fg-secondary">
              Dibuat {formatDateTime(termination.created_at)} oleh {termination.created_by}
              {termination.activated_at && ` · Berlaku ${formatDateTime(termination.activated_at)}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <Button variant="outline" onClick={() => setIsDeleting(true)}>
                <Trash2 />
                Hapus Draf
              </Button>
              <Button asChild>
                <Link href={`${PENONAKTIFAN_URL}/${id}/edit`}>
                  <Pencil />
                  Lanjutkan
                </Link>
              </Button>
            </>
          )}
          {isEffective && (
            <Button variant="outline" onClick={() => setIsCancelling(true)}>
              <Ban />
              Batalkan Usulan
            </Button>
          )}
        </div>
      </div>

      {termination.status === ACTIVATION_STATUS.cancelled && (
        <Alert variant="warning">
          <AlertDescription>
            Dibatalkan {termination.cancelled_at && formatDateTime(termination.cancelled_at)} oleh {termination.cancelled_by}.
            Alasan: {termination.cancel_reason ?? "-"}
          </AlertDescription>
        </Alert>
      )}

      {/* Dokumen kolektif */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumen Dasar Penonaktifan — {termination.document_scope}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start justify-between gap-3">
          {isCollective ? (
            <StatusDocumentSummary document={termination.document} />
          ) : (
            <p className="typo-body-s text-fg-secondary">Setiap karyawan punya dokumennya sendiri (lihat tabel).</p>
          )}
          {isEffective && isCollective && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDocumentTarget({ itemId: null, label: "semua karyawan di usulan ini", current: termination.document })}
            >
              <Upload />
              Ganti Dokumen
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Karyawan */}
      <Card>
        <CardHeader>
          <CardTitle>Karyawan ({termination.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-240">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>TMT Nonaktif</TableHead>
                  <TableHead>Keterangan</TableHead>
                  {!isCollective && <TableHead>Dokumen</TableHead>}
                  <TableHead>Status Karyawan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termination.items.map((item, index) => {
                  const description = [item.destination_unit && `Ke ${item.destination_unit}`, item.reason]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-fg-tertiary">{index + 1}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/karyawan/${item.employee.id}`}
                          className="font-medium text-fg-heading hover:text-fg-brand hover:underline"
                        >
                          {item.employee.name}
                        </Link>
                        <p className="typo-body-s text-fg-tertiary">
                          NIK {item.employee.nik ?? "-"} · {item.employee.employment_status}
                        </p>
                      </TableCell>
                      <TableCell className="text-fg-primary">{item.type || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap text-fg-primary">
                        {item.effective_date ? formatDate(item.effective_date) : "-"}
                      </TableCell>
                      <TableCell className="max-w-72 whitespace-normal text-fg-secondary">{description || "-"}</TableCell>
                      {!isCollective && (
                        <TableCell>
                          <div className="flex flex-col items-start gap-2">
                            <StatusDocumentSummary document={item.document} />
                            {isEffective && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDocumentTarget({ itemId: item.id, label: item.employee.name, current: item.document })}
                              >
                                <Upload />
                                Ganti
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <EmployeeActiveStatusBadge status={item.employee.active_status} />
                        {/* Usulan sudah berlaku, tapi TMT-nya belum tiba */}
                        {isEffective && item.employee.active_status === EMPLOYEE_ACTIVE_STATUS.active && item.effective_date && (
                          <p className="mt-1 typo-body-s text-fg-tertiary">Nonaktif mulai {formatDate(item.effective_date)}</p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {termination.notes && <p className="mt-3 typo-body-s text-fg-secondary">Catatan: {termination.notes}</p>}
        </CardContent>
      </Card>

      {/* Dampak per karyawan (tidak ada untuk usulan Dibatalkan) */}
      {!termination.items.every((item) => item.impact === null) && (
        <Card>
          <CardHeader>
            <CardTitle>{isDraft ? "Perkiraan Dampak Penonaktifan" : "Dampak Penonaktifan"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {termination.items.map(
              (item) =>
                item.impact && (
                  <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-border p-4">
                    <p className="typo-label-m text-fg-heading">{item.employee.name}</p>
                    <TerminationImpactList impact={item.impact} />
                  </div>
                ),
            )}
          </CardContent>
        </Card>
      )}

      <UploadDocumentDialog
        documentsUrl={`/api/employee-terminations/${id}/documents`}
        purpose="penonaktifan"
        target={documentTarget}
        signerOptions={signerOptions}
        onClose={() => setDocumentTarget(null)}
        onSaved={() => terminationRequest.reload()}
      />
      <CancelTerminationDialog
        termination={isCancelling ? termination : null}
        onClose={() => setIsCancelling(false)}
        onCancelled={() => terminationRequest.reload()}
      />
      <ConfirmDeleteDialog
        open={isDeleting}
        title="Hapus draf usulan ini?"
        description="Draf usulan penonaktifan dihapus. Karyawannya tetap Aktif dan tidak ada yang berubah."
        deleting={deleteBusy}
        onConfirm={deleteDraft}
        onCancel={() => setIsDeleting(false)}
      />
    </div>
  );
}
