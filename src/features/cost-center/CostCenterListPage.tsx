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
import type { CostCenterResource } from "@/types/api/cost-center";

import { CostCenterTable } from "./CostCenterTable";

/**
 * Halaman daftar master Cost Center.
 *
 * Alurnya:
 *   1. Ambil semua cost center dari /api/cost-centers
 *   2. Tampilkan di CostCenterTable (cari, urut, dan halaman diurus DataTable)
 *   3. Hapus cost center lewat dialog konfirmasi, lalu muat ulang datanya
 */
export function CostCenterListPage() {
  const { data: costCenters, loading, error, reload } = useApiGet<CostCenterResource[]>("/api/cost-centers");

  const hapus = useDeleteConfirm<CostCenterResource>({
    onDelete: async (costCenter) => {
      await apiDelete(`/api/cost-centers/${costCenter.id}`);
    },
    onSuccess: reload,
    successMessage: (costCenter) => `Cost center "${costCenter.code}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Cost Center"
        description="Master cost center SAP. Dipilih di biodata karyawan dan dipakai di Daftar Upah."
        action={
          <Button asChild>
            <Link href="/dashboard/upah/cost-center/create">
              <Plus />
              Tambah Cost Center
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data cost center..." />}
      {error && <PageError message={error} />}

      {costCenters && (
        <Card>
          <CardContent>
            <CostCenterTable costCenters={costCenters} onDelete={hapus.ask} />
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus cost center "${hapus.target?.code}"?`}
        description="Cost center yang masih dipakai karyawan tidak bisa dihapus."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}
