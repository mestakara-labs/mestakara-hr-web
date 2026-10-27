/**
 * MUTASI & PENEMPATAN — satu "Usulan Mutasi" berisi perubahan jabatan beberapa
 * karyawan sekaligus, dengan satu SK kolektif (+ petikan SK per karyawan).
 *
 * Jenis: Penempatan Awal, Rotasi, Promosi, Demosi, Penugasan Sementara (lihat transfer-rules.ts).
 *
 * Status:
 *   Draf              -> disimpan dulu, belum selesai diisi
 *   Menunggu Dokumen  -> SK sudah dibuat dari template, menunggu scan yang ditandatangani
 *   Berlaku           -> scan SK sudah diunggah: penugasan baru dibuat, penugasan lama diakhiri,
 *                        bawahan dialihkan otomatis
 *   Dibatalkan        -> tidak jadi (kalau sebelumnya Berlaku, semua perubahannya dikembalikan)
 *
 * Di kode dan di alamat API memakai kata bahasa Inggris "transfer".
 */
import type { SignerValues } from "@/lib/signer-rules";

import type { AssignmentSupervisor } from "./assignment";
import type { UploadedFileInfo } from "./employee";
import type { SignerResource } from "./employee-activation";

/** Seseorang + jabatannya, untuk ringkasan perubahan atasan, mis. "Rina Saepudin (Asisten Umum)". */
export interface TransferPersonRef {
  name: string;
  position_title: string;
  /** true = penugasan BARU dari usulan ini (belum ada sebelum usulan berlaku) */
  is_new: boolean;
}

/** Satu perubahan atasan OTOMATIS karena usulan ini (bawahan dialihkan / dikembalikan). */
export interface TransferSupervisorChange {
  /** Penugasan bawahan yang atasannya berubah */
  assignment_id: string;
  employee_name: string;
  position_title: string;
  from: TransferPersonRef[];
  to: TransferPersonRef[];
  /** Penjelasan singkat, mis. "Atasan dimutasi; jabatan diisi pejabat baru" */
  reason: string;
}

/** Satu karyawan di dalam usulan mutasi. */
export interface TransferItemResource {
  id: string;
  employee: { id: string; name: string; nik: string | null; photo_url: string | null };

  /** Penugasan lama yang DIAKHIRI. null = tidak ada (penempatan awal, atau penugasan sementara yang merangkap). */
  from: {
    assignment_id: string;
    position_title: string;
    brm_level: number;
    job_grade: number | null;
    assignment_status: string;
    sub_unit_name: string;
    placement_object_names: string[];
  } | null;

  /** Penugasan BARU */
  to: {
    position_id: string;
    position_title: string;
    brm_level: number;
    job_grade: number | null;
    division_name: string | null;
    assignment_status: string;
    sub_unit_id: string;
    sub_unit_name: string;
    /** Objek penempatan, bisa lebih dari satu. Kosong = tanpa objek. */
    placement_object_ids: string[];
    placement_object_names: string[];
    supervisors: AssignmentSupervisor[];
    /** TMT Selesai penugasan baru (mis. untuk Plh). null = tanpa batas waktu. */
    end_date: string | null;
  };

  notes: string | null;
  /** true = bawahan yang dulu dialihkan ke atas karena jabatan ini kosong, dikembalikan ke pemegang baru */
  restore_subordinates: boolean;

  /** Scan PETIKAN SK karyawan ini (opsional). Kalau ada, menggantikan scan SK kolektif untuk karyawan ini. */
  excerpt_file: UploadedFileInfo | null;
  excerpt_file_url: string | null;

  /** Penugasan baru yang dibuat saat usulan berlaku. null = belum berlaku. */
  new_assignment_id: string | null;
}

/** Satu usulan mutasi, seperti yang dikirim GET /api/transfers. */
export interface TransferResource {
  id: string;
  /** "Penempatan Awal", "Rotasi", "Promosi", "Demosi", atau "Penugasan Sementara" */
  type: string;
  /** "Draf", "Menunggu Dokumen", "Berlaku", atau "Dibatalkan" */
  status: string;
  /** TMT berlaku penugasan baru, format "YYYY-MM-DD". null kalau belum diisi (Draf). */
  effective_date: string | null;
  notes: string | null;

  // --- Dokumen dasar (opsional, tapi sangat disarankan) ----------------------
  /** Jenis dokumen dasar mutasi, mis. "Memo", "Nota Dinas", atau "SK". null = belum diisi. */
  basis_document_type: string | null;
  basis_document_number: string | null;
  basis_document_date: string | null;
  /** File dokumen dasar. null = belum diunggah (muncul pop-up peringatan). */
  basis_document_file: UploadedFileInfo | null;
  basis_document_file_url: string | null;
  /** Penandatangan dokumen dasar (wajib kalau jenisnya SK). null = belum diisi. */
  basis_document_signer: SignerResource | null;

  // --- SK ---------------------------------------------------------------------
  /** Nomor SK, mis. "2A44/P/2026.10.09-015". null kalau belum diisi (Draf). */
  decree_number: string | null;
  decree_date: string | null;
  /** Penandatangan SK: Unit (bawaan: Manager), Kantor Regional, atau Head Office */
  signer: SignerResource | null;
  /** "Unggah" = sudah punya SK bertanda tangan; "Template" = SK dibuat dari template */
  document_mode: string | null;
  /** Scan SK KOLEKTIF yang sudah ditandatangani. Wajib supaya usulan Berlaku. */
  signed_file: UploadedFileInfo | null;
  signed_file_url: string | null;

  items: TransferItemResource[];

  /**
   * Perubahan atasan otomatis:
   *   - sebelum Berlaku : PERKIRAAN (akan terjadi saat usulan berlaku)
   *   - sesudah Berlaku : yang benar-benar terjadi
   */
  supervisor_changes: TransferSupervisorChange[];

  created_at: string;
  created_by: string;
  activated_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
}

/** Satu karyawan seperti yang DIKIRIM form ("" = kosong). */
export interface TransferItemPayload {
  /** Id baris: id lama (saat ubah) atau id sementara "baru-..." (baris baru) */
  id: string;
  employee_id: string;
  /** Penugasan lama yang diakhiri. "" = tidak ada. */
  from_assignment_id: string;
  position_id: string;
  assignment_status: string;
  sub_unit_id: string;
  /** Objek penempatan, bisa lebih dari satu. [] = tanpa objek. */
  placement_object_ids: string[];
  supervisor_assignment_ids: string[];
  /** TMT Selesai penugasan baru (opsional, mis. untuk Plh). "" = tanpa batas waktu. */
  end_date: string;
  notes: string;
  restore_subordinates: boolean;
}

/**
 * Isian teks DOKUMEN DASAR mutasi ("" = kosong), sama dengan dokumen dasar Penambahan /
 * Penonaktifan tetapi berawalan `basis_`. Aturannya di checkBasisDocument() (transfer-rules.ts).
 */
export interface BasisDocumentText {
  /** Jenis dokumen, mis. "Memo" atau "SK" (lihat STATUS_DOCUMENT_TYPES) */
  basis_document_type: string;
  basis_document_number: string;
  /** Format "YYYY-MM-DD" */
  basis_document_date: string;
  /** Penandatangan dokumen dasar (lihat SignerValues), wajib kalau jenisnya SK */
  basis_signer_source: string;
  basis_signer_assignment_id: string;
  basis_signer_name: string;
  basis_signer_position: string;
}

/**
 * Isian form usulan mutasi. Dikirim sebagai `multipart/form-data` (karena ada file):
 *   - semua isian teks di bawah (termasuk basis_document_type/number/date dari BasisDocumentText)
 *   - `items`: daftar karyawan, sebagai teks JSON
 *   - `action`: "draft" (simpan sebagai Draf) atau "submit" (simpan & lanjutkan)
 *   - file `signed_file`: scan SK bertanda tangan (jalur "Unggah"), atau
 *     `keep_signed_file` = "1" untuk mempertahankan file lama
 *   - file `basis_document_file`: dokumen dasar mutasi, atau
 *     `keep_basis_document_file` = "1" untuk mempertahankan file lama
 */
export interface TransferPayload extends BasisDocumentText, SignerValues {
  type: string;
  effective_date: string;
  notes: string;
  decree_number: string;
  decree_date: string;
  /** Penandatangan SK: signer_source + signer_assignment_id (Unit) / signer_name + signer_position (Regional / HO) */
  document_mode: string;
  items: TransferItemPayload[];
}

/** Hasil POST /api/transfers/preview: perkiraan perubahan atasan sebelum disimpan. */
export interface TransferPreviewResource {
  supervisor_changes: TransferSupervisorChange[];
  /**
   * Jumlah bawahan yang BISA dikembalikan ke pemegang baru, per jabatan:
   * { "asisten-umum": 4 }. Dipakai untuk menampilkan pilihan "Kembalikan bawahan".
   */
  restorable_counts: Record<string, number>;
}
