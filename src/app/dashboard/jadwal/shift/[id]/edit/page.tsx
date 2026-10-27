import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { ShiftEditPage } from "@/features/shift/ShiftEditPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/jadwal/shift/{id}/edit
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditShift({ params }: PageProps<"/dashboard/jadwal/shift/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditShiftContent params={params} />
    </Suspense>
  );
}

async function EditShiftContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <ShiftEditPage id={id} />
    </FreshOnEachVisit>
  );
}
