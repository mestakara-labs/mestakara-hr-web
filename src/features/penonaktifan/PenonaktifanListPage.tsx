"use client";

import Link from "next/link";
import { UserMinus } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";

import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { TerminationResource } from "@/types/api/employee-termination";

import { PenonaktifanTable } from "./PenonaktifanTable";

/**
 * Halaman DAFTAR USULAN PENONAKTIFAN KARYAWAN.
 *
 *   [- Penonaktifan Karyawan]
 *   Tabel usulan: Dibuat | Karyawan | Jenis | TMT Nonaktif | Dokumen | Status | [Lanjutkan / Lihat Detail]
 */
export function PenonaktifanListPage() {
  const { data: terminations, loading, error } = useApiGet<TerminationResource[]>("/api/employee-terminations");

  return (
    <>
      <PageHeader
        title="Penonaktifan Karyawan"
        description="Usulan karyawan yang menjadi nonaktif: pensiun, mengundurkan diri, PHK, kontrak berakhir, mutasi keluar, dan lainnya."
        action={
          <Button asChild>
            <Link href="/dashboard/penonaktifan/create">
              <UserMinus />
              Penonaktifan Karyawan
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat usulan penonaktifan..." />}
      {error && <PageError message={error} />}

      {terminations && (
        <Card>
          <CardContent>
            <PenonaktifanTable terminations={terminations} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
