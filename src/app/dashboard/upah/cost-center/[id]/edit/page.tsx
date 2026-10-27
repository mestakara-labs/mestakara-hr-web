import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { CostCenterEditPage } from "@/features/cost-center/CostCenterEditPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/upah/cost-center/{id}/edit
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditCostCenter({ params }: PageProps<"/dashboard/upah/cost-center/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditCostCenterContent params={params} />
    </Suspense>
  );
}

async function EditCostCenterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <CostCenterEditPage id={id} />
    </FreshOnEachVisit>
  );
}
