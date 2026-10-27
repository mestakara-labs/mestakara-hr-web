/**
 * RIWAYAT ATASAN seperti yang DISIMPAN di data mock.
 *
 * Data awal kosong: riwayat baru tercatat setelah atasan diubah lewat
 * "Ubah Atasan" atau lewat mutasi.
 */

/** Satu perubahan atasan. Atasan disimpan sebagai id PENUGASAN atasannya. */
export interface SupervisorChangeRecord {
  id: string;
  assignment_id: string;
  from_ids: string[];
  to_ids: string[];
  changed_at: string;
  changed_by: string;
  source: string;
  notes: string | null;
  /** Usulan mutasi yang menyebabkan perubahan ini. null = perubahan manual. */
  transfer_id: string | null;
  /** Usulan penonaktifan yang menyebabkan perubahan ini (bawahan dialihkan). */
  termination_id: string | null;
  /**
   * Diisi kalau bawahan DIALIHKAN KE ATAS karena jabatan atasannya kosong (pemegangnya
   * dimutasi). Dipakai untuk "kembalikan bawahan" saat jabatan itu terisi lagi.
   */
  vacated_position_id: string | null;
}

export const mockSupervisorChanges: SupervisorChangeRecord[] = [];
