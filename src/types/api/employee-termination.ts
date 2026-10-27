/**
 * USULAN PENONAKTIFAN KARYAWAN: satu atau banyak karyawan Aktif yang menjadi NONAKTIF,
 * dengan jenis Pensiun, Pensiun Dini, Mengundurkan Diri, PHK, Kontrak Berakhir,
 * Mutasi Keluar, atau Meninggal Dunia. Aturan & daftar pilihan ada di lib/termination-rules.ts.
 *
 *   Draf -> Berlaku -> (bisa) Dibatalkan
 */
import type { AssignmentSupervisor } from "./assignment";
import type { StatusDocumentPayload, StatusDocumentResource } from "./employee-activation";

/** Jabatan karyawan yang diakhiri penonaktifan. */
export interface EndedAssignmentImpact {
  assignment_id: string;
  position_title: string;
  assignment_status: string;
  sub_unit_name: string;
  /** TMT selesai jabatan = sehari sebelum TMT nonaktif */
  end_date: string;
}

/** Bawahan yang atasannya dialihkan karena atasannya dinonaktifkan. */
export interface SubordinateImpact {
  /** Penugasan bawahan */
  assignment_id: string;
  employee_name: string;
  position_title: string;
  from: AssignmentSupervisor[];
  to: AssignmentSupervisor[];
}

/** Keanggotaan regu kerja yang diakhiri. */
export interface MembershipImpact {
  member_id: string;
  group_id: string;
  group_name: string;
  /** Tanggal terakhir di regu = sehari sebelum TMT nonaktif */
  end_date: string;
}

/**
 * DAMPAK penonaktifan satu karyawan:
 *   - Draf    : perkiraan (dihitung dari data sekarang)
 *   - Berlaku : yang sudah diterapkan
 */
export interface TerminationImpact {
  ended_assignments: EndedAssignmentImpact[];
  subordinates: SubordinateImpact[];
  memberships: MembershipImpact[];
}

/** Satu karyawan di dalam usulan. */
export interface TerminationItemResource {
  id: string;
  employee: {
    id: string;
    name: string;
    nik: string | null;
    photo_url: string | null;
    employment_status: string;
    /** Status karyawan SEKARANG: "Belum Aktif", "Aktif", atau "Nonaktif" */
    active_status: string;
  };
  /** "Pensiun", "PHK", dst. */
  type: string;
  /** TMT nonaktif (hari pertama tidak aktif), "YYYY-MM-DD" ("" kalau belum diisi di Draf) */
  effective_date: string;
  /** Alasan (wajib untuk PHK & Pensiun Dini) */
  reason: string | null;
  /** Unit tujuan (Mutasi Keluar) */
  destination_unit: string | null;
  /** Dokumen per orang (dipakai kalau document_scope "Per Orang") */
  document: StatusDocumentResource | null;
  /** null untuk usulan Dibatalkan */
  impact: TerminationImpact | null;
  notes: string | null;
}

/** Satu usulan penonaktifan, seperti yang dikirim GET /api/employee-terminations. */
export interface TerminationResource {
  id: string;
  /** "Draf", "Berlaku", atau "Dibatalkan" */
  status: string;
  /** "Kolektif" atau "Per Orang" */
  document_scope: string;
  /** Dokumen kolektif (dipakai kalau document_scope "Kolektif") */
  document: StatusDocumentResource | null;
  notes: string | null;
  items: TerminationItemResource[];
  /** Jumlah karyawan yang belum punya dokumen (kolektif kosong = semua) */
  missing_document_count: number;
  created_at: string;
  created_by: string;
  activated_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
}

/** Satu karyawan di usulan yang DIKIRIM. File dokumen per orang dikirim sebagai `document_file_<id>`. */
export interface TerminationItemPayload extends StatusDocumentPayload {
  /** Id baris lama, atau id sementara "baru-..." */
  id: string;
  employee_id: string;
  type: string;
  effective_date: string;
  reason: string;
  destination_unit: string;
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
export interface TerminationPayload extends StatusDocumentPayload {
  document_scope: string;
  notes: string;
  items: TerminationItemPayload[];
}

/** Isian Pratinjau Dampak: POST /api/employee-terminations/preview */
export interface TerminationPreviewPayload {
  items: { id: string; employee_id: string; effective_date: string }[];
}

/** Hasil Pratinjau Dampak: dampak per id item. */
export type TerminationPreviewResource = Record<string, TerminationImpact>;
