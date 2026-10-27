/**
 * DATA DASAR UPAH karyawan Casual & Daily Worker (Tetap & PKWT diurus Kantor Regional):
 *   - SKEMA UPAH   : jenis upah, Gaji Pokok, HKE, batas 20 hari, tunjangan tetap, uang makan, kelompok
 *   - REKENING BANK dan COST CENTER (untuk semua karyawan)
 *
 * Ketiganya punya RIWAYAT: setiap perubahan = catatan baru dengan "berlaku mulai" (effective_date),
 * catatan lama tidak pernah dihapus. Perhitungan upah suatu periode memakai catatan yang berlaku saat itu.
 */

// ---------------------------------------------------------------------------
// Skema upah
// ---------------------------------------------------------------------------

/** Isian skema upah yang sama di data kiriman maupun data dari server. Nominal rupiah selalu bilangan bulat. */
interface WageSchemeBase {
  /** "Harian" (dibayar per hari K) atau "Flat Bulanan" (Gaji Pokok penuh; prorata kalau masuk/berhenti di tengah bulan) */
  wage_type: string;
  /** Gaji Pokok sebulan, mis. 2375000 */
  base_salary: number;
  /** HKE (hari kerja efektif) sebulan, bawaan 25. Rp/hari = Gaji Pokok ÷ HKE. */
  working_days: number;
  /** Dibatasi maksimal `cap_days` hari kerja (kelebihannya dibayar sebagai Lembur DW) */
  is_capped: boolean;
  /** Batas hari kerja, bawaan 20. Hanya berarti kalau `is_capped`. */
  cap_days: number | null;
  /** Tunjangan Operasional & Jabatan sebulan, bawaan 0 */
  operational_position_allowance: number;
  /** Insentif sebulan, bawaan 0 */
  incentive: number;
  /** Diberi uang makan? Uang Makan = jumlah hari K × `meal_allowance_per_day`. */
  has_meal_allowance: boolean;
  /** Uang makan per hari kerja (0 kalau tidak diberi uang makan) */
  meal_allowance_per_day: number;
}

/** Isian skema upah yang DIKIRIM ke server. */
export interface WageSchemeValues extends WageSchemeBase {
  /** Kelompok Daftar Upah (legacy). null = tidak dikelompokkan (opsional). */
  payroll_group_id: string | null;
}

/** Satu catatan riwayat skema upah, seperti yang dikirim server. */
export interface WageSchemeResource extends WageSchemeBase {
  id: string;
  /** Rp/hari = Gaji Pokok ÷ HKE (dibulatkan server) */
  daily_rate: number;
  /** Kelompok Daftar Upah. null kalau tanpa kelompok. */
  payroll_group: { id: string; name: string } | null;
  /** Berlaku mulai, "YYYY-MM-DD" */
  effective_date: string;
  notes: string | null;
  /** Nama user yang mencatat; null = sistem / akun sudah dihapus */
  created_by: string | null;
  /** Waktu dicatat (ISO) */
  created_at: string;
}

/** Isian yang dikirim saat menambah catatan skema satu karyawan (POST /api/employees/{id}/wage-schemes). */
export interface WageSchemePayload extends WageSchemeValues {
  effective_date: string;
  notes: string;
}

/**
 * Ubah skema banyak karyawan sekaligus (POST /api/wage-schemes/bulk).
 * Hanya isian di `fields` yang diubah; isian lain disalin dari skema yang berlaku.
 */
export interface WageSchemeBulkPayload {
  employee_ids: string[];
  effective_date: string;
  notes: string;
  fields: Partial<WageSchemeValues>;
}

// ---------------------------------------------------------------------------
// Rekening bank & cost center (riwayat per karyawan)
// ---------------------------------------------------------------------------

/** Isian rekening bank. */
export interface BankAccountValues {
  /** Nama bank, mis. "BRI" */
  bank_name: string;
  /** Nomor rekening, angka saja (disimpan sebagai teks supaya 0 di depan aman) */
  account_number: string;
  /** Nama pemilik rekening */
  account_holder: string;
}

/** Rekening yang berlaku (dipakai juga di EmployeeProfileResource). */
export interface CurrentBankAccount extends BankAccountValues {
  effective_date: string;
}

/** Satu catatan riwayat rekening. */
export interface BankAccountResource extends CurrentBankAccount {
  id: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

/** Isian yang dikirim saat menambah catatan rekening (POST /api/employees/{id}/bank-accounts). */
export interface BankAccountPayload extends BankAccountValues {
  effective_date: string;
  notes: string;
}

/** Cost center yang berlaku (dipakai juga di EmployeeProfileResource). */
export interface CurrentCostCenter {
  id: string;
  code: string;
  name: string;
  effective_date: string;
}

/** Satu catatan riwayat cost center karyawan. */
export interface EmployeeCostCenterResource {
  id: string;
  cost_center: CurrentCostCenter;
  effective_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

/** Isian yang dikirim saat menambah catatan cost center (POST /api/employees/{id}/cost-centers). */
export interface EmployeeCostCenterPayload {
  cost_center_id: string;
  effective_date: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Daftar skema upah per periode (halaman Skema Upah Karyawan)
// ---------------------------------------------------------------------------

/**
 * Satu karyawan Casual / Daily Worker yang aktif pada periode, seperti yang dikirim
 * GET /api/wage-schemes?period=YYYY-MM. Penempatan, skema, rekening, dan cost center
 * = yang berlaku pada TANGGAL ACUAN periode (lihat src/lib/period-rules.ts).
 */
export interface WageEmployeeResource {
  /** Id karyawan */
  id: string;
  registration_number: string | null;
  name: string;
  /** "Karyawan Casual" atau "Karyawan Daily Worker" */
  employment_status: string;
  /** Jabatan utama pada tanggal acuan. null = belum ditempatkan. */
  position: string | null;
  sub_unit: { id: string; name: string; afdeling_code: string | null } | null;
  placement_objects: { id: string; name: string }[];
  /** null = skema upah belum diatur */
  wage_scheme: WageSchemeResource | null;
  /** Rp/hari = Gaji Pokok ÷ HKE (dibulatkan server). null kalau skema belum diatur. */
  daily_rate: number | null;
  bank_account: CurrentBankAccount | null;
  cost_center: CurrentCostCenter | null;
}

// ---------------------------------------------------------------------------
// Unggah Excel data upah
// ---------------------------------------------------------------------------

/** Keadaan satu baris file unggahan. */
export type WageImportRowStatus = "berubah" | "tidak berubah" | "salah";

/** Hasil pemeriksaan satu baris (POST /api/wage-schemes/import/preview). */
export interface WageImportRow {
  /** Nomor baris di file Excel */
  row: number;
  /** null kalau No. Registrasi tidak ditemukan */
  employee_id: string | null;
  registration_number: string | null;
  name: string | null;
  employment_status: string | null;
  status: WageImportRowStatus;
  /** Bagian mana yang berubah (menambah riwayat baru kalau disimpan) */
  changes: { wage_scheme: boolean; bank_account: boolean; cost_center: boolean };
  /** Kesalahan per kolom, mis. [{ column: "Gaji Pokok", message: "Harus lebih dari 0" }]. Kosong kalau tidak salah. */
  errors: { column: string; message: string }[];
}

/** Isi `data` dari POST /api/wage-schemes/import/preview. */
export interface WageImportPreview {
  rows: WageImportRow[];
  summary: { total_rows: number; changed: number; unchanged: number; invalid: number };
}
