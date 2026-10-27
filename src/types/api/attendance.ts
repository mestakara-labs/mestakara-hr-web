/**
 * ABSENSI karyawan Casual & Daily Worker (Tahap 2 Presensi & Upah):
 *   - DAFTAR HADIR : satu kode per karyawan per tanggal (K, DW, I, S, M, C, L; kosong = tidak masuk)
 *   - LEMBUR       : satu baris per karyawan, per tanggal, per rentang jam — jenis "reguler" atau "dw"
 *
 * Data bisa datang dari unggah Excel, aplikasi mobile (nanti), atau koreksi manual admin.
 * Prioritas: manual > mobile > Excel (Excel tidak menimpa data mobile/manual, dicatat sebagai konflik).
 * Arti kode & jenis unggahan ada di src/lib/attendance-rules.ts.
 */

/** Jenis unggahan = tiga tab di halaman Unggah Absensi. */
export type AttendanceImportType = "daftar_hadir" | "lembur_reguler" | "lembur_dw";

/** Asal data satu tanggal / satu lembur. */
export type AttendanceSource = "import_excel" | "mobile" | "manual" | "rekomendasi_sistem";

// ---------------------------------------------------------------------------
// Status unggahan per periode (GET /api/attendance-imports?period=)
// ---------------------------------------------------------------------------

/** Satu kali unggah file. */
export interface AttendanceImportBatch {
  id: string;
  file_name: string;
  /** Nama user yang mengunggah */
  uploaded_by: string | null;
  /** Waktu unggah (ISO) */
  created_at: string;
  total_rows: number;
  created_count: number;
  updated_count: number;
  deleted_count: number;
  skipped_count: number;
  conflict_count: number;
  /** "aktif" = data yang berlaku sekarang; "diganti" = sudah digantikan unggahan berikutnya */
  status?: string;
}

/** Status satu jenis unggahan pada periode itu. */
export interface AttendanceImportSection {
  import_type: AttendanceImportType;
  /** Unggahan yang berlaku. null = belum pernah diunggah. */
  active_batch: AttendanceImportBatch | null;
  /** Semua unggahan, terbaru dulu */
  batches: AttendanceImportBatch[];
  /** Jumlah data SEMUA sumber (Excel, mobile, manual, rekomendasi): karyawan berkode / baris lembur */
  entry_count: number;
}

/** Isi `data` dari GET /api/attendance-imports?period=YYYY-MM. */
export interface AttendanceImportStatus {
  period: string;
  /** "dikunci" = upah periode ini sudah dikunci; unggah & koreksi tidak bisa lagi */
  period_status: "draf" | "dikunci";
  sections: AttendanceImportSection[];
}

// ---------------------------------------------------------------------------
// Pratinjau unggahan (POST /api/attendance-imports/preview)
// ---------------------------------------------------------------------------

/** Pesan untuk satu kolom, mis. { column: "Tanggal 5", message: "Kode tidak dikenal" }. */
export interface ColumnMessage {
  column: string;
  message: string;
}

/** Tanggal yang sudah terisi dari mobile / manual dan berbeda dengan isi file (tidak akan ditimpa). */
export interface AttendanceConflict {
  date: string;
  current_code: string | null;
  current_source: AttendanceSource;
  file_code: string | null;
}

/** Hasil pemeriksaan satu baris file. */
export interface AttendanceImportRow {
  /** Nomor baris di file Excel */
  row: number;
  employee_id: string | null;
  registration_number: string | null;
  name: string | null;
  status: "benar" | "peringatan" | "salah";
  errors: ColumnMessage[];
  warnings: ColumnMessage[];
  conflicts: AttendanceConflict[];
}

/** Isi `data` dari POST /api/attendance-imports/preview. */
export interface AttendanceImportPreview {
  summary: {
    total_rows: number;
    invalid: number;
    warnings: number;
    conflicts: number;
    will_create: number;
    will_update: number;
    will_delete: number;
    unchanged: number;
  };
  rows: AttendanceImportRow[];
}

// ---------------------------------------------------------------------------
// Rekap & detail
// ---------------------------------------------------------------------------

/**
 * Identitas upah karyawan pada akhir periode (sama dengan kolom template unggahan):
 * Jabatan, Kelompok Upah (dari skema upah), Cost Center + uraiannya. null = belum ada / belum diatur.
 */
export interface AttendanceEmployeeWageInfo {
  position: string | null;
  payroll_group: { id: string; name: string } | null;
  cost_center: { id: string; code: string; name: string } | null;
}

/** Jumlah hari per kode, mis. { K: 20, DW: 2, I: 0, S: 1, M: 0, C: 0, L: 4 }. */
export type AttendanceCodeCounts = Record<"K" | "DW" | "I" | "S" | "M" | "C" | "L", number>;

/** Satu karyawan di rekap daftar hadir (GET /api/attendance-summaries?period=). */
export interface AttendanceSummaryRow extends AttendanceEmployeeWageInfo {
  /** Id karyawan */
  id: string;
  registration_number: string | null;
  name: string;
  employment_status: string;
  sub_unit: { id: string; name: string; afdeling_code: string | null } | null;
  placement_objects: { id: string; name: string }[];
  codes: AttendanceCodeCounts;
  /** Hari ketika karyawan aktif tapi belum ada kodenya (= tidak masuk) */
  blank_days: number;
  regular_overtime: { entries: number; minutes: number };
  dw_overtime: { entries: number; minutes: number };
  conflict_count: number;
  /** Peringatan singkat, mis. ["K melebihi batas 20 hari"] */
  warnings: string[];
}

/** Satu baris lembur (GET /api/overtime-entries?period=&type=). */
export interface OvertimeEntryRow extends AttendanceEmployeeWageInfo {
  id: string;
  date: string;
  /** "HH:MM" */
  start_time: string;
  end_time: string;
  duration_minutes: number;
  /** true = jam selesai keesokan harinya */
  crosses_midnight: boolean;
  description: string;
  source: AttendanceSource;
  employee: { id: string; registration_number: string | null; name: string; employment_status: string };
  sub_unit: { id: string; name: string; afdeling_code: string | null } | null;
  placement_objects: { id: string; name: string }[];
  warnings: string[];
}

/** Satu tanggal di detail absensi karyawan. */
export interface AttendanceDayDetail {
  date: string;
  /** null = kosong (tidak masuk) */
  status_code: string | null;
  source: AttendanceSource | null;
  /** false = karyawan tidak aktif pada tanggal ini (belum masuk / sudah keluar) */
  is_active: boolean;
  notes: string | null;
  updated_by: string | null;
  updated_at: string | null;
}

/** Satu lembur di detail absensi karyawan. */
export interface EmployeeOvertimeDetail {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  overtime_type: "reguler" | "dw";
  description: string;
  source: AttendanceSource;
}

/** Satu jejak perubahan kode harian. */
export interface AttendanceChangeDetail {
  id: string;
  date: string;
  /** Apa yang terjadi: "Dibuat", "Diubah", "Dihapus", "Konflik", ... */
  action: string;
  source: AttendanceSource;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
  /** Isian yang berubah, mis. [{ field: "status_code", old_value: "K", new_value: "S" }] */
  items: { field: string; old_value: string | null; new_value: string | null }[];
}

/** Isi `data` dari GET /api/employees/{id}/attendance?period=. */
export interface EmployeeAttendanceDetail {
  days: AttendanceDayDetail[];
  overtime: EmployeeOvertimeDetail[];
  changes: AttendanceChangeDetail[];
}

/**
 * Ubah satu baris lembur (PUT /api/overtime-entries/{id}); hasilnya bersumber "manual".
 * Jam selesai lebih kecil dari jam mulai = lewat tengah malam.
 */
export interface OvertimeEntryChangePayload {
  date: string;
  /** "HH:MM" */
  start_time: string;
  end_time: string;
  description: string;
  reason: string;
}

/** Tambah satu baris lembur manual (POST /api/overtime-entries). */
export interface OvertimeEntryCreatePayload extends OvertimeEntryChangePayload {
  period: string;
  employee_id: string;
  overtime_type: "reguler" | "dw";
}

/** Koreksi manual satu tanggal (PUT /api/employees/{id}/attendance). */
export interface AttendanceCorrectionPayload {
  date: string;
  /** null = kosongkan (tidak masuk) */
  status_code: string | null;
  reason: string;
}
