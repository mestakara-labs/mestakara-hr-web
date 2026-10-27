import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { HariLiburEditPage } from "@/features/hari-libur/HariLiburEditPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/jadwal/hari-libur/{id}/edit
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditHariLibur({ params }: PageProps<"/dashboard/jadwal/hari-libur/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditHariLiburContent params={params} />
    </Suspense>
  );
}

async function EditHariLiburContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <HariLiburEditPage id={id} />
    </FreshOnEachVisit>
  );
}
