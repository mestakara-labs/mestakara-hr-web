/**
 * DATA CONTOH (MOCK) MASTER OBJEK PENEMPATAN — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/placement-objects/**. Setiap fungsi
 * mengembalikan `{ status, body }` (lihat mock-response.ts).
 *
 * Aturan:
 *   - Nama objek wajib dan tidak boleh kembar.
 *   - Kategori wajib (satu), Sub Unit wajib (minimal satu).
 *   - Sub unit tidak bisa DILEPAS dari objek kalau masih ada penugasan aktif
 *     di pasangan sub unit + objek itu.
 */
import { isAssignmentActive } from "@/lib/assignment-rules";
import type { PlacementObjectPayload, PlacementObjectResource } from "@/types/api/placement-object";

import { failure, success, type MockResult } from "./mock-response";
import type { PlacementObjectRecord } from "./organization/placements";
import { countAssignments, createId, getStore, toPlacementObjectResource } from "./organization-store";

/** Pengganti backend `GET /placement-objects`. */
export function mockListPlacementObjects(): MockResult<PlacementObjectResource[]> {
  return success("Daftar objek penempatan", getStore().placementObjects.map(toPlacementObjectResource));
}

/** Pengganti backend `GET /placement-objects/{id}`. */
export function mockGetPlacementObject(id: string): MockResult<PlacementObjectResource | null> {
  const placementObject = getStore().placementObjects.find((item) => item.id === id);
  if (!placementObject) return failure(404, "Objek penempatan tidak ditemukan.");

  return success("Detail objek penempatan", toPlacementObjectResource(placementObject));
}

/** Pengganti backend `POST /placement-objects`. */
export function mockCreatePlacementObject(
  payload: PlacementObjectPayload,
): MockResult<PlacementObjectResource | null> {
  const errors = validatePlacementObject(payload, null);
  if (errors) return failure(422, "Isian objek penempatan belum benar.", errors);

  const placementObject: PlacementObjectRecord = { id: createId("objek"), ...cleanPayload(payload) };
  getStore().placementObjects.push(placementObject);

  return success("Objek penempatan berhasil ditambahkan.", toPlacementObjectResource(placementObject), 201);
}

/** Pengganti backend `PUT /placement-objects/{id}`. */
export function mockUpdatePlacementObject(
  id: string,
  payload: PlacementObjectPayload,
): MockResult<PlacementObjectResource | null> {
  const placementObject = getStore().placementObjects.find((item) => item.id === id);
  if (!placementObject) return failure(404, "Objek penempatan tidak ditemukan.");

  const errors = validatePlacementObject(payload, id);
  if (errors) return failure(422, "Isian objek penempatan belum benar.", errors);

  Object.assign(placementObject, cleanPayload(payload));

  return success("Objek penempatan berhasil diperbarui.", toPlacementObjectResource(placementObject));
}

/** Pengganti backend `DELETE /placement-objects/{id}`. Objek yang masih dipakai penugasan tidak boleh dihapus. */
export function mockDeletePlacementObject(id: string): MockResult<null> {
  const store = getStore();
  const placementObject = store.placementObjects.find((item) => item.id === id);
  if (!placementObject) return failure(404, "Objek penempatan tidak ditemukan.");

  const assignmentCount = countAssignments((assignment) => assignment.placement_object_ids.includes(id));
  if (assignmentCount > 0) {
    return failure(
      409,
      `Objek "${placementObject.name}" masih dipakai di ${assignmentCount} penugasan jabatan (termasuk riwayat). Ubah penugasannya terlebih dahulu.`,
    );
  }

  store.placementObjects = store.placementObjects.filter((item) => item.id !== id);

  return success("Objek penempatan berhasil dihapus.", null);
}

/** Rapikan isian form menjadi bentuk yang disimpan (spasi dibuang, isian kosong jadi null). */
function cleanPayload(payload: PlacementObjectPayload) {
  return {
    name: payload.name.trim(),
    category_id: payload.category_id,
    sub_unit_ids: [...new Set(payload.sub_unit_ids)], // id kembar dibuang
    description: payload.description.trim() || null,
  };
}

/**
 * Periksa isian objek penempatan. Hasilnya pesan error per isian, atau null kalau semua benar.
 * `currentId` = id objek yang sedang diubah (null saat tambah baru).
 */
function validatePlacementObject(
  payload: PlacementObjectPayload,
  currentId: string | null,
): Record<string, string[]> | null {
  const { assignments, placementCategories, placementObjects, subUnits } = getStore();
  const errors: Record<string, string[]> = {};
  const name = payload.name.trim();

  // Nama: wajib dan tidak boleh kembar
  if (!name) {
    errors.name = ["Nama Objek wajib diisi"];
  } else {
    const isNameUsed = placementObjects.some(
      (item) => item.id !== currentId && item.name.toLowerCase() === name.toLowerCase(),
    );
    if (isNameUsed) errors.name = [`Objek "${name}" sudah ada`];
  }

  // Kategori: wajib dan harus ada di master Kategori Objek
  if (!payload.category_id) errors.category_id = ["Pilih Kategori"];
  else if (!placementCategories.some((item) => item.id === payload.category_id)) {
    errors.category_id = ["Kategori tidak ditemukan"];
  }

  // Sub unit: minimal satu, dan semuanya harus ada di master Sub Unit
  if (payload.sub_unit_ids.length === 0) {
    errors.sub_unit_ids = ["Pilih minimal satu Sub Unit"];
  } else if (!payload.sub_unit_ids.every((subUnitId) => subUnits.some((item) => item.id === subUnitId))) {
    errors.sub_unit_ids = ["Sub unit tidak ditemukan"];
  }

  // Sub unit yang DILEPAS tidak boleh masih dipakai penugasan aktif di objek ini.
  if (currentId && !errors.sub_unit_ids) {
    const removedButUsed = subUnits.filter(
      (subUnit) =>
        !payload.sub_unit_ids.includes(subUnit.id) &&
        assignments.some(
          (assignment) =>
            assignment.placement_object_ids.includes(currentId) &&
            assignment.sub_unit_id === subUnit.id &&
            isAssignmentActive(assignment),
        ),
    );

    if (removedButUsed.length > 0) {
      const names = removedButUsed.map((subUnit) => subUnit.name).join(", ");
      errors.sub_unit_ids = [`${names} masih punya penugasan aktif di objek ini, jadi belum bisa dilepas`];
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
