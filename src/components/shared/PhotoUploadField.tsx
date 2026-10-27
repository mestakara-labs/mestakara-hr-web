"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@mestakara/ui/avatar";
import { Button } from "@mestakara/ui/button";

import { checkFile, describeExtensions, PHOTO_RULE } from "@/lib/file-rules";
import { getInitials } from "@/lib/initials";

interface PhotoUploadFieldProps {
  id: string;
  /** Nama karyawan, untuk inisial saat belum ada foto */
  name: string;
  /** Alamat gambar yang tampil sekarang (foto lama, atau pratinjau foto baru); null = belum ada */
  photoUrl: string | null;
  /**
   * Dipanggil saat foto dipilih atau dihapus:
   *   - pilih foto -> (file, pratinjauGambar)
   *   - hapus foto -> (null, null)
   */
  onChange: (file: File | null, previewUrl: string | null) => void;
  disabled?: boolean;
}

/**
 * Isian foto / avatar karyawan (opsional):
 *
 *   (AS)   [📷 Pilih Foto] [🗑 Hapus]
 *          JPG, JPEG, PNG · maks. 2 MB
 */
export function PhotoUploadField({ id, name, photoUrl, onChange, disabled = false }: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rejectMessage, setRejectMessage] = useState<string | null>(null);

  function receiveFile(file: File | undefined) {
    if (!file) return;

    const message = checkFile(file, PHOTO_RULE) ?? null;
    setRejectMessage(message);
    if (message) return;

    // Baca isi gambar supaya bisa langsung ditampilkan sebagai pratinjau.
    const reader = new FileReader();
    reader.onload = () => onChange(file, String(reader.result));
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setRejectMessage(null);
    onChange(null, null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg" className="data-[size=lg]:size-20">
        {photoUrl && <AvatarImage src={photoUrl} alt={`Foto ${name}`} className="object-cover" />}
        <AvatarFallback className="group-data-[size=lg]/avatar:typo-h4">{name.trim() ? getInitials(name) : "?"}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="sr-only"
          accept={PHOTO_RULE.extensions.map((extension) => `.${extension}`).join(",")}
          disabled={disabled}
          onChange={(event) => receiveFile(event.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
            <Camera />
            {photoUrl ? "Ganti Foto" : "Pilih Foto"}
          </Button>
          {photoUrl && (
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={removePhoto}>
              <Trash2 />
              Hapus
            </Button>
          )}
        </div>
        <p className="text-xs text-fg-tertiary">
          {describeExtensions(PHOTO_RULE)} · maks. {PHOTO_RULE.maxSizeMB} MB
        </p>
        {rejectMessage && <p className="typo-body-s text-fg-danger">{rejectMessage}</p>}
      </div>
    </div>
  );
}
