/**
 * RIWAYAT ATASAN: catatan setiap kali atasan langsung sebuah penugasan diubah.
 *
 * Mengubah atasan TIDAK butuh SK (atasan bukan bagian dari jabatan seseorang),
 * jadi perubahannya dicatat di sini supaya tetap bisa ditelusuri:
 * siapa yang mengubah, kapan, dari siapa ke siapa, dan kenapa.
 */
import type { AssignmentSupervisor } from "./assignment";

/** Satu catatan perubahan atasan, seperti yang dikirim GET /api/position-assignments/{id}/supervisor-history. */
export interface SupervisorChangeResource {
  id: string;
  /** Id penugasan yang atasannya diubah */
  assignment_id: string;
  /** Atasan sebelum diubah. Kosong = sebelumnya tanpa atasan. */
  from: AssignmentSupervisor[];
  /** Atasan sesudah diubah. Kosong = sekarang tanpa atasan. */
  to: AssignmentSupervisor[];
  /** Waktu perubahan, format ISO, mis. "2026-10-09T08:15:00.000Z" */
  changed_at: string;
  /** Nama pengguna yang mengubah */
  changed_by: string;
  /** Asal perubahan: "Manual" (lewat Ubah Atasan), atau mis. "Mutasi 2A44/P/2026.10.09-1" */
  source: string;
  /** Keterangan (opsional) */
  notes: string | null;
}

/**
 * Isian Ubah Atasan yang dikirim ke POST /api/position-assignments/supervisors.
 * Satu permintaan bisa mengubah atasan BEBERAPA penugasan sekaligus.
 */
export interface SupervisorChangePayload {
  /** Penugasan yang atasannya diubah (minimal satu) */
  assignment_ids: string[];
  /** Atasan baru: id PENUGASAN atasan (boleh lebih dari satu; kosong = tanpa atasan, hanya untuk BRM-1) */
  supervisor_assignment_ids: string[];
  /** Keterangan (opsional) */
  notes: string;
}
