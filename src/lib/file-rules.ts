/**
 * ATURAN FILE UNGGAHAN, dipakai di browser (saat memilih file) dan di server
 * (saat file diterima), supaya keduanya selalu sama.
 */

export interface FileRule {
  /** Nama isian untuk pesan error, mis. "Foto" */
  label: string;
  /** Ekstensi yang boleh, huruf kecil tanpa titik */
  extensions: string[];
  /** Ukuran maksimal dalam MB */
  maxSizeMB: number;
}

/** Foto / avatar karyawan: JPG atau PNG, maksimal 2 MB. */
export const PHOTO_RULE: FileRule = { label: "Foto", extensions: ["jpg", "jpeg", "png"], maxSizeMB: 2 };

/** File dasar penambahan karyawan (SK / Memo / Surat Penugasan): PDF, JPG, atau PNG, maksimal 5 MB. */
export const DOCUMENT_RULE: FileRule = {
  label: "File Dokumen",
  extensions: ["pdf", "jpg", "jpeg", "png"],
  maxSizeMB: 5,
};

/** File ijazah: PDF, JPG, atau PNG, maksimal 5 MB. */
export const CERTIFICATE_RULE: FileRule = { ...DOCUMENT_RULE, label: "File Ijazah" };

/** File Excel unggahan (template data upah, daftar hadir, lembur). */
export const EXCEL_RULE: FileRule = { label: "File Excel", extensions: ["xlsx"], maxSizeMB: 5 };

/** Teks format yang diterima, mis. "PDF, JPG, JPEG, PNG". */
export function describeExtensions(rule: FileRule): string {
  return rule.extensions.map((extension) => extension.toUpperCase()).join(", ");
}

/** Periksa satu file. Hasilnya pesan error, atau undefined kalau file boleh diunggah. */
export function checkFile(file: { name: string; size: number }, rule: FileRule): string | undefined {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!rule.extensions.includes(extension)) {
    return `Format ${rule.label} harus ${describeExtensions(rule)}`;
  }
  if (file.size > rule.maxSizeMB * 1024 * 1024) {
    return `Ukuran ${rule.label} maksimal ${rule.maxSizeMB} MB`;
  }

  return undefined;
}

/** 1536000 -> "1,5 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}
