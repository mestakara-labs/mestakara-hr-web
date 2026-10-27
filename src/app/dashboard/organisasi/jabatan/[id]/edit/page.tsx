import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { JabatanFormPage } from "@/features/jabatan/JabatanFormPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/organisasi/jabatan/{id}/edit
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditJabatan({ params }: PageProps<"/dashboard/organisasi/jabatan/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditJabatanContent params={params} />
    </Suspense>
  );
}

async function EditJabatanContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <JabatanFormPage positionId={id} />
    </FreshOnEachVisit>
  );
}
