import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { MutasiDetailPage } from "@/features/mutasi/MutasiDetailPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/mutasi/{id} — detail satu usulan mutasi.
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function DetailMutasi({ params }: PageProps<"/dashboard/mutasi/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <DetailMutasiContent params={params} />
    </Suspense>
  );
}

async function DetailMutasiContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <MutasiDetailPage id={id} />
    </FreshOnEachVisit>
  );
}
