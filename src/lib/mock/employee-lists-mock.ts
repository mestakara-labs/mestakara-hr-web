/**
 * Membaca & memeriksa DAFTAR di form karyawan (mode mock):
 *   - riwayat pendidikan  -> FormData "educations"      (teks JSON) + file "certificate_file_<id>"
 *   - data batih          -> FormData "family_members"  (teks JSON)
 *
 * Setiap fungsi mengembalikan `{ items, errors }`:
 *   items  = daftar yang siap disimpan
 *   errors = pesan kesalahan, mis. ["Pendidikan ke-2 (S1): Tahun Lulus wajib diisi"]; kosong = semua benar
 * readEducations juga mengembalikan `newCertificateFiles`: file ijazah BARU per id pendidikan
 * (supaya isinya bisa disimpan, lihat employee-mock.ts).
 */
import { parseDate } from "@/lib/date";
import {
  DEPENDENT_STATUS_OPTIONS,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/lib/employee-rules";
import { CERTIFICATE_RULE, checkFile } from "@/lib/file-rules";
import type {
  EducationItem,
  EducationPayloadItem,
  FamilyMemberItem,
  FamilyMemberPayloadItem,
} from "@/types/api/employee";

import { createId } from "./organization-store";

/** Baca teks JSON dari FormData. Hasilnya [] kalau kosong atau bukan JSON yang benar. */
function readJsonList<T>(form: FormData, key: string): T[] {
  try {
    const value = JSON.parse(String(form.get(key) ?? "[]"));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

/** Teks kosong -> null; selain itu dirapikan (spasi di awal/akhir dibuang). */
function textOrNull(value: string | undefined): string | null {
  return value?.trim() || null;
}

/** Benar kalau berupa tahun 4 digit, mis. "2015". */
function isYear(value: string): boolean {
  return /^\d{4}$/.test(value);
}

/**
 * Riwayat pendidikan.
 * `currentEducations` = riwayat yang tersimpan sekarang (saat ubah), untuk mempertahankan file ijazah lama.
 */
export function readEducations(form: FormData, currentEducations: EducationItem[]) {
  const rows = readJsonList<EducationPayloadItem>(form, "educations");
  const errors: string[] = [];
  /** File ijazah baru: { id pendidikan (tetap): File } */
  const newCertificateFiles = new Map<string, File>();

  // Minimal satu riwayat pendidikan diperiksa di employee-mock.ts (draf karyawan boleh belum punya).
  const items = rows.map((row, index): EducationItem => {
    // Baris baru dari browser belum punya id tetap (diawali "baru-").
    const id = row.id && !row.id.startsWith("baru-") ? row.id : createId("pendidikan");
    const label = `Pendidikan ke-${index + 1}${row.level ? ` (${row.level})` : ""}`;

    if (!EDUCATION_OPTIONS.includes(row.level)) errors.push(`${label}: Pilih Jenjang`);
    if (!isYear(row.graduation_year ?? "")) errors.push(`${label}: Tahun Lulus harus 4 digit tahun`);
    if (row.start_year && !isYear(row.start_year)) errors.push(`${label}: Tahun Masuk harus 4 digit tahun`);
    if (isYear(row.start_year ?? "") && isYear(row.graduation_year ?? "") && row.start_year > row.graduation_year) {
      errors.push(`${label}: Tahun Lulus tidak boleh lebih awal dari Tahun Masuk`);
    }

    // File ijazah: file baru, atau file lama kalau ditandai dipertahankan.
    const newFile = form.get(`certificate_file_${row.id}`);
    let certificateFile: EducationItem["certificate_file"] = null;

    if (newFile instanceof File && newFile.size > 0) {
      const fileError = checkFile(newFile, CERTIFICATE_RULE);
      if (fileError) errors.push(`${label}: ${fileError}`);
      certificateFile = { name: newFile.name, size: newFile.size, type: newFile.type };
      newCertificateFiles.set(id, newFile);
    } else if (row.keep_certificate_file) {
      certificateFile = currentEducations.find((item) => item.id === row.id)?.certificate_file ?? null;
    }

    return {
      id,
      level: row.level,
      institution: textOrNull(row.institution),
      major: textOrNull(row.major),
      city: textOrNull(row.city),
      start_year: textOrNull(row.start_year),
      graduation_year: row.graduation_year,
      gpa: textOrNull(row.gpa),
      title_front: textOrNull(row.title_front),
      title_back: textOrNull(row.title_back),
      certificate_number: textOrNull(row.certificate_number),
      certificate_file: certificateFile,
    };
  });

  return { items, errors, newCertificateFiles };
}

/** Data batih (keluarga inti). */
export function readFamilyMembers(form: FormData) {
  const rows = readJsonList<FamilyMemberPayloadItem>(form, "family_members");
  const errors: string[] = [];

  const items = rows.map((row, index): FamilyMemberItem => {
    const label = `Anggota batih ke-${index + 1}${row.name ? ` (${row.name})` : ""}`;

    if (!RELATIONSHIP_OPTIONS.includes(row.relationship)) errors.push(`${label}: Pilih Hubungan`);
    if (!row.name?.trim()) errors.push(`${label}: Nama Lengkap wajib diisi`);
    if (!GENDER_OPTIONS.includes(row.gender)) errors.push(`${label}: Pilih Jenis Kelamin`);
    if (!row.birth_date) errors.push(`${label}: Pilih Tanggal Lahir`);
    else if (parseDate(row.birth_date) > new Date()) errors.push(`${label}: Tanggal Lahir tidak boleh melewati hari ini`);
    if (row.ktp_number && !/^\d{16}$/.test(row.ktp_number)) errors.push(`${label}: No. KTP harus 16 digit angka`);
    if (!DEPENDENT_STATUS_OPTIONS.includes(row.dependent_status)) errors.push(`${label}: Pilih Status Tanggungan`);

    return {
      id: row.id && !row.id.startsWith("baru-") ? row.id : createId("batih"),
      relationship: row.relationship,
      name: row.name?.trim() ?? "",
      ktp_number: textOrNull(row.ktp_number),
      gender: row.gender,
      birth_place: textOrNull(row.birth_place),
      birth_date: row.birth_date,
      occupation: textOrNull(row.occupation),
      dependent_status: row.dependent_status,
    };
  });

  return { items, errors };
}
