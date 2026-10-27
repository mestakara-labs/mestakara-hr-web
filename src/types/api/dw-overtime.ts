/**
 * LEMBUR DW OTOMATIS (Tahap 3 Presensi & Upah).
 *
 *   Target          = hari DW (jumlah kode DW di daftar hadir) × Rp/hari
 *   Upah Lembur DW  = upah lembur DW per tanggal (rumus lembur biasa, lihat src/lib/overtime-rules.ts), dijumlah
 *   Selisih         = Upah Lembur DW − Target
 *
 * "Hitung Rekomendasi" menyebar jam lembur acak (kelipatan 30 menit, mulai 17.00) supaya upahnya sedekat mungkin
 * dengan target. Baris Excel & rekomendasi saling menggantikan; baris manual & mobile selalu dipertahankan.
 * Label status ada di src/lib/dw-overtime-rules.ts.
 */
import type { AttendanceEmployeeWageInfo } from "./attendance";

/** Keadaan target karyawan. */
export type DwTargetStatus = "skema_belum_diatur" | "belum_ada" | "sesuai" | "kurang" | "lebih";

/** Satu karyawan di ringkasan Target vs Upah Lembur DW (GET /api/dw-overtime-targets?period=). */
export interface DwOvertimeTargetRow extends AttendanceEmployeeWageInfo {
  /** Id karyawan */
  id: string;
  registration_number: string | null;
  name: string;
  employment_status: string;
  sub_unit: { id: string; name: string; afdeling_code: string | null } | null;
  placement_objects: { id: string; name: string }[];
  /** null = skema upah belum diatur */
  wage_type: string | null;
  /** Jumlah kode DW di daftar hadir */
  dw_days: number;
  /** Gaji Pokok ÷ HKE. null = skema upah belum diatur */
  daily_rate: number | null;
  target_amount: number;
  dw_entries: number;
  dw_minutes: number;
  dw_pay: number;
  /** Upah − target: minus = kurang, plus = lebih */
  difference: number;
  status: DwTargetStatus;
  /** Jumlah baris lembur DW per sumber */
  sources: { import_excel: number; rekomendasi_sistem: number; manual: number; mobile: number };
}

/** Satu tanggal lembur hasil rekomendasi. */
export interface DwRecommendationEntry {
  date: string;
  /** "HH:MM" */
  start_time: string;
  end_time: string;
  duration_minutes: number;
  crosses_midnight: boolean;
  /** Upah lembur tanggal ini */
  pay: number;
}

/** Hasil rekomendasi satu karyawan. */
export interface DwRecommendationEmployee {
  employee_id: string;
  registration_number: string | null;
  name: string;
  position: string | null;
  sub_unit: { id: string; name: string; afdeling_code: string | null } | null;
  dw_days: number;
  daily_rate: number | null;
  target_amount: number;
  /** Baris manual/mobile yang dipertahankan & upahnya */
  kept_entries: number;
  kept_pay: number;
  /** Baris Excel/rekomendasi lama yang akan dihapus */
  replaces_entries: number;
  /** Upah manual/mobile + upah rekomendasi */
  result_pay: number;
  difference: number;
  status: DwTargetStatus;
  /** Diisi kalau karyawan dilewati, mis. "Skema upah belum diatur" */
  skipped_reason: string | null;
  /** Catatan, mis. "Tanggal yang memenuhi syarat tidak cukup untuk mencapai target" */
  notes: string[];
  entries: DwRecommendationEntry[];
}

/** Isi `data` dari POST /api/dw-overtime-recommendations/preview (TIDAK menyimpan apa pun). */
export interface DwRecommendationPreview {
  summary: {
    employees: number;
    skipped: number;
    target_amount: number;
    result_pay: number;
    difference: number;
    replaces_entries: number;
  };
  employees: DwRecommendationEmployee[];
}

/** Isian POST /api/dw-overtime-recommendations: persis hasil pratinjau (jam saja). */
export interface DwRecommendationSavePayload {
  period: string;
  employees: { employee_id: string; entries: { date: string; start_time: string; end_time: string }[] }[];
}

/** Isi `data` setelah rekomendasi disimpan. */
export interface DwRecommendationSaveResult {
  saved_employees: number;
  created_count: number;
  deleted_count: number;
}
