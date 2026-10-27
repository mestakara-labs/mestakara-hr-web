import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { PenonaktifanWizardPage } from "@/features/penonaktifan/PenonaktifanWizardPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/penonaktifan/{id}/edit — lanjutkan usulan Draf.
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditPenonaktifan({ params }: PageProps<"/dashboard/penonaktifan/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditPenonaktifanContent params={params} />
    </Suspense>
  );
}

async function EditPenonaktifanContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <PenonaktifanWizardPage terminationId={id} />
    </FreshOnEachVisit>
  );
}
