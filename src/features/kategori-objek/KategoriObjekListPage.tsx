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

import { KategoriObjekTable } from "./KategoriObjekTable";

/**
 * Halaman daftar master Kategori Objek.
 *
 * Alurnya:
 *   1. Ambil semua kategori objek dari /api/placement-categories
 *   2. Tampilkan di KategoriObjekTable (cari, urut, dan halaman diurus DataTable)
 *   3. Hapus kategori objek lewat dialog konfirmasi, lalu muat ulang datanya
 */
export function KategoriObjekListPage() {
  const { data: categories, loading, error, reload } = useApiGet<PlacementCategoryResource[]>("/api/placement-categories");

  const hapus = useDeleteConfirm<PlacementCategoryResource>({
    onDelete: async (category) => {
      await apiDelete(`/api/placement-categories/${category.id}`);
    },
    onSuccess: reload,
    successMessage: (category) => `Kategori "${category.name}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Kategori Objek"
        description="Master data kategori objek penempatan, mis. Penginapan, Wahana, Restoran, atau Cafe."
        action={
          <Button asChild>
            <Link href="/dashboard/organisasi/kategori-objek/create">
              <Plus />
              Tambah Kategori Objek
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data kategori objek..." />}
      {error && <PageError message={error} />}

      {categories && (
        <Card>
          <CardContent>
            <KategoriObjekTable categories={categories} onDelete={hapus.ask} />
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus kategori "${hapus.target?.name}"?`}
        description="Kategori yang masih dipakai objek penempatan tidak bisa dihapus."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}
