"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";

import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { ActivationResource } from "@/types/api/employee-activation";

import { PenambahanTable } from "./PenambahanTable";

/**
 * Halaman DAFTAR USULAN PENAMBAHAN KARYAWAN.
 *
 *   [+ Penambahan Karyawan]
 *   Tabel usulan: Dibuat | Karyawan | Dasar Penambahan | Dokumen | Status | [Lanjutkan / Lihat Detail]
 */
export function PenambahanListPage() {
  const { data: activations, loading, error } = useApiGet<ActivationResource[]>("/api/employee-activations");

  return (
    <>
      <PageHeader
        title="Penambahan Karyawan"
        description="Usulan karyawan yang menjadi aktif: penerimaan baru, mutasi masuk, atau pengaktifan kembali."
        action={
          <Button asChild>
            <Link href="/dashboard/penambahan/create">
              <UserPlus />
              Penambahan Karyawan
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat usulan penambahan..." />}
      {error && <PageError message={error} />}

      {activations && (
        <Card>
          <CardContent>
            <PenambahanTable activations={activations} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
