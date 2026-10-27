import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { MutasiWizardPage } from "@/features/mutasi/MutasiWizardPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/mutasi/{id}/edit — ubah usulan Draf / Menunggu Dokumen.
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditMutasi({ params }: PageProps<"/dashboard/mutasi/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditMutasiContent params={params} />
    </Suspense>
  );
}

async function EditMutasiContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <MutasiWizardPage transferId={id} />
    </FreshOnEachVisit>
  );
}
