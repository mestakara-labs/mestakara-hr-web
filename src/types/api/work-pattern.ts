/**
 * POLA KERJA: template rotasi berupa tabel SLOT × HARI SIKLUS.
 *
 *   Pola "07–17 Tiga Shift + Tengah" (siklus 7 hari)
 *            1   2   3   4   5   6   7
 *   Slot A   P   P   P   P   L   P   P
 *   Slot B   T   T   T   L   T   T   T
 *   ...
 *
 * Setiap anggota regu menempati satu slot (lihat Regu Kerja). Sel kosong (null) = libur.
 * Di backend, isi per hari disimpan di tabel PATTERN_SLOT_DAYS; di sini dikirim
 * sebagai daftar `shift_ids` supaya mudah dipakai editor.
 */

/** Satu slot (posisi) di pola. */
export interface PatternSlotResource {
  id: string;
  /** Kode singkat, mis. "A" (unik dalam satu pola) */
  code: string;
  /** Nama posisi, mis. "Posisi 1" */
  name: string;
  /** false = slot TETAP: anggotanya tidak ikut bergilir walaupun regu memakai mode Bergilir */
  rotates: boolean;
  /**
   * Shift per hari siklus, urut dari hari ke-1. Panjangnya = cycle_days.
   * Isi: id shift, atau null = libur.
   */
  shift_ids: (string | null)[];
}

/** Satu pola kerja, seperti yang dikirim GET /api/work-patterns. */
export interface WorkPatternResource {
  id: string;
  /** Nama pola, mis. "07–17 Tiga Shift + Tengah" (unik) */
  name: string;
  /** Panjang siklus dalam hari (1–28). Hari ke-1 = Tanggal Mulai Berlaku Jadwal regu. */
  cycle_days: number;
  description: string | null;
  /** Slot urut sesuai urutan putaran (slot pertama = putaran pertama) */
  slots: PatternSlotResource[];
  /** Berapa regu kerja yang memakai pola ini (dihitung server) */
  group_count: number;
}

/** Satu slot seperti yang DIKIRIM form. Slot baru memakai id sementara "baru-...". */
export interface PatternSlotPayload {
  id: string;
  code: string;
  name: string;
  rotates: boolean;
  shift_ids: (string | null)[];
}

/** Isian form pola kerja yang dikirim saat tambah (POST) dan ubah (PUT). */
export interface WorkPatternPayload {
  name: string;
  cycle_days: number;
  description: string;
  /** Urutan di daftar = urutan putaran */
  slots: PatternSlotPayload[];
}
