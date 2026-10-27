/**
 * ATURAN JABATAN yang dipakai form Jabatan (browser) DAN data mock (server),
 * supaya keduanya selalu sama.
 *
 *   BRM-1 (pimpinan utama)  -> Bidang BOLEH kosong
 *   BRM-2 sampai BRM-6      -> Bidang WAJIB diisi
 *
 * Job Grade: opsional, angka bulat 1–99 (lihat checkJobGrade).
 *
 * Atasan langsung tidak diatur di jabatan, tapi per orang (penugasan jabatan)
 * (lihat assignment-rules.ts).
 */

/** Level BRM yang tersedia: 1 = Manager sampai 6 = Pelaksana. */
export const BRM_LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6];

/** Apakah jabatan dengan level ini wajib punya Bidang? */
export function needsDivision(brmLevel: number | null): boolean {
  return brmLevel !== null && brmLevel >= 2;
}

/** Job Grade jabatan: angka bulat 1–99, OPSIONAL (null = belum diisi, tampil "-"). */
export const JOB_GRADE_MIN = 1;
export const JOB_GRADE_MAX = 99;

/** Periksa Job Grade. Hasilnya pesan error, atau undefined kalau benar / kosong. */
export function checkJobGrade(grade: number | null): string | undefined {
  if (grade === null) return undefined;
  if (!Number.isInteger(grade) || grade < JOB_GRADE_MIN || grade > JOB_GRADE_MAX) {
    return `Job Grade harus angka bulat ${JOB_GRADE_MIN}–${JOB_GRADE_MAX}`;
  }
  return undefined;
}

/** Job Grade untuk ditampilkan: 12 -> "12", null -> "-". */
export function formatJobGrade(grade: number | null | undefined): string {
  return grade === null || grade === undefined ? "-" : String(grade);
}
