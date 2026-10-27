import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { BidangEditPage } from "@/features/bidang/BidangEditPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/organisasi/bidang/{id}/edit
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditBidang({ params }: PageProps<"/dashboard/organisasi/bidang/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditBidangContent params={params} />
    </Suspense>
  );
}

async function EditBidangContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <BidangEditPage id={id} />
    </FreshOnEachVisit>
  );
}
