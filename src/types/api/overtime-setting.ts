/**
 * PENGATURAN LEMBUR (satu set untuk seluruh unit).
 *
 * Aturan pengali mengikuti regulasi yang berlaku (PP 35/2021), tapi disimpan sebagai pengaturan
 * supaya bisa diubah admin tanpa mengubah kode kalau regulasinya berubah.
 * Rumus lengkapnya ada di src/lib/overtime-rules.ts.
 * Penanda tangan SPKL & Daftar Upah diatur di menu Penanda Tangan (src/types/api/signature.ts).
 */

/** Isi GET /api/overtime-settings, sekaligus isian PUT /api/overtime-settings. */
export interface OvertimeSettingValues {
  /** Tarif lembur per jam = Gaji Pokok ÷ angka ini (173) */
  hourly_divisor: number;
  /** Pengali jam lembur ke-1 (1,5) */
  first_hour_multiplier: number;
  /** Pengali jam lembur ke-2 dan seterusnya (2) */
  next_hour_multiplier: number;
  /** Batas jam lembur per hari (4) */
  max_hours_per_day: number;
  /** Batas jam lembur per minggu (18) */
  max_hours_per_week: number;
  /** Upah lembur dibulatkan ke kelipatan ini, dalam rupiah (100) */
  rounding: number;
  /** Jam mulai bawaan rekomendasi Lembur DW, "HH:MM" (17:00) */
  dw_default_start_time: string;
  /** Uraian pekerjaan bawaan rekomendasi Lembur DW */
  dw_default_description: string;
  /** Jam lembur rekomendasi dibuat kelipatan menit ini (30) */
  time_step_minutes: number;
}

/** Pengaturan seperti yang dikirim server: ditambah kapan & oleh siapa terakhir diubah. */
export interface OvertimeSettingResource extends Omit<OvertimeSettingValues, "dw_default_description"> {
  /** null = belum diisi admin (wajib diisi sebelum disimpan) */
  dw_default_description: string | null;
  /** null kalau belum pernah diubah (masih nilai bawaan) */
  updated_at: string | null;
  /** Nama user yang terakhir mengubah */
  updated_by: string | null;
}
