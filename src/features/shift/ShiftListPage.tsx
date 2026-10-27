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
import type { ShiftResource } from "@/types/api/shift";

import { ShiftTable } from "./ShiftTable";

/**
 * Halaman daftar master Shift.
 *
 * Alurnya:
 *   1. Ambil semua shift dari /api/shifts
 *   2. Tampilkan di ShiftTable (cari, urut, dan halaman diurus DataTable)
 *   3. Hapus shift lewat dialog konfirmasi, lalu muat ulang datanya
 */
export function ShiftListPage() {
  const { data: shifts, loading, error, reload } = useApiGet<ShiftResource[]>("/api/shifts");

  const hapus = useDeleteConfirm<ShiftResource>({
    onDelete: async (shift) => {
      await apiDelete(`/api/shifts/${shift.id}`);
    },
    onSuccess: reload,
    successMessage: (shift) => `Shift "${shift.name}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Shift"
        description="Master jam kerja, mis. Pagi 07.00–12.00 atau Malam 22.00–06.00, beserta aturan absensinya."
        action={
          <Button asChild>
            <Link href="/dashboard/jadwal/shift/create">
              <Plus />
              Tambah Shift
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data shift..." />}
      {error && <PageError message={error} />}

      {shifts && (
        <Card>
          <CardContent>
            <ShiftTable shifts={shifts} onDelete={hapus.ask} />
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus shift "${hapus.target?.name}"?`}
        description="Shift yang masih dipakai pola kerja tidak bisa dihapus."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}
