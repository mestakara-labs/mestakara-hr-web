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
import type { WorkGroupResource } from "@/types/api/work-group";

import { ReguKerjaTable } from "./ReguKerjaTable";

/**
 * Halaman daftar Regu Kerja.
 *
 * Alurnya:
 *   1. Ambil semua regu dari /api/work-groups
 *   2. Tampilkan di ReguKerjaTable (klik nama = detail regu & anggota)
 *   3. Hapus regu lewat dialog konfirmasi (hanya regu yang belum pernah punya anggota)
 */
export function ReguKerjaListPage() {
  const { data: groups, loading, error, reload } = useApiGet<WorkGroupResource[]>("/api/work-groups");

  const hapus = useDeleteConfirm<WorkGroupResource>({
    onDelete: async (group) => {
      await apiDelete(`/api/work-groups/${group.id}`);
    },
    onSuccess: reload,
    successMessage: (group) => `Regu "${group.name}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Regu Kerja"
        description="Kelompok karyawan yang bergantian mengisi shift dengan satu pola kerja."
        action={
          <Button asChild>
            <Link href="/dashboard/jadwal/regu/create">
              <Plus />
              Tambah Regu Kerja
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data regu kerja..." />}
      {error && <PageError message={error} />}

      {groups && (
        <Card>
          <CardContent>
            <ReguKerjaTable groups={groups} onDelete={hapus.ask} />
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus regu "${hapus.target?.name}"?`}
        description="Regu yang sudah pernah punya anggota tidak bisa dihapus, supaya riwayatnya tetap ada."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}
