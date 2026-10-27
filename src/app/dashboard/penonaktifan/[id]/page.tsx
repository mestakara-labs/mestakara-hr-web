import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { PenonaktifanDetailPage } from "@/features/penonaktifan/PenonaktifanDetailPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/penonaktifan/{id} — detail usulan penonaktifan.
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function DetailPenonaktifan({ params }: PageProps<"/dashboard/penonaktifan/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <DetailPenonaktifanContent params={params} />
    </Suspense>
  );
}

async function DetailPenonaktifanContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <PenonaktifanDetailPage id={id} />
    </FreshOnEachVisit>
  );
}
