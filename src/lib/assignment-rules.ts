/**
 * ATURAN PENUGASAN JABATAN yang dipakai form (browser), statistik, DAN data mock (server),
 * supaya semuanya selalu sama.
 *
 *   1. Satu jabatan boleh dipegang beberapa orang sekaligus.
 *   2. Satu karyawan hanya boleh punya SATU penugasan Definitif yang aktif.
 *      Status lain (Plt, Plh, Ptr, dst.) boleh merangkap.
 *   3. Atasan langsung wajib untuk jabatan BRM-2 ke bawah, dan harus penugasan AKTIF
 *      milik karyawan lain di jabatan dengan level BRM LEBIH TINGGI (angkanya lebih kecil).
 *   4. TMT Selesai tidak boleh lebih awal dari TMT Mulai.
 */
import { parseDate } from "./date";

/** Status jabatan. `value` = yang disimpan, `label` = yang tampil di pilihan. */
export const ASSIGNMENT_STATUS_OPTIONS = [
  { value: "Definitif", label: "Definitif" },
  { value: "Penugasan", label: "Penugasan" },
  { value: "Pj", label: "Pj (Pemangku Jabatan)" },
  { value: "Plt", label: "Plt (Pelaksana Tugas)" },
  { value: "Plh", label: "Plh (Pelaksana Harian)" },
  { value: "Ptr", label: "Ptr (Pejabat Tugas Rangkap)" },
];

/** Daftar nilai status saja: ["Definitif", "Penugasan", ...] */
export const ASSIGNMENT_STATUSES = ASSIGNMENT_STATUS_OPTIONS.map((option) => option.value);

/** Status yang hanya boleh dimiliki SATU penugasan aktif per karyawan. */
export const DEFINITIVE_STATUS = "Definitif";

/** "Plt" -> "Plt (Pelaksana Tugas)". Status yang tidak dikenal ditampilkan apa adanya. */
export function getAssignmentStatusLabel(status: string): string {
  return ASSIGNMENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

/**
 * Keadaan masa tugas sebuah penugasan pada tanggal `today`:
 *   - "Akan Datang" : TMT Mulai belum tiba (mis. SK mutasi berlaku mulai bulan depan)
 *   - "Aktif"       : sudah dimulai, dan belum ada TMT Selesai / TMT Selesai belum lewat
 *   - "Selesai"     : TMT Selesai sudah lewat
 */
export type AssignmentPeriod = "Akan Datang" | "Aktif" | "Selesai";

/** Urutan keadaan masa tugas, untuk pilihan filter. */
export const ASSIGNMENT_PERIODS: AssignmentPeriod[] = ["Aktif", "Akan Datang", "Selesai"];

export function getAssignmentPeriod(
  assignment: { start_date: string; end_date: string | null },
  today: Date = new Date(),
): AssignmentPeriod {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (parseDate(assignment.start_date) > startOfToday) return "Akan Datang";
  if (assignment.end_date && parseDate(assignment.end_date) < startOfToday) return "Selesai";
  return "Aktif";
}

/** Apakah penugasan sedang berjalan pada tanggal `today`? (lihat getAssignmentPeriod) */
export function isAssignmentActive(
  assignment: { start_date: string; end_date: string | null },
  today: Date = new Date(),
): boolean {
  return getAssignmentPeriod(assignment, today) === "Aktif";
}

/** Apakah jabatan dengan level ini wajib punya Atasan Langsung? (BRM-2 ke bawah) */
export function needsSupervisor(brmLevel: number | null): boolean {
  return brmLevel !== null && brmLevel >= 2;
}

/** Calon atasan: satu penugasan AKTIF, cukup bagian yang dibutuhkan aturan. */
interface SupervisorCandidate {
  id: string;
  employee_id: string;
  brm_level: number;
  is_active: boolean;
}

/**
 * Apakah `candidate` boleh dipilih sebagai atasan langsung?
 *
 * @param candidate     penugasan yang mau dijadikan atasan
 * @param brmLevel      level BRM jabatan yang sedang diisi (null = jabatan belum dipilih)
 * @param employeeId    karyawan yang sedang ditugaskan (tidak bisa menjadi atasan dirinya sendiri)
 * @param assignmentId  id penugasan yang sedang diubah (null saat tambah baru)
 */
export function canBeSupervisor(
  candidate: SupervisorCandidate,
  brmLevel: number | null,
  employeeId: string,
  assignmentId: string | null,
): boolean {
  if (brmLevel === null) return false;
  if (!candidate.is_active) return false;
  if (candidate.id === assignmentId) return false;
  if (candidate.employee_id === employeeId) return false;

  return candidate.brm_level < brmLevel;
}
