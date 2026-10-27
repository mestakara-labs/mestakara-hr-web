/**
 * DATA CONTOH (MOCK) MASTER JABATAN + STRUKTUR ORGANISASI —
 * pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/positions/** dan
 * src/app/api/organization. Setiap fungsi mengembalikan `{ status, body }`
 * (lihat mock-response.ts).
 */
import { BRM_LEVEL_OPTIONS, checkJobGrade, needsDivision } from "@/lib/position-rules";
import type {
  OrganizationResource,
  PositionPayload,
  PositionResource,
} from "@/types/api/organization";

import { failure, success, type MockResult } from "./mock-response";
import { mockDecree } from "./organization";
import type { PositionRecord } from "./organization/helpers";
import { countAssignments, createId, getStore, toPositionResource } from "./organization-store";

/**
 * Pengganti backend `GET /organization`: semua jabatan beserta pegawainya.
 * Pegawai & atasannya diambil dari penugasan jabatan yang aktif.
 */
export function mockGetOrganization(): MockResult<OrganizationResource> {
  const positions = getStore().positions.map(toPositionResource);

  return success("Struktur organisasi", { ...mockDecree, positions });
}

/** Pengganti backend `GET /positions`. */
export function mockListPositions(): MockResult<PositionResource[]> {
  return success("Daftar jabatan", getStore().positions.map(toPositionResource));
}

/** Pengganti backend `GET /positions/{id}`. */
export function mockGetPosition(id: string): MockResult<PositionResource | null> {
  const position = getStore().positions.find((item) => item.id === id);
  if (!position) return failure(404, "Jabatan tidak ditemukan.");

  return success("Detail jabatan", toPositionResource(position));
}

/** Pengganti backend `POST /positions`. Jabatan baru belum punya pemegang. */
export function mockCreatePosition(payload: PositionPayload): MockResult<PositionResource | null> {
  const errors = validatePosition(payload, null);
  if (errors) return failure(422, "Isian jabatan belum benar.", errors);

  const position: PositionRecord = {
    id: createId("jabatan"),
    ...cleanPayload(payload),
  };
  getStore().positions.push(position);

  return success("Jabatan berhasil ditambahkan.", toPositionResource(position), 201);
}

/** Pengganti backend `PUT /positions/{id}`. */
export function mockUpdatePosition(
  id: string,
  payload: PositionPayload,
): MockResult<PositionResource | null> {
  const position = getStore().positions.find((item) => item.id === id);
  if (!position) return failure(404, "Jabatan tidak ditemukan.");

  const errors = validatePosition(payload, id);
  if (errors) return failure(422, "Isian jabatan belum benar.", errors);

  Object.assign(position, cleanPayload(payload));

  return success("Jabatan berhasil diperbarui.", toPositionResource(position));
}

/**
 * Pengganti backend `DELETE /positions/{id}`.
 * Jabatan yang masih dipakai penugasan (aktif maupun riwayat) tidak boleh dihapus.
 */
export function mockDeletePosition(id: string): MockResult<null> {
  const store = getStore();
  const position = store.positions.find((item) => item.id === id);
  if (!position) return failure(404, "Jabatan tidak ditemukan.");

  const assignmentCount = countAssignments((assignment) => assignment.position_id === id);
  if (assignmentCount > 0) {
    return failure(
      409,
      `"${position.title}" masih dipakai di ${assignmentCount} penugasan jabatan (termasuk riwayat). Hapus penugasannya terlebih dahulu.`,
    );
  }

  store.positions = store.positions.filter((item) => item.id !== id);

  return success("Jabatan berhasil dihapus.", null);
}

/** Job Grade dari isian: kosong / tidak dikirim -> null, selain itu angka (diperiksa checkJobGrade). */
function toJobGrade(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  return Number(value);
}

/** Rapikan isian form menjadi bentuk yang disimpan (spasi dibuang, isian kosong jadi null). */
function cleanPayload(payload: PositionPayload) {
  return {
    code: payload.code.trim(),
    title: payload.title.trim(),
    brm_level: payload.brm_level ?? 1, // sudah pasti terisi, karena lolos validatePosition
    job_grade: toJobGrade(payload.job_grade),
    division_id: payload.division_id || null,
    description: payload.description.trim() || null,
  };
}

/**
 * Periksa isian jabatan. Hasilnya pesan error per isian, atau null kalau semua benar.
 * `currentId` = id jabatan yang sedang diubah (null saat tambah baru).
 */
function validatePosition(
  payload: PositionPayload,
  currentId: string | null,
): Record<string, string[]> | null {
  const { divisions, positions } = getStore();
  const errors: Record<string, string[]> = {};
  const code = payload.code.trim();

  // Kode: wajib dan tidak boleh kembar
  if (!code) {
    errors.code = ["Kode wajib diisi"];
  } else {
    const isCodeUsed = positions.some(
      (item) => item.id !== currentId && item.code.toLowerCase() === code.toLowerCase(),
    );
    if (isCodeUsed) errors.code = [`Kode "${code}" sudah dipakai jabatan lain`];
  }

  // Nama jabatan: wajib
  if (!payload.title.trim()) errors.title = ["Nama Jabatan wajib diisi"];

  // Job Grade: opsional, angka bulat 1–99
  const jobGradeError = checkJobGrade(toJobGrade(payload.job_grade));
  if (jobGradeError) errors.job_grade = [jobGradeError];

  // Level BRM: wajib dan harus 1–6
  if (payload.brm_level === null || !BRM_LEVEL_OPTIONS.includes(payload.brm_level)) {
    errors.brm_level = ["Pilih Level BRM"];
    return errors; // aturan di bawah bergantung pada level BRM
  }

  // Bidang: wajib mulai BRM-2, dan harus ada di master Bidang
  if (!payload.division_id) {
    if (needsDivision(payload.brm_level)) errors.division_id = ["Pilih Bidang"];
  } else if (!divisions.some((item) => item.id === payload.division_id)) {
    errors.division_id = ["Bidang tidak ditemukan"];
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
