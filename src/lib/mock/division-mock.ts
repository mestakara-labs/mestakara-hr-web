/**
 * DATA CONTOH (MOCK) MASTER BIDANG — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/divisions/**. Setiap fungsi
 * mengembalikan `{ status, body }` (lihat mock-response.ts).
 */
import type { DivisionPayload, DivisionResource } from "@/types/api/division";

import { failure, success, type MockResult } from "./mock-response";
import { createId, getStore, toDivisionResource } from "./organization-store";

/** Pengganti backend `GET /divisions`. */
export function mockListDivisions(): MockResult<DivisionResource[]> {
  const divisions = getStore().divisions.map(toDivisionResource);

  return success("Daftar bidang", divisions);
}

/** Pengganti backend `GET /divisions/{id}`. */
export function mockGetDivision(id: string): MockResult<DivisionResource | null> {
  const division = getStore().divisions.find((item) => item.id === id);
  if (!division) return failure(404, "Bidang tidak ditemukan.");

  return success("Detail bidang", toDivisionResource(division));
}

/** Pengganti backend `POST /divisions`. */
export function mockCreateDivision(payload: DivisionPayload): MockResult<DivisionResource | null> {
  const errors = validateDivision(payload, null);
  if (errors) return failure(422, "Isian bidang belum benar.", errors);

  const division = {
    id: createId("bidang"),
    code: payload.code.trim(),
    name: payload.name.trim(),
    description: payload.description.trim() || null,
  };
  getStore().divisions.push(division);

  return success("Bidang berhasil ditambahkan.", toDivisionResource(division), 201);
}

/** Pengganti backend `PUT /divisions/{id}`. */
export function mockUpdateDivision(
  id: string,
  payload: DivisionPayload,
): MockResult<DivisionResource | null> {
  const division = getStore().divisions.find((item) => item.id === id);
  if (!division) return failure(404, "Bidang tidak ditemukan.");

  const errors = validateDivision(payload, id);
  if (errors) return failure(422, "Isian bidang belum benar.", errors);

  division.code = payload.code.trim();
  division.name = payload.name.trim();
  division.description = payload.description.trim() || null;

  return success("Bidang berhasil diperbarui.", toDivisionResource(division));
}

/** Pengganti backend `DELETE /divisions/{id}`. Bidang yang masih dipakai jabatan tidak boleh dihapus. */
export function mockDeleteDivision(id: string): MockResult<null> {
  const store = getStore();
  const division = store.divisions.find((item) => item.id === id);
  if (!division) return failure(404, "Bidang tidak ditemukan.");

  const { position_count } = toDivisionResource(division);
  if (position_count > 0) {
    return failure(
      409,
      `Bidang "${division.name}" masih dipakai oleh ${position_count} jabatan. Pindahkan jabatannya ke bidang lain terlebih dahulu.`,
    );
  }

  store.divisions = store.divisions.filter((item) => item.id !== id);

  return success("Bidang berhasil dihapus.", null);
}

/**
 * Periksa isian bidang. Hasilnya pesan error per isian, atau null kalau semua benar.
 * `currentId` = id bidang yang sedang diubah (null saat tambah baru), supaya
 * kodenya sendiri tidak dianggap kembar.
 */
function validateDivision(
  payload: DivisionPayload,
  currentId: string | null,
): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};
  const code = payload.code.trim();

  if (!code) {
    errors.code = ["Kode wajib diisi"];
  } else {
    const isCodeUsed = getStore().divisions.some(
      (item) => item.id !== currentId && item.code.toLowerCase() === code.toLowerCase(),
    );
    if (isCodeUsed) errors.code = [`Kode "${code}" sudah dipakai bidang lain`];
  }

  if (!payload.name.trim()) errors.name = ["Nama Bidang wajib diisi"];

  return Object.keys(errors).length > 0 ? errors : null;
}
