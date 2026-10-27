import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { PenambahanDetailPage } from "@/features/penambahan/PenambahanDetailPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/penambahan/{id} — detail usulan penambahan.
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function DetailPenambahan({ params }: PageProps<"/dashboard/penambahan/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <DetailPenambahanContent params={params} />
    </Suspense>
  );
}

async function DetailPenambahanContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <PenambahanDetailPage id={id} />
    </FreshOnEachVisit>
  );
}
