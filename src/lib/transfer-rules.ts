/**
 * ATURAN MUTASI & PENEMPATAN yang dipakai form (browser) DAN data mock (server).
 *
 * Aturan per karyawan (selain aturan penugasan di assignment-rules.ts):
 *   - Penempatan Awal     -> hanya untuk karyawan yang BELUM punya penugasan aktif;
 *                            tidak ada penugasan lama yang diakhiri
 *   - Rotasi, Promosi, Demosi -> WAJIB memilih penugasan lama yang diakhiri
 *   - Penugasan Sementara -> penugasan lama BOLEH diakhiri, boleh juga merangkap (tidak diakhiri)
 *   - Satu karyawan tidak boleh ada di dua usulan yang belum selesai (Draf / Menunggu Dokumen)
 */
import type { BasisDocumentText } from "@/types/api/transfer";

import { checkStatusDocument, type StatusDocumentValues } from "./activation-rules";
import { toDateText } from "./date";

/** Jenis mutasi. `description` tampil sebagai keterangan pilihan. */
export const TRANSFER_TYPE_OPTIONS = [
  { value: "Penempatan Awal", description: "Karyawan yang belum punya jabatan ditempatkan untuk pertama kali" },
  { value: "Rotasi", description: "Pindah ke jabatan setara" },
  { value: "Promosi", description: "Naik ke jabatan yang lebih tinggi" },
  { value: "Demosi", description: "Turun ke jabatan yang lebih rendah" },
  { value: "Penugasan Sementara", description: "Plt, Plh, Pj, atau tugas rangkap (Ptr)" },
];

/** Daftar nilai jenis saja: ["Penempatan Awal", "Rotasi", ...] */
export const TRANSFER_TYPES = TRANSFER_TYPE_OPTIONS.map((option) => option.value);

export const INITIAL_PLACEMENT = "Penempatan Awal";
export const TEMPORARY_ASSIGNMENT = "Penugasan Sementara";

/** Status usulan mutasi. */
export const TRANSFER_STATUS = {
  draft: "Draf",
  waiting: "Menunggu Dokumen",
  effective: "Berlaku",
  cancelled: "Dibatalkan",
} as const;

export const TRANSFER_STATUSES = Object.values(TRANSFER_STATUS) as string[];

/** Cara menyiapkan dokumen SK. */
export const DOCUMENT_MODE = {
  /** Sudah punya SK bertanda tangan -> langsung diunggah, usulan langsung Berlaku */
  upload: "Unggah",
  /** SK dibuat dari template -> Menunggu Dokumen sampai scan bertanda tangan diunggah */
  template: "Template",
} as const;

export const DOCUMENT_MODES = Object.values(DOCUMENT_MODE) as string[];

/**
 * DOKUMEN DASAR mutasi (dokumen yang menjadi alasan mutasi, mis. Memo / Nota Dinas / SK) memakai
 * aturan yang SAMA dengan dokumen dasar Penambahan & Penonaktifan (checkStatusDocument), hanya
 * nama isiannya berawalan `basis_`. Dua fungsi di bawah menerjemahkan nama isiannya:
 *
 *   basis_document_type  <->  document_type        basis_signer_source  <->  signer_source   (dst.)
 */
export function toStatusDocument(document: BasisDocumentText): StatusDocumentValues {
  return {
    document_type: document.basis_document_type,
    document_number: document.basis_document_number,
    document_date: document.basis_document_date,
    signer_source: document.basis_signer_source,
    signer_assignment_id: document.basis_signer_assignment_id,
    signer_name: document.basis_signer_name,
    signer_position: document.basis_signer_position,
  };
}

export function fromStatusDocument(document: StatusDocumentValues): BasisDocumentText {
  return {
    basis_document_type: document.document_type,
    basis_document_number: document.document_number,
    basis_document_date: document.document_date,
    basis_signer_source: document.signer_source,
    basis_signer_assignment_id: document.signer_assignment_id,
    basis_signer_name: document.signer_name,
    basis_signer_position: document.signer_position,
  };
}

/**
 * Pemeriksaan DOKUMEN DASAR mutasi, dipakai form (browser) DAN data mock (server):
 *   - seluruhnya opsional, tapi sangat disarankan;
 *   - kalau salah satu isiannya diisi, Jenis, Nomor, Tanggal, dan File WAJIB;
 *   - penandatangan wajib kalau jenisnya SK.
 *
 * Hasilnya { nama isian: pesan } dengan awalan `basis_`. Kosong = sudah benar.
 *
 *   checkBasisDocument({ basis_document_type: "Memo", basis_document_number: "", ... }, true)
 *   -> { basis_document_number: "Nomor Dokumen wajib diisi", ... }
 */
export function checkBasisDocument(document: BasisDocumentText, hasFile: boolean): Record<string, string> {
  const errors = checkStatusDocument(toStatusDocument(document), hasFile);
  return Object.fromEntries(Object.entries(errors).map(([field, message]) => [`basis_${field}`, message]));
}

/** Apakah jenis ini WAJIB mengakhiri penugasan lama? (Rotasi, Promosi, Demosi) */
export function requiresFromAssignment(type: string): boolean {
  return type !== INITIAL_PLACEMENT && type !== TEMPORARY_ASSIGNMENT;
}

/** Apakah usulan dengan status ini masih bisa diubah? (Draf & Menunggu Dokumen) */
export function isTransferEditable(status: string): boolean {
  return status === TRANSFER_STATUS.draft || status === TRANSFER_STATUS.waiting;
}

/**
 * Nomor SK bawaan: "2A44/P/{tahun}.{bulan}.{tanggal}-", mengikuti tanggal SK.
 * Nomor urut di belakang tanda "-" sengaja dikosongkan, untuk diisi manual.
 *
 *   suggestDecreeNumber("2026-10-09") -> "2A44/P/2026.10.09-"
 */
export function suggestDecreeNumber(decreeDate: string): string {
  const [year, month, day] = decreeDate.split("-");
  return `2A44/P/${year}.${month}.${day}-`;
}

/** TMT Selesai penugasan lama = sehari SEBELUM TMT penugasan baru. "2026-11-01" -> "2026-10-31". */
export function dayBefore(dateText: string): string {
  const [year, month, day] = dateText.split("-").map(Number);
  return toDateText(new Date(year, month - 1, day - 1));
}
