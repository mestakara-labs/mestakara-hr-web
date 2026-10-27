/**
 * Hitungan untuk kartu statistik di halaman Data Karyawan.
 */
import type { StatItem } from "@/components/shared/StatBarList";
import { getAge, toDateText } from "@/lib/date";
import { EDUCATION_OPTIONS, EMPLOYMENT_STATUS_OPTIONS, isKarpim } from "@/lib/employee-rules";
import type { EmployeeProfileResource } from "@/types/api/employee";

import { getEmployeeRetirement } from "./employee-retirement";

/** Karyawan dianggap "menjelang pensiun" kalau sisa waktunya sebanyak ini atau kurang. */
export const NEAR_RETIREMENT_YEARS = 2;

/**
 * Kelompok usia. `max` = usia tertinggi yang masih masuk kelompok itu.
 * Contoh: usia 34 masuk "25–34 tahun".
 */
const AGE_GROUPS = [
  { label: "< 25 tahun", max: 24 },
  { label: "25–34 tahun", max: 34 },
  { label: "35–44 tahun", max: 44 },
  { label: "45–54 tahun", max: 54 },
  { label: "≥ 55 tahun", max: Infinity },
];

export interface EmployeeStats {
  total: number;
  male: number;
  female: number;
  /** Rata-rata usia (yang tanggal lahirnya terisi), dibulatkan ke 1 angka di belakang koma */
  averageAge: number;
  /** Jumlah karyawan per kelompok usia */
  ageGroups: StatItem[];
  /** Jumlah karyawan per pendidikan terakhir (yang jumlahnya 0 tidak ditampilkan) */
  educations: StatItem[];
  /** Jumlah karyawan per status karyawan (Tetap, PKWT, Casual, Daily Worker) */
  employmentStatuses: StatItem[];
  /** Karpim = BRM-1 s.d. BRM-3 */
  karpim: number;
  /** Karpel = BRM-4 s.d. BRM-6 */
  karpel: number;
  /** Belum memegang jabatan apa pun */
  unplaced: number;
  /** Sisa waktu sampai pensiun ≤ NEAR_RETIREMENT_YEARS tahun */
  nearRetirement: number;
}

/** Hitung semua angka statistik karyawan sekaligus. */
export function calculateEmployeeStats(employees: EmployeeProfileResource[], today: Date = new Date()): EmployeeStats {
  // Tanggal lahir yang belum diisi tidak ikut dihitung di usia.
  const birthDates = employees.flatMap((employee) => (employee.birth_date ? [employee.birth_date] : []));
  const ages = birthDates.map((birthDate) => getAge(birthDate, today));
  const totalAge = ages.reduce((sum, age) => sum + age, 0);

  // Batas "menjelang pensiun": hari ini + 2 tahun
  const nearRetirementLimit = new Date(today.getFullYear() + NEAR_RETIREMENT_YEARS, today.getMonth(), today.getDate());

  return {
    total: employees.length,
    male: employees.filter((employee) => employee.gender === "Laki-laki").length,
    female: employees.filter((employee) => employee.gender === "Perempuan").length,
    averageAge: ages.length === 0 ? 0 : Math.round((totalAge / ages.length) * 10) / 10,

    ageGroups: AGE_GROUPS.map((group, index) => {
      const min = index === 0 ? 0 : AGE_GROUPS[index - 1].max + 1;
      return { label: group.label, count: ages.filter((age) => age >= min && age <= group.max).length };
    }),

    educations: EDUCATION_OPTIONS.map((education) => ({
      label: education,
      count: employees.filter((employee) => employee.education === education).length,
    })).filter((item) => item.count > 0),

    employmentStatuses: EMPLOYMENT_STATUS_OPTIONS.map((status) => ({
      // "Karyawan PKWT" -> "PKWT", supaya labelnya ringkas
      label: status.replace("Karyawan ", ""),
      count: employees.filter((employee) => employee.employment_status === status).length,
    })),

    karpim: employees.filter((employee) => employee.position && isKarpim(employee.position.brm_level)).length,
    karpel: employees.filter((employee) => employee.position && !isKarpim(employee.position.brm_level)).length,
    unplaced: employees.filter((employee) => employee.position === null).length,

    // Sama dengan kolom Tanggal Pensiun: hanya karyawan Tetap yang sudah ditempatkan.
    nearRetirement: employees.filter((employee) => {
      const retirement = getEmployeeRetirement(employee, today);
      return retirement !== null && retirement.date <= toDateText(nearRetirementLimit);
    }).length,
  };
}

/** 72 dari 210 -> "34%". */
export function toPercent(count: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((count / total) * 100)}%`;
}
