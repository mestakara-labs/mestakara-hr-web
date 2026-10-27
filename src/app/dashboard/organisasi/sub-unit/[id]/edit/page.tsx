import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { SubUnitEditPage } from "@/features/sub-unit/SubUnitEditPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/organisasi/sub-unit/{id}/edit
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditSubUnit({ params }: PageProps<"/dashboard/organisasi/sub-unit/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditSubUnitContent params={params} />
    </Suspense>
  );
}

async function EditSubUnitContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <SubUnitEditPage id={id} />
    </FreshOnEachVisit>
  );
}
