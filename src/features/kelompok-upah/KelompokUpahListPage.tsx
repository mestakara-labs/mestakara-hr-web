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
import type { PayrollGroupResource } from "@/types/api/payroll-group";

import { KelompokUpahTable } from "./KelompokUpahTable";

/**
 * Halaman daftar master KELOMPOK DAFTAR UPAH.
 *
 * Alurnya:
 *   1. Ambil semua kelompok dari /api/payroll-groups
 *   2. Tampilkan di KelompokUpahTable (urut menurut kolom Urutan)
 *   3. Hapus kelompok lewat dialog konfirmasi, lalu muat ulang datanya
 */
export function KelompokUpahListPage() {
  const { data: groups, loading, error, reload } = useApiGet<PayrollGroupResource[]>("/api/payroll-groups");

  const hapus = useDeleteConfirm<PayrollGroupResource>({
    onDelete: async (group) => {
      await apiDelete(`/api/payroll-groups/${group.id}`);
    },
    onSuccess: reload,
    successMessage: (group) => `Kelompok "${group.name}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Kelompok Daftar Upah"
        description="Pengelompokan Legacy seperti file Excel Daftar Upah lama. Diisi (opsional) di Skema Upah Karyawan."
        action={
          <Button asChild>
            <Link href="/dashboard/upah/kelompok/create">
              <Plus />
              Tambah Kelompok
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data kelompok..." />}
      {error && <PageError message={error} />}

      {groups && (
        <Card>
          <CardContent>
            <KelompokUpahTable groups={groups} onDelete={hapus.ask} />
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus kelompok "${hapus.target?.name}"?`}
        description="Kelompok yang masih dipakai di skema upah karyawan tidak bisa dihapus."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}
