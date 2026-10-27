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
import type { SubUnitResource } from "@/types/api/sub-unit";

import { SubUnitTable } from "./SubUnitTable";

/**
 * Halaman daftar master Sub Unit.
 *
 * Alurnya:
 *   1. Ambil semua sub unit dari /api/sub-units
 *   2. Tampilkan di SubUnitTable (cari, urut, dan halaman diurus DataTable)
 *   3. Hapus sub unit lewat dialog konfirmasi, lalu muat ulang datanya
 */
export function SubUnitListPage() {
  const { data: subUnits, loading, error, reload } = useApiGet<SubUnitResource[]>("/api/sub-units");

  const hapus = useDeleteConfirm<SubUnitResource>({
    onDelete: async (subUnit) => {
      await apiDelete(`/api/sub-units/${subUnit.id}`);
    },
    onSuccess: reload,
    successMessage: (subUnit) => `Sub unit "${subUnit.name}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Sub Unit"
        description="Master data sub unit, yaitu lokasi / unit kerja tempat karyawan ditugaskan."
        action={
          <Button asChild>
            <Link href="/dashboard/organisasi/sub-unit/create">
              <Plus />
              Tambah Sub Unit
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data sub unit..." />}
      {error && <PageError message={error} />}

      {subUnits && (
        <Card>
          <CardContent>
            <SubUnitTable subUnits={subUnits} onDelete={hapus.ask} />
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus sub unit "${hapus.target?.name}"?`}
        description="Sub unit yang masih tercantum di objek penempatan atau dipakai di penugasan jabatan tidak bisa dihapus."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}
