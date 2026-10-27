"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";

import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { apiDelete } from "@/lib/http-client";
import type { PlacementCategoryResource } from "@/types/api/placement-category";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";

import { ObjekPenempatanTable } from "./ObjekPenempatanTable";

/**
 * Halaman daftar master Objek Penempatan.
 *
 * Alurnya:
 *   1. Ambil semua objek penempatan, ditambah kategori & sub unit (untuk pilihan filter tabel)
 *   2. Tampilkan di ObjekPenempatanTable (cari, filter, urut, dan halaman diurus DataTable)
 *   3. Hapus objek penempatan lewat dialog konfirmasi, lalu muat ulang datanya
 */
export function ObjekPenempatanListPage() {
  const objectsRequest = useApiGet<PlacementObjectResource[]>("/api/placement-objects");
  const categoriesRequest = useApiGet<PlacementCategoryResource[]>("/api/placement-categories");
  const subUnitsRequest = useApiGet<SubUnitResource[]>("/api/sub-units");

  const requests = [objectsRequest, categoriesRequest, subUnitsRequest];
  const loading = requests.some((request) => request.loading);
  const error = requests.find((request) => request.error)?.error ?? null;

  const placementObjects = objectsRequest.data;
  const categories = categoriesRequest.data;
  const subUnits = subUnitsRequest.data;

  const hapus = useDeleteConfirm<PlacementObjectResource>({
    onDelete: async (placementObject) => {
      await apiDelete(`/api/placement-objects/${placementObject.id}`);
    },
    onSuccess: objectsRequest.reload,
    successMessage: (placementObject) => `Objek "${placementObject.name}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Objek Penempatan"
        description="Master data objek penempatan, yaitu wahana / fasilitas tempat karyawan bertugas. Satu objek bisa tersedia di beberapa sub unit."
        action={
          <Button asChild>
            <Link href="/dashboard/organisasi/objek-penempatan/create">
              <Plus />
              Tambah Objek Penempatan
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data objek penempatan..." />}
      {error && <PageError message={error} />}

      {placementObjects && categories && subUnits && (
        <Card>
          <CardContent>
            <ObjekPenempatanTable
              placementObjects={placementObjects}
              categories={categories}
              subUnits={subUnits}
              onDelete={hapus.ask}
            />
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus objek "${hapus.target?.name}"?`}
        description="Objek yang masih dipakai di penugasan jabatan tidak bisa dihapus."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}
