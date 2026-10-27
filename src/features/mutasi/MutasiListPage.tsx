"use client";

import Link from "next/link";
import { CircleCheck, FileClock, FilePen, Plus, XCircle } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";

import { NumberCard } from "@/components/shared/NumberCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { TRANSFER_STATUS } from "@/lib/transfer-rules";
import type { TransferResource } from "@/types/api/transfer";

import { MutasiTable } from "./MutasiTable";

/**
 * Halaman daftar MUTASI & PENEMPATAN.
 *
 *   [Menunggu Dokumen] [Berlaku Bulan Ini] [Draf] [Dibatalkan]
 *   Tabel usulan (cari, filter, urut)  ->  "Lihat" membuka halaman detail usulan
 *
 * Usulan baru dibuat lewat tombol "Buat Usulan" (wizard 4 langkah).
 */
export function MutasiListPage() {
  const { data: transfers, loading, error } = useApiGet<TransferResource[]>("/api/transfers");

  const countOf = (status: string) => transfers?.filter((transfer) => transfer.status === status).length ?? 0;

  // "Berlaku bulan ini" = diaktifkan pada bulan & tahun yang sama dengan hari ini.
  const thisMonth = new Date().toISOString().slice(0, 7);
  const effectiveThisMonth =
    transfers?.filter(
      (transfer) => transfer.status === TRANSFER_STATUS.effective && transfer.activated_at?.startsWith(thisMonth),
    ).length ?? 0;

  return (
    <>
      <PageHeader
        title="Mutasi & Penempatan"
        description="Usulan perpindahan dan penempatan jabatan karyawan, beserta SK-nya."
        action={
          <Button asChild>
            <Link href="/dashboard/mutasi/create">
              <Plus />
              Buat Usulan
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat usulan mutasi..." />}
      {error && <PageError message={error} />}

      {transfers && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <NumberCard
              title="Menunggu Dokumen"
              icon={FileClock}
              value={countOf(TRANSFER_STATUS.waiting)}
              note="SK perlu ditandatangani & diunggah"
            />
            <NumberCard
              title="Berlaku Bulan Ini"
              icon={CircleCheck}
              value={effectiveThisMonth}
              note={`dari ${countOf(TRANSFER_STATUS.effective)} usulan yang berlaku`}
            />
            <NumberCard title="Draf" icon={FilePen} value={countOf(TRANSFER_STATUS.draft)} note="Belum selesai diisi" />
            <NumberCard
              title="Dibatalkan"
              icon={XCircle}
              value={countOf(TRANSFER_STATUS.cancelled)}
              note="Tidak jadi / dibatalkan setelah berlaku"
            />
          </div>

          <Card>
            <CardContent>
              <MutasiTable transfers={transfers} />
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
