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
import type { PositionResource } from "@/types/api/organization";

import { JabatanStats } from "./JabatanStats";
import { JabatanTable } from "./JabatanTable";

/**
 * Halaman daftar master Jabatan.
 *
 * Alurnya:
 *   1. Ambil semua jabatan (/api/positions) dan semua bidang (/api/divisions)
 *   2. Tampilkan kartu statistik dari SEMUA jabatan
 *   3. Tampilkan JabatanTable (cari, filter, urut, dan halaman diurus DataTable)
 *   4. Hapus jabatan lewat dialog konfirmasi, lalu muat ulang datanya
 */
export function JabatanListPage() {
  const positionsRequest = useApiGet<PositionResource[]>("/api/positions");
  const divisionsRequest = useApiGet<DivisionResource[]>("/api/divisions");

  const positions = positionsRequest.data;
  const divisions = divisionsRequest.data;
  const loading = positionsRequest.loading || divisionsRequest.loading;
  const error = positionsRequest.error ?? divisionsRequest.error;

  const hapus = useDeleteConfirm<PositionResource>({
    onDelete: async (position) => {
      await apiDelete(`/api/positions/${position.id}`);
    },
    // Muat ulang bidang juga, karena jumlah jabatan per bidang ikut berubah.
    onSuccess: () => {
      positionsRequest.reload();
      divisionsRequest.reload();
    },
    successMessage: (position) => `Jabatan "${position.title}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Jabatan"
        description="Master data jabatan beserta level BRM dan bidangnya. Pemegang jabatan dan atasannya terlihat di menu Jabatan Karyawan."
        action={
          <Button asChild>
            <Link href="/dashboard/organisasi/jabatan/create">
              <Plus />
              Tambah Jabatan
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data jabatan..." />}
      {error && <PageError message={error} />}

      {positions && divisions && (
        <>
          <JabatanStats positions={positions} divisions={divisions} />

          <Card>
            <CardContent>
              <JabatanTable positions={positions} divisions={divisions} onDelete={hapus.ask} />
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus jabatan "${hapus.target?.title}"?`}
        description="Jabatan yang masih dipakai di penugasan jabatan tidak bisa dihapus."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}
