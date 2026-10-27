"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { toSignerOptions } from "@/features/jabatan-karyawan/assignment-options";
import { useApiGet } from "@/hooks/useApiGet";
import { ApiError, apiPostForm } from "@/lib/http-client";
import { checkBasisDocument } from "@/lib/transfer-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { TransferResource } from "@/types/api/transfer";

import { BasisDocumentFields } from "./BasisDocumentFields";
import { appendBasisDocument, toBasisDocumentValues, type BasisDocumentValues } from "./mutasi-form-values";

interface BasisDocumentDialogProps {
  /** Usulan yang dokumen dasarnya diisi. null = dialog tertutup. */
  transfer: TransferResource | null;
  onClose: () => void;
  /** Dipanggil setelah dokumen dasar tersimpan (untuk memuat ulang halaman) */
  onSaved: () => void;
}

/**
 * Dialog DOKUMEN DASAR di halaman detail usulan (Draf / Menunggu Dokumen):
 *
 *   ┌ Dokumen Dasar Mutasi & Penempatan ──────── × ┐
 *   │ (i) Opsional, namun sangat disarankan ...     │
 *   │ Jenis Dokumen   Nomor Dokumen   Tanggal       │
 *   │ File Dokumen                                  │
 *   │ Penandatangan (wajib kalau SK)                │
 *   │                              [Batal] [Simpan] │
 *   └───────────────────────────────────────────────┘
 *
 * Isian awalnya = dokumen dasar yang sudah tersimpan. Dikirim ke POST /api/transfers/{id}/basis-document.
 */
export function BasisDocumentDialog(props: BasisDocumentDialogProps) {
  // `key` = isian dialog diambil ulang dari data usulan setiap kali dibuka.
  if (!props.transfer) return null;
  return <BasisDocumentDialogContent key={props.transfer.id} {...props} transfer={props.transfer} />;
}

function BasisDocumentDialogContent({
  transfer,
  onClose,
  onSaved,
}: BasisDocumentDialogProps & { transfer: TransferResource }) {
  const [values, setValues] = useState<BasisDocumentValues>(() => toBasisDocumentValues(transfer));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Calon penandatangan dari Unit (pejabat yang sedang menjabat).
  const assignments = useApiGet<AssignmentResource[]>("/api/position-assignments");

  /** Ubah isian; pesan error dihapus. */
  function change(next: BasisDocumentValues) {
    setValues(next);
    setErrors({});
  }

  /** Tombol Simpan: periksa dulu (ada isian -> jenis, nomor, tanggal, file wajib; SK -> penandatangan), lalu kirim. */
  async function save() {
    const checkErrors = checkBasisDocument(values, values.basis_document_file !== null);
    setErrors(checkErrors);
    if (Object.keys(checkErrors).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      const form = new FormData();
      appendBasisDocument(form, values);
      const response = await apiPostForm(`/api/transfers/${transfer.id}/basis-document`, form);

      toast.success(response.message);
      onSaved();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(Object.fromEntries(Object.entries(error.errors).map(([field, messages]) => [field, messages[0]])));
      }
      setFormError(error instanceof ApiError ? error.message : "Dokumen dasar gagal disimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog
      open
      title="Dokumen Dasar Mutasi & Penempatan"
      description={`Usulan ${transfer.type}${transfer.decree_number ? ` · ${transfer.decree_number}` : ""}`}
      saveLabel={saving ? "Menyimpan..." : "Simpan"}
      onSave={save}
      onClose={onClose}
    >
      {formError && (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <BasisDocumentFields
        values={values}
        onChange={change}
        errors={errors}
        disabled={saving}
        signerOptions={toSignerOptions(assignments.data ?? [])}
      />
    </FormDialog>
  );
}
