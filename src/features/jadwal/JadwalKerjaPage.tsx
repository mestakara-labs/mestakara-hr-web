"use client";

import { Card, CardContent } from "@mestakara/ui/card";

import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { WorkGroupResource } from "@/types/api/work-group";

import { JadwalTable } from "./JadwalTable";

/**
 * Halaman DAFTAR JADWAL KERJA (satu baris = satu regu):
 *
 *   Regu | Lokasi | Pola Kerja | Anggota | [Lihat Detail Jadwal]
 *
 * Buat / terbitkan / kunci / ubah jadwal dilakukan di halaman detail jadwal regu (JadwalDetailPage).
 */
export function JadwalKerjaPage() {
  const { data: groups, loading, error } = useApiGet<WorkGroupResource[]>("/api/work-groups");

  return (
    <>
      <PageHeader
        title="Jadwal Kerja"
        description="Jadwal resmi setiap regu per bulan: buat dari pola, periksa, terbitkan, lalu kunci setelah rekap absensi."
      />

      {loading && <PageLoading label="Memuat data jadwal..." />}
      {error && <PageError message={error} />}

      {groups && (
        <Card>
          <CardContent>
            {groups.length === 0 ? (
              <p className="py-6 text-center typo-body-s text-fg-tertiary">
                Belum ada regu kerja. Buat regu di menu Regu Kerja terlebih dahulu.
              </p>
            ) : (
              <JadwalTable groups={groups} />
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
