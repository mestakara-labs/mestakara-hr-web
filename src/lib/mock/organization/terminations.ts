/**
 * USULAN PENONAKTIFAN KARYAWAN seperti yang DISIMPAN di data mock.
 *
 * Data awal kosong: usulan baru tercatat lewat wizard Penonaktifan Karyawan.
 * Nama-nama (karyawan, jabatan, regu) tidak disimpan, hanya id-nya; namanya ditempelkan
 * saat dibaca (lihat termination-resource.ts).
 */
import type { StoredDocument } from "./activations";

/** Satu perubahan yang diterapkan saat usulan Berlaku, beserta nilai sebelumnya (untuk pembatalan). */
export interface EndedRecord {
  /** Id penugasan, atau id keanggotaan regu */
  id: string;
  previous_end_date: string | null;
}

/** Satu karyawan di dalam usulan. */
export interface TerminationItemRecord extends StoredDocument {
  id: string;
  employee_id: string;
  type: string;
  /** TMT nonaktif = hari pertama tidak aktif. "" = belum diisi (Draf) */
  effective_date: string;
  reason: string | null;
  destination_unit: string | null;
  notes: string | null;
  /** Penugasan jabatan yang diakhiri saat Berlaku ([] sebelum berlaku) */
  ended_assignments: EndedRecord[];
  /** Keanggotaan regu kerja yang diakhiri saat Berlaku */
  ended_memberships: EndedRecord[];
}

/** Satu usulan penonaktifan. Dokumen kolektifnya ada di isian StoredDocument. */
export interface TerminationRecord extends StoredDocument {
  id: string;
  status: string;
  document_scope: string;
  notes: string | null;
  items: TerminationItemRecord[];
  /** Riwayat atasan yang dibuat saat Berlaku (bawahan yang dialihkan) */
  supervisor_change_ids: string[];
  created_at: string;
  created_by: string;
  activated_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
}

export const mockTerminations: TerminationRecord[] = [];
