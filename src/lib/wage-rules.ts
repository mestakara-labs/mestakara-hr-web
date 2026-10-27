/**
 * ATURAN DATA UPAH karyawan Casual & Daily Worker.
 *
 *   Rp/hari        = Gaji Pokok ÷ HKE                    2.375.000 ÷ 25 = 95.000
 *   Upah Harian    = jumlah hari K × Rp/hari              (dihitung di Tahap Daftar Upah)
 *   Upah Flat      = Gaji Pokok penuh (prorata kalau masuk / berhenti di tengah bulan)
 *   Uang Makan     = jumlah hari K × Uang Makan per Hari  (kalau diberi uang makan)
 *
 * Karyawan Tetap & PKWT tidak punya skema upah (remunerasinya diurus Kantor Regional).
 */

/** Jenis upah. */
export const WAGE_TYPE = {
  daily: "Harian",
  flat: "Flat Bulanan",
} as const;

export const WAGE_TYPES: string[] = Object.values(WAGE_TYPE);

/** Status karyawan yang upahnya dihitung di aplikasi ini. */
export const WAGE_EMPLOYMENT_STATUSES = ["Karyawan Casual", "Karyawan Daily Worker"];

/** HKE (hari kerja efektif) bawaan. */
export const DEFAULT_WORKING_DAYS = 25;

/** Batas hari kerja bawaan untuk karyawan yang dibatasi. */
export const DEFAULT_CAP_DAYS = 20;

/** Tahun pertama data upah dicatat di aplikasi (pilihan tahun Periode paling awal di menu upah). */
export const FIRST_WAGE_YEAR = 2026;

/** Apakah karyawan dengan status ini dihitung upahnya di aplikasi ini? */
export function isWageEmployee(employmentStatus: string): boolean {
  return WAGE_EMPLOYMENT_STATUSES.includes(employmentStatus);
}

/** Rp/hari = Gaji Pokok ÷ HKE, dibulatkan ke rupiah: (2375000, 25) -> 95000. */
export function dailyRate(baseSalary: number, workingDays: number): number {
  return workingDays > 0 ? Math.round(baseSalary / workingDays) : 0;
}

/** 2375000 -> "Rp 2.375.000". */
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/**
 * Teks isian rupiah -> angka. Titik/koma/spasi/"Rp" diabaikan; kosong -> null.
 *   "2.375.000" -> 2375000   "Rp 95000" -> 95000   "" -> null
 */
export function parseRupiah(text: string): number | null {
  const digits = text.replace(/\D/g, "");
  return digits === "" ? null : Number(digits);
}

/** Angka -> teks isian berpemisah ribuan: 2375000 -> "2.375.000"; 0 -> "0". */
export function toRupiahText(amount: number | null | undefined): string {
  return amount === null || amount === undefined ? "" : amount.toLocaleString("id-ID");
}

/** Isian skema upah dalam bentuk teks (sebelum diubah ke angka), dipakai form & ubah sekaligus. */
export interface WageSchemeText {
  wage_type: string;
  base_salary: string;
  working_days: string;
  is_capped: boolean;
  cap_days: string;
  operational_position_allowance: string;
  incentive: string;
  has_meal_allowance: boolean;
  meal_allowance_per_day: string;
}

/**
 * Periksa isian skema upah. Hasilnya pesan per isian (undefined = benar).
 * Aturan sama dengan backend, supaya kesalahan terlihat sebelum dikirim.
 */
export function checkWageScheme(values: WageSchemeText): Partial<Record<keyof WageSchemeText, string>> {
  const baseSalary = parseRupiah(values.base_salary);
  const workingDays = Number(values.working_days);
  const capDays = Number(values.cap_days);
  const meal = parseRupiah(values.meal_allowance_per_day);

  return {
    wage_type: values.wage_type ? undefined : "Jenis Upah wajib dipilih",
    base_salary: baseSalary && baseSalary > 0 ? undefined : "Gaji Pokok wajib diisi dan lebih dari 0",
    working_days:
      Number.isInteger(workingDays) && workingDays >= 1 && workingDays <= 31 ? undefined : "HKE harus angka 1–31",
    cap_days:
      !values.is_capped || (Number.isInteger(capDays) && capDays >= 1 && capDays <= 31)
        ? undefined
        : "Batas hari kerja harus angka 1–31",
    meal_allowance_per_day:
      !values.has_meal_allowance || (meal !== null && meal > 0)
        ? undefined
        : "Uang Makan per Hari wajib diisi kalau diberi uang makan",
  };
}
