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
import type { WorkPatternResource } from "@/types/api/work-pattern";

import { PolaKerjaTable } from "./PolaKerjaTable";

/**
 * Halaman daftar Pola Kerja.
 *
 * Alurnya:
 *   1. Ambil semua pola dari /api/work-patterns
 *   2. Tampilkan di PolaKerjaTable
 *   3. Hapus pola lewat dialog konfirmasi (ditolak kalau masih dipakai regu), lalu muat ulang
 */
export function PolaKerjaListPage() {
  const { data: patterns, loading, error, reload } = useApiGet<WorkPatternResource[]>("/api/work-patterns");

  const hapus = useDeleteConfirm<WorkPatternResource>({
    onDelete: async (pattern) => {
      await apiDelete(`/api/work-patterns/${pattern.id}`);
    },
    onSuccess: reload,
    successMessage: (pattern) => `Pola "${pattern.name}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Pola Kerja"
        description="Template rotasi shift: setiap slot (posisi) punya urutan shift sendiri selama satu siklus."
        action={
          <Button asChild>
            <Link href="/dashboard/jadwal/pola/create">
              <Plus />
              Tambah Pola Kerja
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data pola kerja..." />}
      {error && <PageError message={error} />}

      {patterns && (
        <Card>
          <CardContent>
            <PolaKerjaTable patterns={patterns} onDelete={hapus.ask} />
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus pola "${hapus.target?.name}"?`}
        description="Pola yang masih dipakai regu kerja tidak bisa dihapus."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}
