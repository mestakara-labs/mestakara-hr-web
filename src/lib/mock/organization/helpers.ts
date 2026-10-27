/**
 * Alat bantu untuk menulis data contoh struktur organisasi.
 *
 * Dengan `position()`, satu jabatan cukup ditulis dalam satu baris:
 *
 *   position(BIDANG, { id: "asisten-umum", title: "Asisten Umum", brm: 3,
 *                      parents: ["am-umum-legal"] })
 *
 * Kode jabatan (JAB-001, JAB-002, ...) dan karyawan contohnya (lihat
 * employees.ts) dibuat otomatis. `parents` hanya dipakai untuk membuat
 * PENUGASAN contoh beserta atasannya (lihat assignments.ts); jabatan sendiri
 * tidak menyimpan atasan.
 */
import type { PositionResource } from "@/types/api/organization";

import { createDummyEmployees, type EmployeeRecord } from "./employees";

/**
 * Jabatan seperti yang DISIMPAN di data contoh: tanpa `division_name` dan
 * `employees` (keduanya ditempelkan saat dibaca, lihat toPositionResource()
 * di organization-store.ts).
 */
export type PositionRecord = Omit<PositionResource, "division_name" | "employees">;

interface PositionInput {
  id: string;
  title: string;
  /** Level BRM: 1 = pimpinan utama (Manager), makin besar makin ke bawah. */
  brm: number;
  /** Jabatan atasan di SK (Garis Staffing). Kosongkan untuk jabatan paling atas. */
  parents?: string[];
  /** Keterangan tambahan, mis. wilayah cakupan "Bogor, Sukabumi" */
  description?: string;
  /**
   * Jumlah pegawai contoh. Isi 4 untuk jabatan yang di SK digambar
   * sebagai kotak bertumpuk (dipegang beberapa orang). Bawaan: 1.
   */
  holders?: number;
}

/** Bekal untuk membuat penugasan contoh: siapa memegang jabatan apa, dan jabatan atasannya. */
export interface SeedHolders {
  positionId: string;
  brmLevel: number;
  parentPositionIds: string[];
  employeeIds: string[];
}

/*
 * Hasil `position()` dikumpulkan di dua daftar di bawah, terisi saat file lampiran (01 … 09) dibaca.
 * Keduanya sengaja disimpan di file INI (bukan di employees.ts), supaya ikut kosong lagi
 * setiap kali file ini dimuat ulang oleh `npm run dev` — data contoh tidak pernah dobel.
 */

/** Semua karyawan contoh. */
export const seedEmployees: EmployeeRecord[] = [];

/** Semua pemegang jabatan contoh. */
export const seedHolders: SeedHolders[] = [];

/**
 * Buat satu jabatan beserta pegawai contohnya.
 * `divisionId` = id bidang (lihat divisions.ts), atau null untuk Manager.
 */
export function position(divisionId: string | null, input: PositionInput): PositionRecord {
  // Nomor urut: jabatan ke-N -> kode JAB-00N; karyawan baru melanjutkan nomor karyawan terakhir.
  const positionNumber = seedHolders.length + 1;
  const employees = createDummyEmployees(input.holders ?? 1, input.brm, seedEmployees.length + 1);

  seedEmployees.push(...employees);
  seedHolders.push({
    positionId: input.id,
    brmLevel: input.brm,
    parentPositionIds: input.parents ?? [],
    employeeIds: employees.map((employee) => employee.id),
  });

  return {
    id: input.id,
    code: `JAB-${String(positionNumber).padStart(3, "0")}`,
    title: input.title,
    division_id: divisionId,
    brm_level: input.brm,
    // Job Grade belum diketahui; diisi manual lewat Edit Jabatan.
    job_grade: null,
    description: input.description ?? null,
  };
}
