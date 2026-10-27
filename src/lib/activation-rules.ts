/**
 * ATURAN PENAMBAHAN KARYAWAN (usulan Penambahan), dipakai wizard (browser) DAN data mock (server).
 *
 * Satu usulan = satu atau banyak karyawan yang menjadi AKTIF di unit ini:
 *
 *   Draf ──(Simpan & Berlakukan)──> Berlaku ──(Batalkan)──> Dibatalkan
 *
 * Dokumen dasar penambahan OPSIONAL (hanya unggah, tanpa template), bisa:
 *   - Kolektif  : satu dokumen untuk semua karyawan di usulan
 *   - Per Orang : dokumen sendiri untuk setiap karyawan
 */
import { checkSigner, type SignerValues } from "./signer-rules";

export const ACTIVATION_STATUS = {
  draft: "Draf",
  effective: "Berlaku",
  cancelled: "Dibatalkan",
} as const;

export const ACTIVATION_STATUSES = Object.values(ACTIVATION_STATUS) as string[];

/** Dasar penambahan setiap karyawan. */
export const ACTIVATION_TYPE = {
  /** Karyawan baru direkrut */
  newHire: "Penerimaan Baru",
  /** Pindahan dari unit / regional / anak perusahaan lain */
  transferIn: "Mutasi Masuk",
  /** Karyawan yang pernah dinonaktifkan kembali bekerja */
  reactivation: "Pengaktifan Kembali",
} as const;

export const ACTIVATION_TYPES = Object.values(ACTIVATION_TYPE) as string[];

/** Pilihan jenis + keterangan singkat (untuk pilihan di wizard). */
export const ACTIVATION_TYPE_OPTIONS = [
  { value: ACTIVATION_TYPE.newHire, description: "Karyawan baru hasil rekrutmen." },
  { value: ACTIVATION_TYPE.transferIn, description: "Pindahan dari unit, regional, atau anak perusahaan lain." },
  { value: ACTIVATION_TYPE.reactivation, description: "Karyawan yang pernah dinonaktifkan kembali bekerja." },
];

export const DOCUMENT_SCOPE = {
  collective: "Kolektif",
  perPerson: "Per Orang",
} as const;

export const DOCUMENT_SCOPES = Object.values(DOCUMENT_SCOPE) as string[];

/** Jenis dokumen dasar penambahan / penonaktifan. Penandatangan wajib kalau jenisnya SK. */
export const STATUS_DOCUMENT_TYPES = ["SK", "Memo", "Nota Dinas", "Disposisi", "Surat Permohonan", "Lainnya"];
export const SK_DOCUMENT_TYPE = "SK";

/** Status karyawan (dihitung dari riwayat penambahan & penonaktifan). */
export const EMPLOYEE_ACTIVE_STATUS = {
  pending: "Belum Aktif",
  active: "Aktif",
  inactive: "Nonaktif",
} as const;

export const EMPLOYEE_ACTIVE_STATUSES = Object.values(EMPLOYEE_ACTIVE_STATUS) as string[];

/** Usulan yang masih bisa diubah isinya (hanya Draf). */
export function isActivationEditable(status: string): boolean {
  return status === ACTIVATION_STATUS.draft;
}

/** Jenis penambahan yang boleh dipilih untuk karyawan dengan status ini. */
export function allowedActivationTypes(employeeStatus: string): string[] {
  return employeeStatus === EMPLOYEE_ACTIVE_STATUS.inactive
    ? [ACTIVATION_TYPE.transferIn, ACTIVATION_TYPE.reactivation]
    : [ACTIVATION_TYPE.newHire, ACTIVATION_TYPE.transferIn];
}

/** Isian satu dokumen dasar ("" = kosong). File diperiksa terpisah. */
export interface StatusDocumentValues extends SignerValues {
  document_type: string;
  document_number: string;
  document_date: string;
}

/** Apakah ada isian dokumen yang sudah diisi (termasuk file)? */
export function hasDocument(values: StatusDocumentValues, hasFile: boolean): boolean {
  return Boolean(values.document_type || values.document_number.trim() || values.document_date || hasFile);
}

/**
 * Periksa satu dokumen dasar. Dokumen boleh kosong seluruhnya, tetapi kalau salah satu
 * isiannya diisi, jenis, nomor, tanggal, dan file wajib; penandatangan wajib kalau jenisnya SK.
 * `required` = dokumen wajib ada (dipakai penonaktifan).
 * Hasilnya pesan error per isian; kunci file = "document_file".
 */
export function checkStatusDocument(
  values: StatusDocumentValues,
  hasFile: boolean,
  required = false,
): Record<string, string> {
  if (!required && !hasDocument(values, hasFile)) return {};

  const errors: Record<string, string> = {};
  if (!values.document_type) errors.document_type = "Pilih Jenis Dokumen";
  else if (!STATUS_DOCUMENT_TYPES.includes(values.document_type)) errors.document_type = "Jenis Dokumen tidak dikenal";
  if (!values.document_number.trim()) errors.document_number = "Nomor Dokumen wajib diisi";
  if (!values.document_date) errors.document_date = "Pilih Tanggal Dokumen";
  if (!hasFile) errors.document_file = "Unggah file dokumen";

  const signerErrors = checkSigner(values, values.document_type === SK_DOCUMENT_TYPE);
  return { ...errors, ...(signerErrors as Record<string, string>) };
}
