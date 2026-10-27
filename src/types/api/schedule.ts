/**
 * JADWAL KERJA RESMI: jadwal satu regu untuk satu bulan (PERIODE), berisi satu baris
 * per karyawan per tanggal. Dibuat dari pola & rotasi regu, lalu boleh diubah per sel.
 * Status periode & aturannya ada di lib/schedule-period-rules.ts.
 */

/** Satu baris jadwal: satu karyawan pada satu tanggal. */
export interface ScheduleEntryResource {
  id: string;
  employee: { id: string; name: string };
  /** Keanggotaan regu asal baris ini */
  member_id: string;
  work_date: string;
  /** Shift hari itu. null = libur. */
  shift_id: string | null;
  /** Salinan jam saat jadwal dibuat, "YYYY-MM-DDTHH:MM". null = libur. Tidak ikut berubah kalau master shift diubah. */
  planned_start: string | null;
  planned_end: string | null;
  /** Slot yang dipakai hari itu menurut rotasi, mis. "A" */
  slot_code: string | null;
  /** Shift menurut pola (sebelum diubah manual). null = libur. */
  generated_shift_id: string | null;
  /** "Generator" atau "Manual" */
  source: string;
  /** Berapa kali baris ini diubah */
  change_count: number;
}

/** Shift yang jumlah orangnya kurang dari kebutuhan pola pada suatu tanggal. */
export interface ScheduleVacancy {
  date: string;
  shift_id: string;
  /** Kekurangan orang, mis. 1 */
  missing: number;
}

/** Satu periode jadwal, seperti yang dikirim GET /api/schedule-periods. */
export interface SchedulePeriodResource {
  id: string;
  group: { id: string; name: string };
  /** Bulan "YYYY-MM" */
  month: string;
  /** "Draf", "Terbit", atau "Terkunci" */
  status: string;
  generated_at: string;
  generated_by: string;
  published_at: string | null;
  published_by: string | null;
  locked_at: string | null;
  locked_by: string | null;
  /** Jumlah sel yang diubah manual */
  manual_count: number;
  /** Jumlah hari yang punya shift kekurangan orang */
  vacancy_days: number;
  /**
   * Jumlah sel yang tidak sesuai lagi dengan pola & anggota regu terbaru
   * (mis. setelah anggota keluar/masuk). > 0 = sebaiknya "Buat Ulang dari Tanggal".
   */
  outdated_count: number;
}

/** Detail periode: GET /api/schedule-periods/{id} */
export interface SchedulePeriodDetailResource extends SchedulePeriodResource {
  dates: string[];
  entries: ScheduleEntryResource[];
  vacancies: ScheduleVacancy[];
}

/** Buat jadwal: POST /api/schedule-periods */
export interface CreateSchedulePeriodPayload {
  group_id: string;
  month: string;
}

/** Ubah satu sel jadwal: PUT /api/schedules/{id}. shift_id "" = libur. */
export interface UpdateSchedulePayload {
  shift_id: string;
  /** Wajib kalau periode sudah Terbit */
  reason: string;
}

/** Satu riwayat perubahan jadwal: GET /api/schedules/{id}/changes */
export interface ScheduleChangeResource {
  id: string;
  old_shift_id: string | null;
  new_shift_id: string | null;
  reason: string | null;
  changed_by: string;
  changed_at: string;
}

// ---------------------------------------------------------------------------
// Buat ulang jadwal (regenerasi) dari tanggal tertentu
// ---------------------------------------------------------------------------

/** Isian buat ulang: POST /api/schedule-periods/{id}/regenerate(/preview) */
export interface RegeneratePayload {
  /** Mulai tanggal ini sampai akhir bulan periode, "YYYY-MM-DD" */
  from_date: string;
  /** true = sel yang sudah diubah manual TIDAK ditimpa */
  keep_manual: boolean;
  /** Wajib kalau jadwal sudah Terbit (dicatat di riwayat setiap sel yang berubah) */
  reason: string;
}

/** Satu baris perubahan di pratinjau buat ulang. */
export interface RegenerateChange {
  employee_name: string;
  date: string;
  /** null = libur / belum ada baris */
  old_shift_id: string | null;
  new_shift_id: string | null;
}

/** Hasil pratinjau buat ulang (belum diterapkan). */
export interface RegeneratePreviewResource {
  from_date: string;
  /** Baris baru (mis. anggota pengganti) */
  added: RegenerateChange[];
  /** Baris yang dihapus (mis. anggota sudah keluar) */
  removed: RegenerateChange[];
  /** Baris yang shift-nya berubah */
  changed: RegenerateChange[];
  /** Ubahan manual yang berbeda dari pola baru dan DIPERTAHANKAN (keep_manual) */
  conflicts: RegenerateChange[];
  unchanged_count: number;
}
