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
import type { HolidayResource } from "@/types/api/holiday";

import { HariLiburTable } from "./HariLiburTable";

/**
 * Halaman daftar master Hari Libur.
 *
 * Alurnya:
 *   1. Ambil semua hari libur dari /api/holidays (urut tanggal)
 *   2. Tampilkan di HariLiburTable (cari, filter jenis, urut, dan halaman diurus DataTable)
 *   3. Hapus hari libur lewat dialog konfirmasi, lalu muat ulang datanya
 */
export function HariLiburListPage() {
  const { data: holidays, loading, error, reload } = useApiGet<HolidayResource[]>("/api/holidays");

  const hapus = useDeleteConfirm<HolidayResource>({
    onDelete: async (holiday) => {
      await apiDelete(`/api/holidays/${holiday.id}`);
    },
    onSuccess: reload,
    successMessage: (holiday) => `Hari libur "${holiday.name}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Hari Libur"
        description="Libur nasional, cuti bersama, dan libur perusahaan. Menjadi penanda di kalender jadwal kerja."
        action={
          <Button asChild>
            <Link href="/dashboard/jadwal/hari-libur/create">
              <Plus />
              Tambah Hari Libur
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data hari libur..." />}
      {error && <PageError message={error} />}

      {holidays && (
        <Card>
          <CardContent>
            <HariLiburTable holidays={holidays} onDelete={hapus.ask} />
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus hari libur "${hapus.target?.name}"?`}
        description="Penanda libur di kalender jadwal ikut hilang. Jadwal kerja karyawan tidak berubah."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}
