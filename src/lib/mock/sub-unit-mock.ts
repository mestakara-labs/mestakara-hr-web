/**
 * DATA CONTOH (MOCK) MASTER SUB UNIT — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/sub-units/**. Setiap fungsi
 * mengembalikan `{ status, body }` (lihat mock-response.ts).
 */
import { checkAfdelingCode, normalizeAfdelingCode } from "@/lib/sub-unit-rules";
import type { SubUnitPayload, SubUnitResource } from "@/types/api/sub-unit";

import { failure, success, type MockResult } from "./mock-response";
import { countAssignments, createId, getStore, toSubUnitResource } from "./organization-store";

/** Pengganti backend `GET /sub-units`. */
export function mockListSubUnits(): MockResult<SubUnitResource[]> {
  return success("Daftar sub unit", getStore().subUnits.map(toSubUnitResource));
}

/** Pengganti backend `GET /sub-units/{id}`. */
export function mockGetSubUnit(id: string): MockResult<SubUnitResource | null> {
  const subUnit = getStore().subUnits.find((item) => item.id === id);
  if (!subUnit) return failure(404, "Sub unit tidak ditemukan.");

  return success("Detail sub unit", toSubUnitResource(subUnit));
}

/** Pengganti backend `POST /sub-units`. */
export function mockCreateSubUnit(payload: SubUnitPayload): MockResult<SubUnitResource | null> {
  const errors = validateSubUnit(payload, null);
  if (errors) return failure(422, "Isian sub unit belum benar.", errors);

  const subUnit = {
    id: createId("sub-unit"),
    name: payload.name.trim(),
    afdeling_code: normalizeAfdelingCode(payload.afdeling_code ?? "") || null,
    description: payload.description.trim() || null,
  };
  getStore().subUnits.push(subUnit);

  return success("Sub unit berhasil ditambahkan.", toSubUnitResource(subUnit), 201);
}

/** Pengganti backend `PUT /sub-units/{id}`. */
export function mockUpdateSubUnit(id: string, payload: SubUnitPayload): MockResult<SubUnitResource | null> {
  const subUnit = getStore().subUnits.find((item) => item.id === id);
  if (!subUnit) return failure(404, "Sub unit tidak ditemukan.");

  const errors = validateSubUnit(payload, id);
  if (errors) return failure(422, "Isian sub unit belum benar.", errors);

  subUnit.name = payload.name.trim();
  subUnit.afdeling_code = normalizeAfdelingCode(payload.afdeling_code ?? "") || null;
  subUnit.description = payload.description.trim() || null;

  return success("Sub unit berhasil diperbarui.", toSubUnitResource(subUnit));
}

/**
 * Pengganti backend `DELETE /sub-units/{id}`.
 * Sub unit yang masih tercantum di objek penempatan, atau masih dipakai penugasan, tidak boleh dihapus.
 */
export function mockDeleteSubUnit(id: string): MockResult<null> {
  const store = getStore();
  const subUnit = store.subUnits.find((item) => item.id === id);
  if (!subUnit) return failure(404, "Sub unit tidak ditemukan.");

  const objectNames = store.placementObjects
    .filter((item) => item.sub_unit_ids.includes(id))
    .map((item) => item.name);
  if (objectNames.length > 0) {
    return failure(
      409,
      `Sub unit "${subUnit.name}" masih tercantum di objek penempatan: ${objectNames.join(", ")}. Lepaskan sub unit ini dari objek-objek tersebut terlebih dahulu.`,
    );
  }

  const assignmentCount = countAssignments((assignment) => assignment.sub_unit_id === id);
  if (assignmentCount > 0) {
    return failure(
      409,
      `Sub unit "${subUnit.name}" masih dipakai di ${assignmentCount} penugasan jabatan (termasuk riwayat). Pindahkan penugasannya terlebih dahulu.`,
    );
  }

  store.subUnits = store.subUnits.filter((item) => item.id !== id);

  return success("Sub unit berhasil dihapus.", null);
}

/**
 * Periksa isian sub unit. Hasilnya pesan error per isian, atau null kalau semua benar.
 * `currentId` = id sub unit yang sedang diubah (null saat tambah baru), supaya
 * namanya sendiri tidak dianggap kembar.
 */
function validateSubUnit(payload: SubUnitPayload, currentId: string | null): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};
  const name = payload.name.trim();

  if (!name) {
    errors.name = ["Nama Sub Unit wajib diisi"];
  } else {
    const isNameUsed = getStore().subUnits.some(
      (item) => item.id !== currentId && item.name.toLowerCase() === name.toLowerCase(),
    );
    if (isNameUsed) errors.name = [`Sub unit "${name}" sudah ada`];
  }

  // Kode afdeling opsional, tapi kalau diisi tidak boleh sama dengan sub unit lain.
  const code = normalizeAfdelingCode(payload.afdeling_code ?? "");
  const codeError = checkAfdelingCode(code);
  const codeOwner = getStore().subUnits.find((item) => item.id !== currentId && item.afdeling_code === code);
  if (codeError) errors.afdeling_code = [codeError];
  else if (code && codeOwner) errors.afdeling_code = [`Kode Afdeling "${code}" sudah dipakai sub unit "${codeOwner.name}"`];

  return Object.keys(errors).length > 0 ? errors : null;
}
