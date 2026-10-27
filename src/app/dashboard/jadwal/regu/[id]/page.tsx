import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { ReguKerjaDetailPage } from "@/features/regu-kerja/ReguKerjaDetailPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/jadwal/regu/{id} — detail regu, anggota, dan pratinjau rotasi
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function DetailReguKerja({ params }: PageProps<"/dashboard/jadwal/regu/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <DetailReguKerjaContent params={params} />
    </Suspense>
  );
}

async function DetailReguKerjaContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <ReguKerjaDetailPage id={id} />
    </FreshOnEachVisit>
  );
}
