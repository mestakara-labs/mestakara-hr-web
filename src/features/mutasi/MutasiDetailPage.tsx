"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, ChevronLeft, FilePlus, FileText, Pencil, Trash2, TriangleAlert, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@mestakara/ui/card";
import { toast } from "@mestakara/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { withStatus } from "@/features/jabatan-karyawan/assignment-options";
import { useApiGet } from "@/hooks/useApiGet";
import { formatDate, formatDateTime } from "@/lib/date";
import { ApiError, apiDelete } from "@/lib/http-client";
import { formatJobGrade } from "@/lib/position-rules";
import { formatSigner } from "@/lib/signer-rules";
import { DOCUMENT_MODE, isTransferEditable, TRANSFER_STATUS } from "@/lib/transfer-rules";
import type { TransferItemResource, TransferResource } from "@/types/api/transfer";

import { BasisDocumentDialog } from "./BasisDocumentDialog";
import { CancelTransferDialog } from "./CancelTransferDialog";
import { SupervisorChangeList } from "./SupervisorChangeList";
import { TransferStatusBadge } from "./TransferStatusBadge";
import { UploadFileDialog } from "./UploadFileDialog";
import { notifyTransfersChanged } from "./usePendingTransferCount";

const LIST_URL = "/dashboard/mutasi";

/** Dialog unggah yang sedang terbuka: scan SK kolektif, atau scan petikan satu karyawan. */
type UploadTarget = { kind: "sk" } | { kind: "petikan"; item: TransferItemResource } | null;

/** Alamat dokumen usulan, mis. documentUrl("mutasi-1", "type=sk&format=pdf"). */
function documentUrl(transferId: string, query: string): string {
  return `/api/transfers/${transferId}/documents?${query}`;
}

/**
 * Halaman DETAIL USULAN MUTASI:
 *
 *   Judul + status + tombol (Ubah / Hapus Draf / Batalkan)
 *   Pemberitahuan sesuai status (mis. "Menunggu Dokumen: unduh SK, tanda tangani, unggah scan")
 *   Data Usulan | Dokumen (SK kolektif PDF/Word, scan SK)
 *   Dokumen Dasar (Memo / Nota Dinas / dll.; bisa dilengkapi selama Draf / Menunggu Dokumen)
 *   Karyawan (dari -> ke, petikan SK, scan petikan)
 *
 * "Unggah Scan SK" saat file dokumen dasar belum ada -> pop-up PERINGATAN dulu:
 *   "Lengkapi Dulu"   -> dialog Dokumen Dasar
 *   "Tetap Lanjutkan" -> dialog Unggah Scan SK
 *   Perubahan atasan otomatis
 */
export function MutasiDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { data: transfer, loading, error, reload } = useApiGet<TransferResource>(`/api/transfers/${id}`);

  const [uploadTarget, setUploadTarget] = useState<UploadTarget>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isEditingBasisDocument, setIsEditingBasisDocument] = useState(false);
  const [isBasisDocumentWarning, setIsBasisDocumentWarning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  if (loading) return <PageLoading label="Memuat usulan mutasi..." />;
  if (error || !transfer) return <PageError message={error ?? "Usulan mutasi tidak ditemukan."} />;

  const isDraft = transfer.status === TRANSFER_STATUS.draft;
  const isWaiting = transfer.status === TRANSFER_STATUS.waiting;
  const isEffective = transfer.status === TRANSFER_STATUS.effective;
  // Dokumen hasil template baru bisa dibuat setelah nomor & tanggal SK diisi (bukan Draf).
  const canDownload = !isDraft;
  // Jalur "Sudah punya SK": dokumen resminya scan yang diunggah, jadi dokumen template tidak ditampilkan.
  const usesTemplate = transfer.document_mode !== DOCUMENT_MODE.upload;
  const canUploadExcerpt = isWaiting || isEffective;

  /** "Unggah Scan SK": kalau file dokumen dasar belum ada, tampilkan pop-up peringatan dulu. */
  function startUploadDecree() {
    if (transfer?.basis_document_file) setUploadTarget({ kind: "sk" });
    else setIsBasisDocumentWarning(true);
  }

  /** Status usulan berubah -> muat ulang halaman ini + badge di sidebar. */
  function reloadAll() {
    reload();
    notifyTransfersChanged();
  }

  async function deleteDraft() {
    setDeleteBusy(true);
    try {
      const response = await apiDelete(`/api/transfers/${id}`);
      toast.success(response.message);
      router.push(LIST_URL);
    } catch (deleteError) {
      toast.error(deleteError instanceof ApiError ? deleteError.message : "Draf gagal dihapus.");
      setDeleteBusy(false);
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Judul + tombol */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
            <Link href={LIST_URL} aria-label="Kembali">
              <ChevronLeft />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="typo-h3 text-fg-heading">Usulan {transfer.type}</h1>
              <TransferStatusBadge status={transfer.status} />
            </div>
            <p className="mt-1 typo-body-m text-fg-secondary">
              {transfer.decree_number ?? "Nomor SK belum diisi"} · {transfer.items.length} karyawan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isTransferEditable(transfer.status) && (
            <Button variant="outline" asChild>
              <Link href={`${LIST_URL}/${transfer.id}/edit`}>
                <Pencil />
                Ubah
              </Link>
            </Button>
          )}
          {isDraft && (
            <Button variant="outline" onClick={() => setIsDeleting(true)}>
              <Trash2 />
              Hapus Draf
            </Button>
          )}
          {(isWaiting || isEffective) && (
            <Button variant="outline" onClick={() => setIsCancelling(true)}>
              <Ban />
              Batalkan
            </Button>
          )}
          {isWaiting && (
            <Button onClick={startUploadDecree}>
              <Upload />
              Unggah Scan SK
            </Button>
          )}
        </div>
      </div>

      <StatusAlert transfer={transfer} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Data usulan */}
        <Card>
          <CardHeader>
            <CardTitle>Data Usulan</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 typo-body-s">
              <InfoRow label="Jenis Mutasi">{transfer.type}</InfoRow>
              <InfoRow label="TMT Berlaku">{formatDate(transfer.effective_date) || "-"}</InfoRow>
              <InfoRow label="Nomor SK">{transfer.decree_number ?? "-"}</InfoRow>
              <InfoRow label="Tanggal SK">{formatDate(transfer.decree_date) || "-"}</InfoRow>
              <InfoRow label="Penandatangan SK">{formatSigner(transfer.signer)}</InfoRow>
              <InfoRow label="Keterangan">{transfer.notes ?? "-"}</InfoRow>
              <InfoRow label="Dibuat">
                {formatDateTime(transfer.created_at)} oleh {transfer.created_by}
              </InfoRow>
            </dl>
          </CardContent>
        </Card>

        {/* Dokumen */}
        <Card>
          <CardHeader>
            <CardTitle>Dokumen SK</CardTitle>
            <CardDescription>{documentDescription(transfer)}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 typo-body-s">
            {usesTemplate && (
              <div>
                <p className="mb-1 font-medium text-fg-heading">SK Kolektif (semua karyawan)</p>
                {canDownload ? (
                  <DocumentLinks transferId={transfer.id} query="type=sk" />
                ) : (
                  <p className="text-fg-tertiary">Tersedia setelah nomor & tanggal SK diisi.</p>
                )}
              </div>
            )}
            <div>
              <p className="mb-1 font-medium text-fg-heading">Scan SK yang Ditandatangani</p>
              {transfer.signed_file && transfer.signed_file_url ? (
                <FileLink href={transfer.signed_file_url} label={transfer.signed_file.name} />
              ) : isWaiting ? (
                <Button size="sm" variant="outline" onClick={startUploadDecree}>
                  <Upload />
                  Unggah Scan SK
                </Button>
              ) : (
                <p className="text-fg-tertiary">Belum ada.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BasisDocumentCard
        transfer={transfer}
        canEdit={isTransferEditable(transfer.status)}
        onEdit={() => setIsEditingBasisDocument(true)}
      />

      {/* Karyawan */}
      <Card>
        <CardHeader>
          <CardTitle>Karyawan ({transfer.items.length})</CardTitle>
          <CardDescription>
            Scan petikan SK per karyawan bersifat opsional. Kalau diunggah, petikan itu menggantikan scan SK kolektif
            sebagai dokumen dasar jabatan karyawan tersebut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table className="min-w-240">
              <TableHeader>
                <TableRow>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Dari</TableHead>
                  <TableHead>Ke</TableHead>
                  <TableHead>Job Grade</TableHead>
                  <TableHead>Tempat Tugas</TableHead>
                  {usesTemplate && <TableHead>Petikan SK</TableHead>}
                  <TableHead>Scan Petikan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfer.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium text-fg-heading">{item.employee.name}</p>
                      <p className="typo-body-s text-fg-tertiary">NIK {item.employee.nik ?? "-"}</p>
                    </TableCell>
                    <TableCell className="text-fg-secondary">
                      {item.from ? withStatus(item.from.assignment_status, item.from.position_title) : "Belum memiliki jabatan"}
                    </TableCell>
                    <TableCell className="text-fg-heading">
                      {withStatus(item.to.assignment_status, item.to.position_title)}
                      {item.to.end_date && (
                        <p className="typo-body-s text-fg-tertiary">s.d. {formatDate(item.to.end_date)}</p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-fg-primary">
                      {item.from ? `${formatJobGrade(item.from.job_grade)} → ` : ""}
                      {formatJobGrade(item.to.job_grade)}
                    </TableCell>
                    <TableCell className="text-fg-secondary">
                      {item.to.sub_unit_name}
                      {item.to.placement_object_names.length > 0 && ` · ${item.to.placement_object_names.join(", ")}`}
                    </TableCell>
                    {usesTemplate && (
                      <TableCell>
                        {canDownload ? (
                          <DocumentLinks transferId={transfer.id} query={`type=petikan&item=${item.id}`} />
                        ) : (
                          <span className="text-fg-tertiary">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        {item.excerpt_file && item.excerpt_file_url && (
                          <FileLink href={item.excerpt_file_url} label={item.excerpt_file.name} />
                        )}
                        {canUploadExcerpt && (
                          <Button size="sm" variant="ghost" onClick={() => setUploadTarget({ kind: "petikan", item })}>
                            <Upload />
                            {item.excerpt_file ? "Ganti" : "Unggah"}
                          </Button>
                        )}
                        {!item.excerpt_file && !canUploadExcerpt && <span className="text-fg-tertiary">-</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Perubahan atasan otomatis */}
      {transfer.status !== TRANSFER_STATUS.cancelled && (
        <Card>
          <CardHeader>
            <CardTitle>{isEffective ? "Perubahan Atasan Otomatis" : "Perkiraan Perubahan Atasan"}</CardTitle>
            <CardDescription>
              {isEffective
                ? "Bawahan yang atasannya dialihkan karena usulan ini (tercatat di Riwayat Atasan)."
                : "Akan terjadi saat usulan berlaku, dihitung dari data saat ini."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupervisorChangeList
              changes={transfer.supervisor_changes}
              emptyText="Tidak ada bawahan yang atasannya berubah karena usulan ini."
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog-dialog */}
      <UploadFileDialog
        open={uploadTarget?.kind === "sk"}
        title="Unggah Scan SK"
        description="Scan SK kolektif yang sudah ditandatangani dan diberi stempel."
        endpoint={`/api/transfers/${transfer.id}/activate`}
        fieldName="signed_file"
        confirmText="Setelah scan diunggah, usulan langsung BERLAKU: jabatan baru dibuat, jabatan lama diakhiri, dan atasan dialihkan otomatis."
        onClose={() => setUploadTarget(null)}
        onUploaded={reloadAll}
      />
      <UploadFileDialog
        open={uploadTarget?.kind === "petikan"}
        title="Unggah Scan Petikan SK"
        description={uploadTarget?.kind === "petikan" ? `Petikan SK untuk ${uploadTarget.item.employee.name}.` : ""}
        endpoint={
          uploadTarget?.kind === "petikan"
            ? `/api/transfers/${transfer.id}/items/${uploadTarget.item.id}/excerpt`
            : ""
        }
        fieldName="excerpt_file"
        onClose={() => setUploadTarget(null)}
        onUploaded={reloadAll}
      />
      <BasisDocumentDialog
        transfer={isEditingBasisDocument ? transfer : null}
        onClose={() => setIsEditingBasisDocument(false)}
        onSaved={reload}
      />
      {/* Pop-up peringatan: scan SK akan diunggah, tapi file dokumen dasar belum ada */}
      <ConfirmDialog
        open={isBasisDocumentWarning}
        icon={TriangleAlert}
        tone="warning"
        title="Dokumen dasar belum diunggah"
        description={
          <>
            <p>
              Dokumen dasar mutasi & penempatan (Memo / Nota Dinas / Disposisi) sangat disarankan sebagai dasar
              pertanggungjawaban.
            </p>
            <p className="mt-2">
              Abaikan peringatan ini jika SK yang diunggah sudah dapat dijadikan dasar mutasi/penempatan. Apakah tetap
              ingin mengunggah scan SK tanpa dokumen dasar?
            </p>
          </>
        }
        cancelLabel="Lengkapi Dulu"
        confirmLabel="Tetap Lanjutkan"
        onCancel={() => {
          setIsBasisDocumentWarning(false);
          setIsEditingBasisDocument(true);
        }}
        onConfirm={() => {
          setIsBasisDocumentWarning(false);
          setUploadTarget({ kind: "sk" });
        }}
      />
      <CancelTransferDialog
        transfer={isCancelling ? transfer : null}
        onClose={() => setIsCancelling(false)}
        onCancelled={reloadAll}
      />
      <ConfirmDeleteDialog
        open={isDeleting}
        title="Hapus draf usulan ini?"
        description="Draf yang sudah dihapus tidak bisa dikembalikan."
        deleting={deleteBusy}
        onConfirm={deleteDraft}
        onCancel={() => setIsDeleting(false)}
      />
    </div>
  );
}

/**
 * Kartu DOKUMEN DASAR usulan:
 *
 *   Dokumen Dasar                                  [Lengkapi / Ubah]
 *   Jenis Dokumen   Memo
 *   Nomor Dokumen   2A44/M/2026.10.01-007
 *   Tanggal         1 Oktober 2026
 *   File            📄 memo-mutasi.pdf
 *
 * Tombol hanya ada selama usulan masih bisa diubah (Draf / Menunggu Dokumen).
 */
function BasisDocumentCard({
  transfer,
  canEdit,
  onEdit,
}: {
  transfer: TransferResource;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const isEmpty = !transfer.basis_document_type && !transfer.basis_document_number && !transfer.basis_document_file;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumen Dasar</CardTitle>
        <CardDescription>
          Dokumen yang menjadi dasar mutasi/penempatan (Memo, Nota Dinas, Disposisi, SK, dll.). Opsional, namun sangat
          disarankan.
        </CardDescription>
        {canEdit && (
          <CardAction>
            <Button size="sm" variant="outline" onClick={onEdit}>
              {isEmpty ? <FilePlus /> : <Pencil />}
              {isEmpty ? "Lengkapi" : "Ubah"}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="typo-body-s text-fg-tertiary">Belum ada dokumen dasar.</p>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 typo-body-s">
            <InfoRow label="Jenis Dokumen">{transfer.basis_document_type ?? "-"}</InfoRow>
            <InfoRow label="Nomor Dokumen">{transfer.basis_document_number ?? "-"}</InfoRow>
            <InfoRow label="Tanggal Dokumen">{formatDate(transfer.basis_document_date) || "-"}</InfoRow>
            {transfer.basis_document_signer && (
              <InfoRow label="Penandatangan">{formatSigner(transfer.basis_document_signer)}</InfoRow>
            )}
            <InfoRow label="File">
              {transfer.basis_document_file && transfer.basis_document_file_url ? (
                <FileLink href={transfer.basis_document_file_url} label={transfer.basis_document_file.name} />
              ) : (
                <span className="text-fg-warning">Belum diunggah</span>
              )}
            </InfoRow>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

/** Pemberitahuan di atas halaman, sesuai status usulan. */
function StatusAlert({ transfer }: { transfer: TransferResource }) {
  if (transfer.status === TRANSFER_STATUS.draft) {
    return (
      <Alert variant="info">
        <AlertTitle>Masih draf</AlertTitle>
        <AlertDescription>Lengkapi isian usulan lewat tombol Ubah, lalu simpan usulannya.</AlertDescription>
      </Alert>
    );
  }

  if (transfer.status === TRANSFER_STATUS.waiting) {
    return (
      <Alert variant="warning">
        <AlertTitle>Menunggu dokumen bertanda tangan</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal pl-5">
            <li>Unduh SK Kolektif (dan Petikan SK kalau perlu).</li>
            <li>Tanda tangani dan beri stempel, lalu scan.</li>
            <li>Klik &ldquo;Unggah Scan SK&rdquo;. Usulan baru berlaku setelah itu.</li>
          </ol>
        </AlertDescription>
      </Alert>
    );
  }

  if (transfer.status === TRANSFER_STATUS.effective) {
    return (
      <Alert variant="success">
        <AlertTitle>Usulan sudah berlaku</AlertTitle>
        <AlertDescription>
          Diaktifkan {transfer.activated_at ? formatDateTime(transfer.activated_at) : "-"}. Jabatan baru mulai berlaku{" "}
          {formatDate(transfer.effective_date)}.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="danger">
      <AlertTitle>Usulan dibatalkan</AlertTitle>
      <AlertDescription>
        Dibatalkan {transfer.cancelled_at ? formatDateTime(transfer.cancelled_at) : "-"} oleh{" "}
        {transfer.cancelled_by ?? "-"}.{transfer.cancel_reason && ` Alasan: ${transfer.cancel_reason}`}
      </AlertDescription>
    </Alert>
  );
}

/** Link unduh dokumen hasil template: "PDF · Word". */
function DocumentLinks({ transferId, query }: { transferId: string; query: string }) {
  return (
    <span className="flex flex-wrap items-center gap-3">
      <FileLink href={documentUrl(transferId, `${query}&format=pdf`)} label="PDF" />
      <FileLink href={documentUrl(transferId, `${query}&format=doc`)} label="Word" />
    </span>
  );
}

/** Link yang membuka file di tab baru. */
function FileLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-medium text-fg-brand hover:underline"
    >
      <FileText className="size-4 shrink-0" />
      {label}
    </a>
  );
}

/** Satu baris "Label   isi" di kartu Data Usulan. */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-fg-tertiary">{label}</dt>
      <dd className="text-fg-primary">{children}</dd>
    </>
  );
}

/** Keterangan kartu Dokumen SK, sesuai jalur dokumen & status usulan. */
function documentDescription(transfer: TransferResource): string {
  if (transfer.document_mode === DOCUMENT_MODE.upload) return "SK sudah ditandatangani saat usulan dibuat.";
  if (transfer.document_mode !== DOCUMENT_MODE.template) return "Jalur dokumen belum dipilih.";
  if (transfer.signed_file) return "SK dibuat dari template dan scan bertanda tangannya sudah diunggah.";
  return "SK dibuat dari template. Unduh, tanda tangani & beri stempel, lalu unggah scan-nya.";
}
