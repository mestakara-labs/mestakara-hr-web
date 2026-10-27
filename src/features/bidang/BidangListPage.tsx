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
import type { DivisionResource } from "@/types/api/division";

import { BidangTable } from "./BidangTable";

/**
 * Halaman daftar master Bidang.
 *
 * Alurnya:
 *   1. Ambil semua bidang dari /api/divisions
 *   2. Tampilkan di BidangTable (cari, filter, urut, dan halaman diurus DataTable)
 *   3. Hapus bidang lewat dialog konfirmasi, lalu muat ulang datanya
 */
export function BidangListPage() {
  const { data: divisions, loading, error, reload } = useApiGet<DivisionResource[]>("/api/divisions");

  const hapus = useDeleteConfirm<DivisionResource>({
    onDelete: async (division) => {
      await apiDelete(`/api/divisions/${division.id}`);
    },
    onSuccess: reload,
    successMessage: (division) => `Bidang "${division.name}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Bidang"
        description="Master data bidang. Setiap jabatan BRM-2 ke bawah masuk ke salah satu bidang."
        action={
          <Button asChild>
            <Link href="/dashboard/organisasi/bidang/create">
              <Plus />
              Tambah Bidang
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data bidang..." />}
      {error && <PageError message={error} />}

      {divisions && (
        <Card>
          <CardContent>
            <BidangTable divisions={divisions} onDelete={hapus.ask} />
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus bidang "${hapus.target?.name}"?`}
        description="Bidang yang masih dipakai jabatan tidak bisa dihapus."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}

