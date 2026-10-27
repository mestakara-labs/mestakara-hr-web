import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { JadwalDetailPage } from "@/features/jadwal/JadwalDetailPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/jadwal/{id regu} — DETAIL JADWAL satu regu (pilih bulan, buat/terbitkan/kunci/ubah jadwal).
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function DetailJadwalKerja({ params }: PageProps<"/dashboard/jadwal/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <DetailJadwalKerjaContent params={params} />
    </Suspense>
  );
}

async function DetailJadwalKerjaContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <JadwalDetailPage groupId={id} />
    </FreshOnEachVisit>
  );
}
