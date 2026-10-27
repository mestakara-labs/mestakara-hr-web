"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { PlacementCategoryResource } from "@/types/api/placement-category";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";

import { ObjekPenempatanForm } from "./ObjekPenempatanForm";

/**
 * Halaman tambah / edit objek penempatan.
 * Ambil dulu daftar kategori dan sub unit (untuk pilihan di form), lalu tampilkan form.
 *
 * @param objectId  id objek yang diedit. Kosongkan untuk menambah objek baru.
 */
export function ObjekPenempatanFormPage({ objectId }: { objectId?: string }) {
  const categoriesRequest = useApiGet<PlacementCategoryResource[]>("/api/placement-categories");
  const subUnitsRequest = useApiGet<SubUnitResource[]>("/api/sub-units");
  const objectsRequest = useApiGet<PlacementObjectResource[]>("/api/placement-objects");

  const requests = [categoriesRequest, subUnitsRequest, objectsRequest];

  if (requests.some((request) => request.loading)) {
    return <PageLoading label="Memuat data objek penempatan..." />;
  }

  const categories = categoriesRequest.data;
  const subUnits = subUnitsRequest.data;
  const placementObjects = objectsRequest.data;

  if (!categories || !subUnits || !placementObjects) {
    const error = requests.find((request) => request.error)?.error;
    return <PageError message={error ?? "Data gagal dimuat."} />;
  }

  // Mode tambah
  if (objectId === undefined) {
    return <ObjekPenempatanForm categories={categories} subUnits={subUnits} />;
  }

  // Mode edit: cari objek yang diedit di daftar objek
  const placementObject = placementObjects.find((item) => item.id === objectId);
  if (!placementObject) return <PageError message="Objek penempatan tidak ditemukan." />;

  return <ObjekPenempatanForm placementObject={placementObject} categories={categories} subUnits={subUnits} />;
}
