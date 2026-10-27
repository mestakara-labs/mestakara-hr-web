"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileText, Upload, X } from "lucide-react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@mestakara/ui/attachment";
import { Button } from "@mestakara/ui/button";
import { cn } from "cn";

import { checkFile, describeExtensions, formatFileSize, type FileRule } from "@/lib/file-rules";
import type { UploadedFileInfo } from "@/types/api/employee";

interface FileUploadFieldProps {
  id: string;
  /** Format & ukuran yang diterima, mis. DOCUMENT_RULE */
  rule: FileRule;
  /** File yang tampil sekarang: file baru (File) atau file lama dari server; null = belum ada */
  file: File | UploadedFileInfo | null;
  /** Dipanggil dengan file baru yang LOLOS pemeriksaan, atau null saat file dihapus */
  onChange: (file: File | null) => void;
  invalid?: boolean;
  disabled?: boolean;
}

/**
 * Kotak unggah satu file:
 *
 *   Belum ada file:                       Sudah ada file:
 *   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐         ┌──────────────────────────┐
 *     ⤒ Tarik & lepas file di sini        │ 📄 SK-Pengangkatan.pdf  ✕ │
 *       atau [Pilih File]                 │    1,2 MB                │
 *     PDF, JPG, PNG · maks. 5 MB          └──────────────────────────┘
 *   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
 *
 * File diperiksa (format & ukuran) begitu dipilih. File yang tidak lolos
 * ditolak dan pesan errornya tampil di bawah kotak.
 */
export function FileUploadField({ id, rule, file, onChange, invalid = false, disabled = false }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rejectMessage, setRejectMessage] = useState<string | null>(null);

  /** Periksa file yang dipilih / dilepas ke kotak, lalu teruskan kalau lolos. */
  function receiveFile(candidate: File | undefined) {
    if (!candidate) return;

    const message = checkFile(candidate, rule) ?? null;
    setRejectMessage(message);
    if (!message) onChange(candidate);
  }

  function removeFile() {
    setRejectMessage(null);
    onChange(null);
    // Supaya file yang sama bisa dipilih lagi setelah dihapus.
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) receiveFile(event.dataTransfer.files[0]);
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Input file asli disembunyikan; dibuka lewat tombol "Pilih File" */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="sr-only"
        accept={rule.extensions.map((extension) => `.${extension}`).join(",")}
        disabled={disabled}
        onChange={(event) => receiveFile(event.target.files?.[0])}
      />

      {file ? (
        <Attachment>
          <AttachmentMedia variant="icon">
            <FileText />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{file.name}</AttachmentTitle>
            <AttachmentDescription>{formatFileSize(file.size)}</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label={`Hapus file ${file.name}`} disabled={disabled} onClick={removeFile}>
              <X />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center",
            isDragging ? "border-primary bg-brand-subtle" : "border-border-strong",
            (invalid || rejectMessage) && "border-danger",
          )}
        >
          <Upload className="size-6 text-fg-tertiary" />
          <p className="typo-body-m text-fg-secondary">
            Tarik &amp; lepas file di sini, atau{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              pilih file
            </Button>
          </p>
          <p className="text-xs text-fg-tertiary">
            {describeExtensions(rule)} · maks. {rule.maxSizeMB} MB
          </p>
        </div>
      )}

      {rejectMessage && <p className="typo-body-s text-fg-danger">{rejectMessage}</p>}
    </div>
  );
}
