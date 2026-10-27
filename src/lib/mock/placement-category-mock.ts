/**
 * DATA CONTOH (MOCK) MASTER KATEGORI OBJEK — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/placement-categories/**. Setiap fungsi
 * mengembalikan `{ status, body }` (lihat mock-response.ts).
 */
import type { PlacementCategoryPayload, PlacementCategoryResource } from "@/types/api/placement-category";

import { failure, success, type MockResult } from "./mock-response";
import { createId, getStore, toPlacementCategoryResource } from "./organization-store";

/** Pengganti backend `GET /placement-categories`. */
export function mockListPlacementCategories(): MockResult<PlacementCategoryResource[]> {
  return success("Daftar kategori objek", getStore().placementCategories.map(toPlacementCategoryResource));
}

/** Pengganti backend `GET /placement-categories/{id}`. */
export function mockGetPlacementCategory(id: string): MockResult<PlacementCategoryResource | null> {
  const category = getStore().placementCategories.find((item) => item.id === id);
  if (!category) return failure(404, "Kategori objek tidak ditemukan.");

  return success("Detail kategori objek", toPlacementCategoryResource(category));
}

/** Pengganti backend `POST /placement-categories`. */
export function mockCreatePlacementCategory(
  payload: PlacementCategoryPayload,
): MockResult<PlacementCategoryResource | null> {
  const errors = validateCategory(payload, null);
  if (errors) return failure(422, "Isian kategori objek belum benar.", errors);

  const category = {
    id: createId("kategori"),
    name: payload.name.trim(),
    description: payload.description.trim() || null,
  };
  getStore().placementCategories.push(category);

  return success("Kategori objek berhasil ditambahkan.", toPlacementCategoryResource(category), 201);
}

/** Pengganti backend `PUT /placement-categories/{id}`. */
export function mockUpdatePlacementCategory(
  id: string,
  payload: PlacementCategoryPayload,
): MockResult<PlacementCategoryResource | null> {
  const category = getStore().placementCategories.find((item) => item.id === id);
  if (!category) return failure(404, "Kategori objek tidak ditemukan.");

  const errors = validateCategory(payload, id);
  if (errors) return failure(422, "Isian kategori objek belum benar.", errors);

  category.name = payload.name.trim();
  category.description = payload.description.trim() || null;

  return success("Kategori objek berhasil diperbarui.", toPlacementCategoryResource(category));
}

/** Pengganti backend `DELETE /placement-categories/{id}`. Kategori yang masih dipakai objek tidak boleh dihapus. */
export function mockDeletePlacementCategory(id: string): MockResult<null> {
  const store = getStore();
  const category = store.placementCategories.find((item) => item.id === id);
  if (!category) return failure(404, "Kategori objek tidak ditemukan.");

  const objectCount = store.placementObjects.filter((item) => item.category_id === id).length;
  if (objectCount > 0) {
    return failure(
      409,
      `Kategori "${category.name}" masih dipakai oleh ${objectCount} objek penempatan. Pindahkan objeknya ke kategori lain terlebih dahulu.`,
    );
  }

  store.placementCategories = store.placementCategories.filter((item) => item.id !== id);

  return success("Kategori objek berhasil dihapus.", null);
}

/**
 * Periksa isian kategori. Hasilnya pesan error per isian, atau null kalau semua benar.
 * `currentId` = id kategori yang sedang diubah (null saat tambah baru), supaya
 * namanya sendiri tidak dianggap kembar.
 */
function validateCategory(
  payload: PlacementCategoryPayload,
  currentId: string | null,
): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};
  const name = payload.name.trim();

  if (!name) {
    errors.name = ["Nama Kategori wajib diisi"];
  } else {
    const isNameUsed = getStore().placementCategories.some(
      (item) => item.id !== currentId && item.name.toLowerCase() === name.toLowerCase(),
    );
    if (isNameUsed) errors.name = [`Kategori "${name}" sudah ada`];
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
