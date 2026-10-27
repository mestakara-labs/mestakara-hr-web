"use client";

import { useState } from "react";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import type { SearchOption } from "@/components/shared/SearchSelect";
import { checkStatusDocument } from "@/lib/activation-rules";
import { ApiError, apiPostForm } from "@/lib/http-client";
import type { StatusDocumentResource } from "@/types/api/employee-activation";

import { EMPTY_DOCUMENT_FORM, StatusDocumentFields, type StatusDocumentFormValues } from "./StatusDocumentFields";

/** Dokumen mana yang diunggah: kolektif (itemId null) atau per orang. */
export interface DocumentTarget {
  itemId: string | null;
  /** Untuk judul dialog, mis. "Asep Saepudin" atau "semua karyawan" */
  label: string;
  current: StatusDocumentResource | null;
}

interface UploadDocumentDialogProps {
  /** Alamat simpan dokumen, mis. "/api/employee-activations/{id}/documents" */
  documentsUrl: string;
  /** Dipakai di judul, mis. "penambahan" atau "penonaktifan" */
  purpose: string;
  /** null = dialog tertutup */
  target: DocumentTarget | null;
  signerOptions: SearchOption[];
  onClose: () => void;
  onSaved: () => void;
}

/** Dokumen dari server -> isian form. */
function toForm(document: StatusDocumentResource | null): StatusDocumentFormValues {
  if (!document) return EMPTY_DOCUMENT_FORM;
  return {
    document_type: document.type,
    document_number: document.number,
    document_date: document.date,
    document_file: document.file,
    signer_source: document.signer?.source ?? "",
    signer_assignment_id: document.signer?.assignment_id ?? "",
    signer_name: document.signer?.assignment_id ? "" : (document.signer?.name ?? ""),
    signer_position: document.signer?.assignment_id ? "" : (document.signer?.position_title ?? ""),
  };
}

/**
 * Dialog UNGGAH / GANTI DOKUMEN DASAR di halaman detail usulan yang sudah Berlaku
 * (kolektif, atau per orang). Dipakai Penambahan & Penonaktifan Karyawan.
 * Isian lengkap wajib: jenis, nomor, tanggal, file (+ penandatangan kalau SK).
 */
export function UploadDocumentDialog(props: UploadDocumentDialogProps) {
  if (!props.target) return null;
  // `key` = isian dialog diisi ulang setiap kali dibuka untuk dokumen lain.
  return <UploadDocumentDialogContent key={props.target.itemId ?? "kolektif"} {...props} target={props.target} />;
}

function UploadDocumentDialogContent({
  documentsUrl,
  purpose,
  target,
  signerOptions,
  onClose,
  onSaved,
}: UploadDocumentDialogProps & { target: DocumentTarget }) {
  const [values, setValues] = useState<StatusDocumentFormValues>(() => toForm(target.current));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    const localErrors = checkStatusDocument(values, values.document_file !== null, true);
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;

    const form = new FormData();
    const { document_file, ...text } = values;
    for (const [key, value] of Object.entries(text)) form.append(key, value);
    form.append("item_id", target.itemId ?? "");
    if (document_file instanceof File) form.append("document_file", document_file);
    else if (document_file) form.append("keep_document_file", "1");

    setSaving(true);
    try {
      const response = await apiPostForm(documentsUrl, form);
      toast.success(response.message);
      onSaved();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(Object.fromEntries(Object.entries(error.errors).map(([field, messages]) => [field, messages[0]])));
      } else {
        toast.error(error instanceof ApiError ? error.message : "Dokumen gagal disimpan.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog
      open
      title={target.current ? "Ganti Dokumen Dasar" : "Unggah Dokumen Dasar"}
      description={`Dokumen dasar ${purpose} untuk ${target.label}.`}
      saveLabel={saving ? "Menyimpan..." : "Simpan Dokumen"}
      onSave={save}
      onClose={onClose}
    >
      <StatusDocumentFields
        idPrefix={`unggah-${target.itemId ?? "kolektif"}`}
        values={values}
        onChange={(next) => {
          setValues(next);
          setErrors({});
        }}
        errors={errors}
        required
        disabled={saving}
        signerOptions={signerOptions}
      />
    </FormDialog>
  );
}
