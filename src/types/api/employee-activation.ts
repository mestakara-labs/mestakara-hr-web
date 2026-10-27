/**
 * USULAN PENAMBAHAN KARYAWAN: satu atau banyak karyawan yang menjadi AKTIF di unit ini,
 * dengan dasar Penerimaan Baru, Mutasi Masuk, atau Pengaktifan Kembali.
 * Aturan & daftar pilihan ada di lib/activation-rules.ts.
 *
 *   Draf -> Berlaku -> (bisa) Dibatalkan
 */
import type { AssignmentSupervisor } from "./assignment";
import type { UploadedFileInfo } from "./employee";

/** Penandatangan dokumen (lihat lib/signer-rules.ts). */
export interface SignerResource {
  /** "Unit", "Kantor Regional", atau "Head Office" */
  source: string;
  /** Penugasan pejabat (hanya kalau sumbernya Unit) */
  assignment_id: string | null;
  /** Nama & jabatan: dari penugasan (Unit) atau diketik (Regional / Head Office) */
  name: string;
  position_title: string;
}

/** Satu dokumen dasar (kolektif di usulan, atau per orang di item). */
export interface StatusDocumentResource {
  /** "SK", "Memo", "Nota Dinas", "Disposisi", "Surat Permohonan", atau "Lainnya" */
  type: string;
  number: string;
  /** "YYYY-MM-DD" */
  date: string;
  file: UploadedFileInfo | null;
  /** Alamat untuk membuka file. null kalau belum diunggah. */
  file_url: string | null;
  signer: SignerResource | null;
}

/** Rencana penempatan jabatan satu karyawan (opsional). Menjadi penugasan saat usulan Berlaku. */
export interface PlacementPlanResource {
  position_id: string;
  position_title: string;
  brm_level: number;
  job_grade: number | null;
  assignment_status: string;
  sub_unit_id: string;
  sub_unit_name: string;
  placement_object_ids: string[];
  placement_object_names: string[];
  supervisors: AssignmentSupervisor[];
  /** TMT selesai (mis. Plh). null = tanpa batas. */
  end_date: string | null;
}

/** Satu karyawan di dalam usulan. */
export interface ActivationItemResource {
  id: string;
  employee: {
    id: string;
    name: string;
    nik: string | null;
    photo_url: string | null;
    employment_status: string;
    /** Status karyawan SEKARANG: "Belum Aktif", "Aktif", atau "Nonaktif" */
    active_status: string;
    /** Isian wajib biodata yang belum diisi (kosong = Lengkap) */
    missing_fields: string[];
  };
  /** "Penerimaan Baru", "Mutasi Masuk", atau "Pengaktifan Kembali" */
  type: string;
  /** TMT aktif di unit ini, "YYYY-MM-DD" ("" kalau belum diisi di Draf) */
  effective_date: string;
  /** Unit asal (Mutasi Masuk) */
  origin_unit: string | null;
  /** Dokumen per orang (dipakai kalau document_scope "Per Orang") */
  document: StatusDocumentResource | null;
  placement: PlacementPlanResource | null;
  /** Penugasan yang dibuat saat usulan Berlaku */
  new_assignment_id: string | null;
  notes: string | null;
}

/** Satu usulan penambahan, seperti yang dikirim GET /api/employee-activations. */
export interface ActivationResource {
  id: string;
  /** "Draf", "Berlaku", atau "Dibatalkan" */
  status: string;
  /** "Kolektif" atau "Per Orang" */
  document_scope: string;
  /** Dokumen kolektif (dipakai kalau document_scope "Kolektif") */
  document: StatusDocumentResource | null;
  notes: string | null;
  items: ActivationItemResource[];
  /** Jumlah karyawan yang belum punya dokumen (kolektif kosong = semua) */
  missing_document_count: number;
  created_at: string;
  created_by: string;
  activated_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
}

/** Isian dokumen + penandatangan yang DIKIRIM ("" = kosong). */
export interface StatusDocumentPayload {
  document_type: string;
  document_number: string;
  document_date: string;
  signer_source: string;
  signer_assignment_id: string;
  signer_name: string;
  signer_position: string;
}

/** Rencana penempatan yang DIKIRIM. has_placement false = karyawan ini belum ditempatkan. */
export interface PlacementPlanPayload {
  has_placement: boolean;
  position_id: string;
  assignment_status: string;
  sub_unit_id: string;
  placement_object_ids: string[];
  supervisor_assignment_ids: string[];
  end_date: string;
}

/** Satu karyawan di usulan yang DIKIRIM. File dokumen per orang dikirim sebagai `document_file_<id>`. */
export interface ActivationItemPayload extends StatusDocumentPayload, PlacementPlanPayload {
  /** Id baris lama, atau id sementara "baru-..." */
  id: string;
  employee_id: string;
  type: string;
  effective_date: string;
  origin_unit: string;
  notes: string;
  /** true = file dokumen per orang yang lama dipertahankan */
  keep_document_file: boolean;
}

/**
 * Isian usulan, dikirim sebagai `multipart/form-data`:
 *   - isian teks di bawah; `items` sebagai teks JSON
 *   - `action`: "draft" (Simpan sebagai Draf) atau "submit" (Simpan & Berlakukan)
 *   - file: `document_file` (kolektif) dan `document_file_<id item>` (per orang)
 *   - `keep_document_file` = "1" kalau file kolektif lama dipertahankan
 */
export interface ActivationPayload extends StatusDocumentPayload {
  document_scope: string;
  notes: string;
  items: ActivationItemPayload[];
}

/** Riwayat status kepegawaian satu karyawan: GET /api/employees/{id}/status-history */
export interface EmployeeStatusEvent {
  /** "Penambahan" (menjadi aktif) atau "Penonaktifan" */
  kind: string;
  /** Jenis, mis. "Penerimaan Baru", "Mutasi Masuk" */
  type: string;
  effective_date: string;
  /** Status usulannya, mis. "Berlaku" */
  status: string;
  /** Usulan asal (untuk tautan ke detail) */
  source_id: string;
  source_url: string;
  /** Keterangan singkat, mis. "Unit asal: PTPN I Regional 1" */
  description: string | null;
  document: StatusDocumentResource | null;
}
