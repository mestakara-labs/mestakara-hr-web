/**
 * DATA KARYAWAN (master Kepegawaian): biografi, dokumen dasar penambahan,
 * riwayat pendidikan, dan data batih (keluarga inti).
 *
 * Jangan tertukar dengan `EmployeeResource` di organization.ts — itu versi
 * ringkas seorang pegawai untuk BAGAN organisasi (nama, kontak, atasan).
 */
import type { CurrentBankAccount, CurrentCostCenter } from "./wage";

/** Keterangan sebuah file yang diunggah (isi filenya tidak ikut dikirim). */
export interface UploadedFileInfo {
  /** Nama file, mis. "SK-Pengangkatan.pdf" */
  name: string;
  /** Ukuran dalam byte */
  size: number;
  /** Jenis file, mis. "application/pdf" */
  type: string;
}

/** Satu riwayat pendidikan, mis. S1 Akuntansi Universitas Padjadjaran lulus 2015. */
export interface EducationItem {
  id: string;
  /** Jenjang, mis. "S1" (lihat EDUCATION_OPTIONS) */
  level: string;
  institution: string | null;
  /** Jurusan / program studi */
  major: string | null;
  city: string | null;
  /** Tahun masuk, mis. "2011" */
  start_year: string | null;
  /** Tahun lulus, mis. "2015" */
  graduation_year: string;
  /** IPK atau nilai, mis. "3,45" atau "87,5" */
  gpa: string | null;
  /** Gelar di depan nama, mis. "Ir." */
  title_front: string | null;
  /** Gelar di belakang nama, mis. "S.E." */
  title_back: string | null;
  /** Nomor ijazah */
  certificate_number: string | null;
  /** File ijazah. null kalau belum diunggah. */
  certificate_file: UploadedFileInfo | null;
}

/** Riwayat pendidikan seperti yang dikirim server: ditambah alamat file ijazahnya. */
export interface EducationResource extends EducationItem {
  /** Alamat untuk membuka file ijazah. null kalau belum diunggah. */
  certificate_file_url: string | null;
}

/** Satu anggota batih (keluarga inti): suami/istri atau anak. */
export interface FamilyMemberItem {
  id: string;
  /** "Suami", "Istri", atau "Anak" */
  relationship: string;
  name: string;
  /** No. KTP / NIK kependudukan, 16 digit. null kalau tidak diisi. */
  ktp_number: string | null;
  gender: string;
  birth_place: string | null;
  /** Format "YYYY-MM-DD" */
  birth_date: string;
  occupation: string | null;
  /** "Ditanggung" atau "Tidak ditanggung" */
  dependent_status: string;
}

/**
 * Satu karyawan, seperti yang dikirim GET /api/employees.
 *
 * Dengan `?period=YYYY-MM` (Periode Data), isian `active_status`, `inactive_since`, `service_months`,
 * dan `position` dihitung pada TANGGAL ACUAN periode itu (lihat lib/period-rules.ts).
 * Isian lain selalu data terbaru. Tanpa `period` = keadaan hari ini.
 */
export interface EmployeeProfileResource {
  id: string;

  // --- Data biografi ---------------------------------------------------------
  /** "Karyawan Tetap", "Karyawan PKWT", "Karyawan Casual", atau "Karyawan Daily Worker" */
  employment_status: string;
  /**
   * Nomor induk karyawan, mis. "20230001".
   * Wajib untuk Karyawan Tetap & PKWT; boleh null untuk Casual & Daily Worker.
   */
  nik: string | null;
  /** No. Registrasi karyawan, mis. "01070577040088". null kalau belum ada. */
  registration_number: string | null;
  name: string;
  // Isian biodata di bawah boleh null: draf (Belum Aktif) dan data awal dari Excel belum tentu lengkap.
  /** Nomor KTP (NIK kependudukan), 16 digit */
  ktp_number: string | null;
  gender: "Laki-laki" | "Perempuan" | null;
  birth_place: string | null;
  /** Format "YYYY-MM-DD" */
  birth_date: string | null;
  /** Tanggal Masuk (TMT mulai bekerja), "YYYY-MM-DD". Dasar perhitungan masa kerja. */
  hire_date: string | null;
  religion: string | null;
  marital_status: string | null;
  /** Nomor telepon (wajib untuk karyawan aktif) */
  phone: string | null;
  /** Nomor WhatsApp. null = sama dengan nomor telepon. */
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  /** Alamat gambar foto. null kalau belum ada foto. */
  photo_url: string | null;

  // --- Pendidikan -------------------------------------------------------------
  /** Semua pendidikan yang pernah ditempuh, urut dari jenjang tertinggi */
  educations: EducationResource[];
  /** Pendidikan terakhir = jenjang tertinggi di `educations` (dihitung server), mis. "S1" */
  education: string;
  /** Jurusan pendidikan terakhir (dihitung server). null kalau tidak ada. */
  major: string | null;

  // --- Data batih ---------------------------------------------------------------
  family_members: FamilyMemberItem[];

  // --- Status kepegawaian (dihitung server dari usulan Penambahan / Penonaktifan) -------
  /**
   * "Belum Aktif" (draf dari wizard Penambahan, atau TMT belum tiba), "Aktif", atau "Nonaktif".
   * Dasar penambahan & dokumennya ada di Riwayat Status Kepegawaian (GET /employees/{id}/status-history).
   */
  active_status: string;
  /** TMT nonaktif terakhir; null kalau tidak sedang nonaktif */
  inactive_since: string | null;
  /** Masa kerja dalam bulan penuh, TANPA masa nonaktif (0 kalau belum pernah aktif) */
  service_months: number;
  /** Isian wajib biodata yang belum diisi, mis. ["No. KTP", "Agama"]. Kosong = Lengkap. */
  missing_fields: string[];

  // --- Penempatan (diisi server; diatur terpisah dari form ini) -------------
  /** Jabatan yang dipegang. null = belum ditempatkan. */
  position: { id: string; title: string; brm_level: number; job_grade: number | null } | null;

  // --- Data upah yang berlaku (riwayat lengkapnya di tab Rekening & Cost Center) ---
  /** Rekening bank yang berlaku. null = belum diisi. (Opsional: belum dikirim backend versi lama.) */
  bank_account?: CurrentBankAccount | null;
  /** Cost center yang berlaku. null = belum diisi. */
  cost_center?: CurrentCostCenter | null;
}

/**
 * Isian teks form karyawan. Dikirim sebagai `multipart/form-data` (karena ada file):
 *   - semua isian di bawah
 *   - `educations` dan `family_members`: daftar, dikirim sebagai teks JSON
 *   - file: `photo` dan `certificate_file_<id pendidikan>` (kalau dipilih)
 *   - `save_mode`: "draft" = cukup Nama + Status Karyawan (karyawan Belum Aktif); selain itu semua isian wajib diperiksa
 *   - `activation_id` (opsional): usulan Penambahan (Draf) tempat karyawan baru ini dimasukkan
 */
export interface EmployeeProfilePayload {
  employment_status: string;
  nik: string;
  /** No. Registrasi (opsional), tidak boleh sama dengan karyawan lain */
  registration_number: string;
  name: string;
  ktp_number: string;
  gender: string;
  birth_place: string;
  birth_date: string;
  hire_date: string;
  religion: string;
  marital_status: string;
  phone: string;
  /** Kosongkan ("") kalau sama dengan nomor telepon */
  whatsapp: string;
  email: string;
  address: string;
}

/**
 * Satu riwayat pendidikan seperti yang DIKIRIM form: semua isian berupa teks
 * ("" = kosong). File ijazahnya dikirim terpisah sebagai `certificate_file_<id>`.
 */
export type EducationPayloadItem = {
  [K in Exclude<keyof EducationItem, "certificate_file">]: string;
} & {
  /** true = file ijazah lama dipertahankan (saat ubah) */
  keep_certificate_file: boolean;
};

/** Satu anggota batih seperti yang DIKIRIM form: semua isian berupa teks ("" = kosong). */
export type FamilyMemberPayloadItem = { [K in keyof FamilyMemberItem]: string };
