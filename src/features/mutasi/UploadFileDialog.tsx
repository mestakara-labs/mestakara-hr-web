"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Field, FieldError, FieldLabel } from "@mestakara/ui/field";
import { toast } from "@mestakara/ui/sonner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileUploadField } from "@/components/shared/FileUploadField";
import { FormDialog } from "@/components/shared/FormDialog";
import { DOCUMENT_RULE } from "@/lib/file-rules";
import { ApiError, apiPostForm } from "@/lib/http-client";

interface UploadFileDialogProps {
  open: boolean;
  title: string;
  description: string;
  /** Alamat tujuan, mis. "/api/transfers/12/activate" */
  endpoint: string;
  /** Nama isian file yang dikirim, mis. "signed_file" */
  fieldName: string;
  /** Kalau diisi, muncul pop-up konfirmasi dengan kalimat ini sebelum file dikirim */
  confirmText?: string;
  onClose: () => void;
  /** Dipanggil setelah file berhasil diunggah (untuk memuat ulang halaman) */
  onUploaded: () => void;
}

/**
 * Dialog UNGGAH SATU FILE (scan SK kolektif atau scan petikan SK):
 *
 *   ┌ Unggah Scan SK ──────────────────── × ┐
 *   │ [ Tarik & lepas file / Pilih File ]    │
 *   │                     [Batal] [Unggah]   │
 *   └────────────────────────────────────────┘
 */
export function UploadFileDialog(props: UploadFileDialogProps) {
  // `key` = isian dialog kembali kosong setiap kali dibuka.
  if (!props.open) return null;
  return <UploadFileDialogContent key={props.endpoint} {...props} />;
}

function UploadFileDialogContent({
  title,
  description,
  endpoint,
  fieldName,
  confirmText,
  onClose,
  onUploaded,
}: UploadFileDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  /** Tombol Unggah: file wajib ada; lalu konfirmasi (kalau ada) atau langsung dikirim. */
  function handleSave() {
    if (!file) {
      setError("Pilih file terlebih dahulu");
      return;
    }
    if (confirmText) setIsConfirming(true);
    else upload();
  }

  async function upload() {
    if (!file) return;

    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.append(fieldName, file);
      const response = await apiPostForm(endpoint, form);

      toast.success(response.message);
      onUploaded();
      onClose();
    } catch (uploadError) {
      if (uploadError instanceof ApiError) {
        setError(uploadError.errors?.[fieldName]?.[0] ?? uploadError.message);
      } else {
        setError("File gagal diunggah. Silakan coba lagi.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <FormDialog
        open
        title={title}
        description={description}
        saveLabel={saving ? "Mengunggah..." : "Unggah"}
        onSave={handleSave}
        onClose={onClose}
      >
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="upload_file">File</FieldLabel>
          <FileUploadField
            id="upload_file"
            rule={DOCUMENT_RULE}
            file={file}
            onChange={(selected) => {
              setFile(selected);
              setError(null);
            }}
            invalid={Boolean(error)}
            disabled={saving}
          />
          <FieldError>{error}</FieldError>
        </Field>
        {confirmText && (
          <Alert variant="info">
            <AlertDescription>{confirmText}</AlertDescription>
          </Alert>
        )}
      </FormDialog>

      {confirmText && (
        <ConfirmDialog
          open={isConfirming}
          icon={CircleHelp}
          tone="info"
          title={`${title}?`}
          description={<p>{confirmText} Apakah file yang dipilih sudah benar?</p>}
          cancelLabel="Periksa Lagi"
          confirmLabel="Ya, Unggah"
          onCancel={() => setIsConfirming(false)}
          onConfirm={() => {
            setIsConfirming(false);
            upload();
          }}
        />
      )}
    </>
  );
}
