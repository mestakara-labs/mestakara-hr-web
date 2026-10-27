/**
 * HARI LIBUR (penanda di kalender jadwal), mis. "17 Agustus — Hari Kemerdekaan".
 * Tidak otomatis meliburkan karyawan; lihat lib/holiday-rules.ts.
 */

/** Satu hari libur, seperti yang dikirim GET /api/holidays. */
export interface HolidayResource {
  id: string;
  /** Tanggal "YYYY-MM-DD" (unik) */
  date: string;
  /** Nama hari libur, mis. "Hari Kemerdekaan RI" */
  name: string;
  /** "Libur Nasional", "Cuti Bersama", atau "Libur Perusahaan" */
  type: string;
  description: string | null;
}

/** Isian form hari libur yang dikirim saat tambah (POST) dan ubah (PUT). */
export interface HolidayPayload {
  date: string;
  name: string;
  type: string;
  description: string;
}
