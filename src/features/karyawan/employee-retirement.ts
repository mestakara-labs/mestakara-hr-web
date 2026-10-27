/**
 * PENSIUN KARYAWAN: tanggal & kategori pensiun satu karyawan, dan filter
 * "pensiun pada periode Januari 2027 s.d. Juni 2027" di halaman Data Karyawan.
 *
 * Aturan dasarnya (usia pensiun, kategori) ada di lib/employee-rules.ts.
 * Dipisah dari file tampilan (KaryawanTable.tsx, RetirementFilter.tsx) supaya mudah diuji & diubah.
 */
import { MONTH_NAMES, toDateText } from "@/lib/date";
import { getRetirementAge, getRetirementDate, getRetirementPeriod, hasRetirement } from "@/lib/employee-rules";
import type { EmployeeProfileResource } from "@/types/api/employee";

/** Pensiun satu karyawan. */
export interface RetirementInfo {
  /** Tanggal pensiun "YYYY-MM-DD" */
  date: string;
  /** Usia pensiunnya (55 atau 56) */
  age: number;
  /** Kategori sisa waktu, mis. "> 3 ≤ 6 bulan" (lihat RETIREMENT_PERIODS) */
  period: string;
}

/**
 * Pensiun seorang karyawan. null = karyawan bukan Tetap (tidak punya masa pensiun), belum
 * ditempatkan (usia pensiunnya belum bisa ditentukan), atau tanggal lahirnya belum diisi.
 * Usia pensiun mengikuti level BRM jabatan utamanya (karpim 56, karpel 55).
 */
export function getEmployeeRetirement(employee: EmployeeProfileResource, today: Date = new Date()): RetirementInfo | null {
  // Draf karyawan bisa belum punya tanggal lahir.
  if (!hasRetirement(employee.employment_status) || !employee.birth_date || !employee.position) return null;

  const brmLevel = employee.position.brm_level;
  const date = getRetirementDate(employee.birth_date, brmLevel);

  return {
    date: toDateText(date),
    age: getRetirementAge(brmLevel),
    period: getRetirementPeriod(date, today),
  };
}

// ---------------------------------------------------------------------------
// Filter rentang periode pensiun
// ---------------------------------------------------------------------------

/** Satu ujung periode: bulan "1".."12" dan tahun "2027". "" = belum dipilih. */
export interface MonthYear {
  month: string;
  year: string;
}

/**
 * Isian filter "Pensiun pada periode":
 *   - Dari saja        -> pensiun mulai bulan itu
 *   - Sampai saja      -> pensiun sampai bulan itu
 *   - Dari & Sampai    -> pensiun di antara keduanya (termasuk kedua bulan itu)
 * Satu ujung baru dipakai kalau bulan DAN tahunnya sudah dipilih.
 */
export interface RetirementFilterValue {
  from: MonthYear;
  to: MonthYear;
}

export const EMPTY_RETIREMENT_FILTER: RetirementFilterValue = {
  from: { month: "", year: "" },
  to: { month: "", year: "" },
};

/** Pilihan bulan: { value: "1", label: "Januari" } ... { value: "12", label: "Desember" }. */
export const MONTH_OPTIONS = MONTH_NAMES.map((name, index) => ({ value: String(index + 1), label: name }));

/** Ujung periode -> teks "YYYY-MM" supaya mudah dibandingkan. null = belum lengkap. */
function toMonthKey(value: MonthYear): string | null {
  if (!value.month || !value.year) return null;
  return `${value.year}-${value.month.padStart(2, "0")}`;
}

/** Ujung periode -> "Januari 2027". */
function toMonthLabel(value: MonthYear): string {
  return `${MONTH_NAMES[Number(value.month) - 1]} ${value.year}`;
}

/** Apakah filter sudah dipakai? (minimal satu ujung periode lengkap) */
export function isRetirementFilterActive(filter: RetirementFilterValue): boolean {
  return toMonthKey(filter.from) !== null || toMonthKey(filter.to) !== null;
}

/** Pesan kalau periodenya terbalik ("Dari" lebih akhir dari "Sampai"). null = periode benar. */
export function checkRetirementFilter(filter: RetirementFilterValue): string | null {
  const from = toMonthKey(filter.from);
  const to = toMonthKey(filter.to);
  return from && to && from > to ? "Periode awal tidak boleh lebih akhir dari periode akhir." : null;
}

/**
 * Pilihan tahun: dari tahun pensiun paling awal sampai paling akhir di antara karyawan Tetap,
 * tanpa ada tahun yang terlewat. Cth. ["2025", "2026", ..., "2050"].
 */
export function retirementYearOptions(employees: EmployeeProfileResource[]): string[] {
  const years = employees
    .map((employee) => getEmployeeRetirement(employee)?.date.slice(0, 4))
    .filter((year): year is string => year !== undefined)
    .map(Number);
  if (years.length === 0) return [];

  const first = Math.min(...years);
  const last = Math.max(...years);
  return Array.from({ length: last - first + 1 }, (_, index) => String(first + index));
}

/**
 * Karyawan yang pensiun di dalam periode filter. Filter belum dipakai -> semua karyawan.
 * Kalau filter dipakai, karyawan non-Tetap otomatis tidak ikut (tidak punya tanggal pensiun).
 */
export function filterByRetirement(
  employees: EmployeeProfileResource[],
  filter: RetirementFilterValue,
): EmployeeProfileResource[] {
  if (!isRetirementFilterActive(filter) || checkRetirementFilter(filter)) return employees;

  const from = toMonthKey(filter.from);
  const to = toMonthKey(filter.to);

  return employees.filter((employee) => {
    const retirement = getEmployeeRetirement(employee);
    if (!retirement) return false;

    const month = retirement.date.slice(0, 7); // "YYYY-MM"
    return (from === null || month >= from) && (to === null || month <= to);
  });
}

/**
 * Kalimat periode filter:
 *   "Januari 2027 s.d. Juni 2027", "mulai Januari 2027", atau "sampai Juni 2027".
 */
export function describeRetirementFilter(filter: RetirementFilterValue): string {
  const hasFrom = toMonthKey(filter.from) !== null;
  const hasTo = toMonthKey(filter.to) !== null;

  if (hasFrom && hasTo) return `${toMonthLabel(filter.from)} s.d. ${toMonthLabel(filter.to)}`;
  if (hasFrom) return `mulai ${toMonthLabel(filter.from)}`;
  return `sampai ${toMonthLabel(filter.to)}`;
}
