"use client";

import { useState, type ReactNode } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mestakara/ui/dialog";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { EXCEL_RULE } from "@/lib/file-rules";
import { ApiError, apiPostForm } from "@/lib/http-client";

import { FileUploadField } from "./FileUploadField";

interface ExcelImportDialogProps<TPreview> {
  open: boolean;
  title: string;
  description: string;
  /** Alamat PERIKSA file (tidak menyimpan), mis. "/api/wage-schemes/import/preview" */
  previewUrl: string;
  /** Alamat SIMPAN file, mis. "/api/wage-schemes/import" */
  saveUrl: string;
  /** Isian lain yang ikut dikirim bersama file, mis. { period: "2026-10", type: "daftar_hadir" } */
  extraFields?: Record<string, string>;
  /** Apakah hasil pemeriksaan boleh disimpan? (mis. tidak ada baris salah) */
  canSave: (preview: TPreview) => boolean;
  /** Tulisan tombol simpan, mis. "Simpan 12 Perubahan" */
  saveLabel: (preview: TPreview) => string;
  /** Tampilan hasil pemeriksaan (ringkasan + tabel), berbeda untuk setiap jenis unggahan */
  renderPreview: (preview: TPreview) => ReactNode;
  onClose: () => void;
  /** Dipanggil setelah file berhasil disimpan (untuk memuat ulang data halaman) */
  onSaved: () => void;
}

/**
 * Dialog UNGGAH FILE EXCEL dua langkah, dipakai semua fitur unggah (Data Upah, Daftar Hadir, Lembur):
 *
 *   1. Pilih file .xlsx                      -> [Periksa File]   (dikirim ke `previewUrl`, tidak disimpan)
 *   2. Pratinjau (`renderPreview`)           -> [Simpan ...]     (dikirim ke `saveUrl`; hanya kalau `canSave`)
 *
 * Mengganti file membatalkan pratinjau lama. Selama mengirim, dialog tidak bisa ditutup.
 */
export function ExcelImportDialog<TPreview>(props: ExcelImportDialogProps<TPreview>) {
  if (!props.open) return null;
  // Dibuat ulang setiap kali dibuka, supaya file & pratinjau sebelumnya hilang.
  return <ExcelImportDialogContent {...props} />;
}

function ExcelImportDialogContent<TPreview>({
  title,
  description,
  previewUrl,
  saveUrl,
  extraFields = {},
  canSave,
  saveLabel,
  renderPreview,
  onClose,
  onSaved,
}: ExcelImportDialogProps<TPreview>) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<TPreview | null>(null);
  const [busy, setBusy] = useState<"none" | "checking" | "saving">("none");
  const [error, setError] = useState<string | null>(null);

  /** Kirim file + isian lain ke `path` sebagai multipart (isian file bernama "file"). */
  function postFile<T>(path: string) {
    const form = new FormData();
    if (file) form.append("file", file);
    for (const [key, value] of Object.entries(extraFields)) form.append(key, value);
    return apiPostForm<T>(path, form);
  }

  async function checkFile() {
    setBusy("checking");
    setError(null);
    try {
      const response = await postFile<TPreview>(previewUrl);
      setPreview(response.data);
    } catch (checkError) {
      setError(checkError instanceof ApiError ? checkError.message : "File gagal diperiksa. Silakan coba lagi.");
    } finally {
      setBusy("none");
    }
  }

  async function save() {
    setBusy("saving");
    setError(null);
    try {
      const response = await postFile(saveUrl);
      toast.success(response.message);
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : "Data gagal disimpan. Silakan coba lagi.");
      setBusy("none");
    }
  }

  /** Ganti file -> pratinjau lama tidak berlaku lagi. */
  function changeFile(next: File | null) {
    setFile(next);
    setPreview(null);
    setError(null);
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && busy === "none" && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error && (
            <Alert variant="danger">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FileUploadField id="excel-import-file" rule={EXCEL_RULE} file={file} onChange={changeFile} disabled={busy !== "none"} />

          {preview !== null && renderPreview(preview)}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy !== "none"}>
            Batal
          </Button>
          {preview === null ? (
            <Button type="button" onClick={checkFile} disabled={!file || busy !== "none"}>
              {busy === "checking" && <Spinner />}
              {busy === "checking" ? "Memeriksa..." : "Periksa File"}
            </Button>
          ) : (
            <Button type="button" onClick={save} disabled={!canSave(preview) || busy !== "none"}>
              {busy === "saving" && <Spinner />}
              {busy === "saving" ? "Menyimpan..." : saveLabel(preview)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Pesan kesalahan / peringatan satu kolom. Pesan dari server kadang sudah diawali nama kolomnya
 * ("Gaji Pokok harus ..."), jadi nama kolom tidak ditulis dua kali.
 */
export function formatColumnMessage({ column, message }: { column: string; message: string }): string {
  return message.startsWith(column) ? message : `${column}: ${message}`;
}
