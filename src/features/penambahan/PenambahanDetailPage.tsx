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
import { useApiGet } from "@/hooks/useApiGet";
import { ACTIVATION_STATUS, DOCUMENT_SCOPE, EMPLOYEE_ACTIVE_STATUS } from "@/lib/activation-rules";
import { formatDate, formatDateTime } from "@/lib/date";
import { ApiError, apiDelete } from "@/lib/http-client";
import { formatJobGrade } from "@/lib/position-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { ActivationResource } from "@/types/api/employee-activation";

import { ActivationStatusBadge } from "./ActivationStatusBadge";
import { CancelActivationDialog } from "./CancelActivationDialog";
import { PENAMBAHAN_URL } from "./PenambahanWizard";
import { StatusDocumentSummary } from "./StatusDocumentSummary";
import { UploadDocumentDialog, type DocumentTarget } from "./UploadDocumentDialog";

/**
 * Halaman DETAIL USULAN PENAMBAHAN KARYAWAN:
 *
 *   [←] Usulan Penambahan Karyawan  [Berlaku]                  [Batalkan]   (Draf: [Lanjutkan] [Hapus Draf])
 *       Dibuat 14 Okt 2026 oleh Admin SDM · Berlaku 14 Okt 2026
 *   Dokumen Dasar: Kolektif — SK No. ... 📄   [Unggah / Ganti Dokumen]
 *   No | Karyawan | Dasar | TMT Aktif | (Dokumen per orang) | Penempatan | Status Karyawan
 */
export function PenambahanDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const activationRequest = useApiGet<ActivationResource>(`/api/employee-activations/${id}`);
  const assignmentsRequest = useApiGet<AssignmentResource[]>("/api/position-assignments");
  const [documentTarget, setDocumentTarget] = useState<DocumentTarget | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  if (activationRequest.loading) return <PageLoading label="Memuat usulan penambahan..." />;
  const activation = activationRequest.data;
  if (activationRequest.error || !activation) {
    return <PageError message={activationRequest.error ?? "Usulan penambahan tidak ditemukan."} />;
  }

  const isDraft = activation.status === ACTIVATION_STATUS.draft;
  const isEffective = activation.status === ACTIVATION_STATUS.effective;
  const isCollective = activation.document_scope === DOCUMENT_SCOPE.collective;
  const signerOptions = toSignerOptions(assignmentsRequest.data ?? []);

  async function deleteDraft() {
    setDeleteBusy(true);
    try {
      const response = await apiDelete(`/api/employee-activations/${id}`);
      toast.success(response.message);
      router.push(PENAMBAHAN_URL);
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
            <Link href={PENAMBAHAN_URL} aria-label="Kembali">
              <ChevronLeft />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="typo-h3 text-fg-heading">Usulan Penambahan Karyawan</h1>
              <ActivationStatusBadge status={activation.status} />
            </div>
            <p className="mt-1 typo-body-m text-fg-secondary">
              Dibuat {formatDateTime(activation.created_at)} oleh {activation.created_by}
              {activation.activated_at && ` · Berlaku ${formatDateTime(activation.activated_at)}`}
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
                <Link href={`${PENAMBAHAN_URL}/${id}/edit`}>
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

      {activation.status === ACTIVATION_STATUS.cancelled && (
        <Alert variant="warning">
          <AlertDescription>
            Dibatalkan {activation.cancelled_at && formatDateTime(activation.cancelled_at)} oleh {activation.cancelled_by}.
            Alasan: {activation.cancel_reason ?? "-"}
          </AlertDescription>
        </Alert>
      )}
      {isEffective && activation.missing_document_count > 0 && (
        <Alert variant="warning">
          <AlertDescription>
            Dokumen dasar belum diunggah untuk <strong>{activation.missing_document_count} karyawan</strong>. Unggah lewat
            tombol <strong>Unggah Dokumen</strong> di bawah.
          </AlertDescription>
        </Alert>
      )}

      {/* Dokumen kolektif */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumen Dasar Penambahan — {activation.document_scope}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start justify-between gap-3">
          {isCollective ? (
            <StatusDocumentSummary document={activation.document} />
          ) : (
            <p className="typo-body-s text-fg-secondary">Setiap karyawan punya dokumennya sendiri (lihat tabel).</p>
          )}
          {isEffective && isCollective && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDocumentTarget({ itemId: null, label: "semua karyawan di usulan ini", current: activation.document })}
            >
              <Upload />
              {activation.document ? "Ganti Dokumen" : "Unggah Dokumen"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Karyawan */}
      <Card>
        <CardHeader>
          <CardTitle>Karyawan ({activation.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-260">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Dasar Penambahan</TableHead>
                  <TableHead>TMT Aktif</TableHead>
                  {!isCollective && <TableHead>Dokumen</TableHead>}
                  <TableHead>Penempatan</TableHead>
                  <TableHead>Job Grade</TableHead>
                  <TableHead>Status Karyawan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activation.items.map((item, index) => (
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
                    <TableCell>
                      <p className="text-fg-primary">{item.type}</p>
                      {item.origin_unit && <p className="typo-body-s text-fg-tertiary">dari {item.origin_unit}</p>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-fg-primary">
                      {item.effective_date ? formatDate(item.effective_date) : "-"}
                    </TableCell>
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
                              {item.document ? "Ganti" : "Unggah"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      {item.placement ? (
                        <>
                          <p className="text-fg-primary">
                            {item.placement.assignment_status} {item.placement.position_title}
                          </p>
                          <p className="typo-body-s text-fg-tertiary">{item.placement.sub_unit_name}</p>
                        </>
                      ) : (
                        <span className="text-fg-tertiary">Belum ditempatkan</span>
                      )}
                    </TableCell>
                    <TableCell className="text-fg-primary">{formatJobGrade(item.placement?.job_grade)}</TableCell>
                    <TableCell>
                      <EmployeeActiveStatusBadge status={item.employee.active_status} />
                      {/* Usulan sudah berlaku, tapi TMT-nya belum tiba */}
                      {isEffective && item.employee.active_status === EMPLOYEE_ACTIVE_STATUS.pending && item.effective_date && (
                        <p className="mt-1 typo-body-s text-fg-tertiary">Aktif mulai {formatDate(item.effective_date)}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {activation.notes && <p className="mt-3 typo-body-s text-fg-secondary">Catatan: {activation.notes}</p>}
        </CardContent>
      </Card>

      <UploadDocumentDialog
        documentsUrl={`/api/employee-activations/${id}/documents`}
        purpose="penambahan"
        target={documentTarget}
        signerOptions={signerOptions}
        onClose={() => setDocumentTarget(null)}
        onSaved={() => activationRequest.reload()}
      />
      <CancelActivationDialog
        activation={isCancelling ? activation : null}
        onClose={() => setIsCancelling(false)}
        onCancelled={() => activationRequest.reload()}
      />
      <ConfirmDeleteDialog
        open={isDeleting}
        title="Hapus draf usulan ini?"
        description="Draf usulan dihapus. Draf data karyawannya tetap tersimpan (Belum Aktif) dan bisa dipilih di usulan lain."
        deleting={deleteBusy}
        onConfirm={deleteDraft}
        onCancel={() => setIsDeleting(false)}
      />
    </div>
  );
}
