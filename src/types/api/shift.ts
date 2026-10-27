/**
 * SHIFT (master jam kerja), mis. "Pagi 07.00–12.00" atau "Malam 22.00–06.00".
 *
 * Shift hanya berisi JAM. Siapa masuk shift apa di tanggal berapa diatur oleh
 * Pola Kerja -> Regu Kerja -> Jadwal Kerja.
 */

/** Satu shift, seperti yang dikirim GET /api/shifts. */
export interface ShiftResource {
  id: string;
  /** Kode singkat yang tampil di kalender jadwal, mis. "P", "T", "M" (unik) */
  code: string;
  /** Nama shift, mis. "Pagi" (unik) */
  name: string;
  /** Jam mulai "HH:MM", mis. "07:00" */
  start_time: string;
  /** Jam selesai "HH:MM". Lebih kecil/sama dengan jam mulai = selesai keesokan harinya. */
  end_time: string;
  /** Lama istirahat dalam menit (tidak dihitung jam kerja) */
  break_minutes: number;
  /** Terlambat sampai sekian menit masih dianggap tepat waktu */
  late_tolerance_minutes: number;
  /** Scan masuk sah mulai sekian menit SEBELUM jam mulai */
  checkin_window_before_minutes: number;
  /** Scan pulang sah sampai sekian menit SETELAH jam selesai */
  checkout_window_after_minutes: number;
  /** Warna penanda di kalender, HEX mis. "#1BAA4E" */
  color: string;
  description: string | null;

  // --- Dihitung server -----------------------------------------------------
  /** true = selesai keesokan harinya, mis. 22:00–06:00 */
  crosses_midnight: boolean;
  /** Lama shift dalam menit, termasuk istirahat */
  duration_minutes: number;
  /** Jam kerja bersih dalam menit (lama shift − istirahat) */
  work_minutes: number;
  /** Berapa pola kerja yang memakai shift ini (shift yang dipakai tidak bisa dihapus) */
  pattern_count: number;
}

/** Isian form shift yang dikirim saat tambah (POST) dan ubah (PUT). */
export interface ShiftPayload {
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  late_tolerance_minutes: number;
  checkin_window_before_minutes: number;
  checkout_window_after_minutes: number;
  color: string;
  description: string;
}
