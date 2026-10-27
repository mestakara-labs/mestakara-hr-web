/**
 * ATURAN DATA KARYAWAN yang dipakai form (browser), statistik, dan data mock (server).
 */
import { addMonths, parseDate } from "./date";

/**
 * Status karyawan. NIK Karyawan WAJIB untuk Karyawan Tetap dan PKWT,
 * dan OPSIONAL untuk Karyawan Casual dan Daily Worker (lihat isNikRequired).
 */
export const EMPLOYMENT_STATUS_OPTIONS = ["Karyawan Tetap", "Karyawan PKWT", "Karyawan Casual", "Karyawan Daily Worker"];

/** Status karyawan yang wajib punya NIK Karyawan. */
const STATUSES_WITH_NIK = ["Karyawan Tetap", "Karyawan PKWT"];

/** Apakah karyawan dengan status ini wajib punya NIK Karyawan? */
export function isNikRequired(employmentStatus: string): boolean {
  return STATUSES_WITH_NIK.includes(employmentStatus);
}

/**
 * Isian biodata yang WAJIB untuk karyawan aktif: [nama isian, label].
 * Draf karyawan (Belum Aktif) cukup Nama + Status Karyawan; sisanya dilengkapi sebelum diaktifkan.
 */
export const REQUIRED_EMPLOYEE_FIELDS = [
  ["name", "Nama Lengkap"],
  ["employment_status", "Status Karyawan"],
  ["ktp_number", "No. KTP"],
  ["gender", "Jenis Kelamin"],
  ["birth_place", "Tempat Lahir"],
  ["birth_date", "Tanggal Lahir"],
  ["hire_date", "Tanggal Masuk"],
  ["religion", "Agama"],
  ["marital_status", "Status Perkawinan"],
  ["phone", "No. Telepon"],
] as const;

/** Isian wajib draf karyawan (simpan sebagai draf). */
export const DRAFT_EMPLOYEE_FIELDS = ["name", "employment_status"];

/**
 * Label isian wajib yang masih kosong, mis. ["No. KTP", "Agama"]. Kosong = data Lengkap.
 * NIK Karyawan ikut wajib untuk Karyawan Tetap & PKWT, dan minimal satu riwayat pendidikan.
 */
export function findMissingEmployeeFields(employee: Record<string, unknown>): string[] {
  const missing: string[] = REQUIRED_EMPLOYEE_FIELDS.filter(([key]) => !employee[key]).map(([, label]) => label);
  if (!employee.nik && isNikRequired(String(employee.employment_status ?? ""))) missing.push("NIK Karyawan");
  if (Array.isArray(employee.educations) && employee.educations.length === 0) missing.push("Riwayat Pendidikan");
  return missing;
}

/** Pilihan isian form. Urutannya = urutan di daftar pilihan. */
export const GENDER_OPTIONS = ["Laki-laki", "Perempuan"];
export const RELIGION_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];
export const MARITAL_STATUS_OPTIONS = ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"];
export const EDUCATION_OPTIONS = ["SD", "SMP", "SMA/SMK", "D3", "D4", "S1", "S2", "S3"];
export const RELATIONSHIP_OPTIONS = ["Suami", "Istri", "Anak"];
export const DEPENDENT_STATUS_OPTIONS = ["Ditanggung", "Tidak ditanggung"];

/**
 * Pendidikan TERAKHIR = jenjang TERTINGGI di riwayat pendidikan.
 * Tinggi-rendahnya jenjang mengikuti urutan EDUCATION_OPTIONS (SD paling rendah, S3 paling tinggi).
 * Hasilnya null kalau riwayatnya kosong.
 *
 *   [SD, SMP, SMA/SMK, S1] -> S1
 */
export function findHighestEducation<T extends { level: string }>(educations: T[]): T | null {
  let highest: T | null = null;

  for (const education of educations) {
    const isHigher =
      highest === null || EDUCATION_OPTIONS.indexOf(education.level) > EDUCATION_OPTIONS.indexOf(highest.level);
    if (isHigher) highest = education;
  }

  return highest;
}

/** Urutkan riwayat pendidikan dari jenjang tertinggi ke terendah (S3 … SD). */
export function sortByHighestEducation<T extends { level: string }>(educations: T[]): T[] {
  return [...educations].sort(
    (a, b) => EDUCATION_OPTIONS.indexOf(b.level) - EDUCATION_OPTIONS.indexOf(a.level),
  );
}

/**
 * Usia pensiun:
 *   - Karpim (karyawan pimpinan, BRM-1 s.d. BRM-3)   -> 56 tahun
 *   - Karpel (karyawan pelaksana, BRM-4 s.d. BRM-6)  -> 55 tahun
 *
 * Karyawan yang BELUM DITEMPATKAN (belum punya jabatan) memakai usia pensiun
 * karpel (55 tahun), sampai jabatannya ditentukan.
 */
export const RETIREMENT_AGE_KARPIM = 56;
export const RETIREMENT_AGE_KARPEL = 55;

/** Apakah level BRM ini termasuk karpim (BRM-1 s.d. BRM-3)? */
export function isKarpim(brmLevel: number | null): boolean {
  return brmLevel !== null && brmLevel <= 3;
}

/** Usia pensiun untuk jabatan dengan level BRM tertentu (null = belum ditempatkan). */
export function getRetirementAge(brmLevel: number | null): number {
  return isKarpim(brmLevel) ? RETIREMENT_AGE_KARPIM : RETIREMENT_AGE_KARPEL;
}

/** Tanggal pensiun = tanggal lahir + usia pensiun. */
export function getRetirementDate(birthDate: string, brmLevel: number | null): Date {
  const birth = parseDate(birthDate);
  return new Date(birth.getFullYear() + getRetirementAge(brmLevel), birth.getMonth(), birth.getDate());
}

/** Hanya karyawan TETAP yang punya masa pensiun. PKWT, Casual, dan Daily Worker ditampilkan "-". */
export function hasRetirement(employmentStatus: string): boolean {
  return employmentStatus === "Karyawan Tetap";
}

/**
 * Kategori SISA WAKTU sampai pensiun, urut dari yang paling dekat.
 * `maxMonths` = batas atasnya: karyawan masuk kategori pertama yang tanggal pensiunnya
 * ≤ hari ini + maxMonths bulan. null = tanpa batas (kategori terakhir).
 *
 *   tanggal pensiun ≤ hari ini              -> "Sudah Pensiun"
 *   tanggal pensiun ≤ hari ini + 1 bulan    -> "≤ 1 bulan"
 *   tanggal pensiun ≤ hari ini + 3 bulan    -> "> 1 ≤ 3 bulan"   ... dst.
 */
export const RETIREMENT_PERIODS: { label: string; maxMonths: number | null }[] = [
  { label: "Sudah Pensiun", maxMonths: 0 },
  { label: "≤ 1 bulan", maxMonths: 1 },
  { label: "> 1 ≤ 3 bulan", maxMonths: 3 },
  { label: "> 3 ≤ 6 bulan", maxMonths: 6 },
  { label: "> 6 bulan ≤ 1 tahun", maxMonths: 12 },
  { label: "> 1 ≤ 2 tahun", maxMonths: 24 },
  { label: "> 2 tahun", maxMonths: null },
];

/** Kategori sisa waktu pensiun pada tanggal `today`, mis. "> 3 ≤ 6 bulan" (lihat RETIREMENT_PERIODS). */
export function getRetirementPeriod(retirementDate: Date, today: Date = new Date()): string {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const period = RETIREMENT_PERIODS.find(
    (item) => item.maxMonths === null || retirementDate <= addMonths(startOfToday, item.maxMonths),
  );

  return period?.label ?? "> 2 tahun";
}
