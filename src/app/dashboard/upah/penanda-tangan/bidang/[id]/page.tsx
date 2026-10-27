import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { PenandaTanganOwnerPage } from "@/features/penanda-tangan/PenandaTanganOwnerPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/upah/penanda-tangan/bidang/{id}
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function AturPenandaTanganBidang({ params }: PageProps<"/dashboard/upah/penanda-tangan/bidang/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <AturPenandaTanganBidangContent params={params} />
    </Suspense>
  );
}

async function AturPenandaTanganBidangContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <PenandaTanganOwnerPage kind="bidang" id={id} />
    </FreshOnEachVisit>
  );
}
