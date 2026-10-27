import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { KategoriObjekEditPage } from "@/features/kategori-objek/KategoriObjekEditPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/organisasi/kategori-objek/{id}/edit
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditKategoriObjek({ params }: PageProps<"/dashboard/organisasi/kategori-objek/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditKategoriObjekContent params={params} />
    </Suspense>
  );
}

async function EditKategoriObjekContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <KategoriObjekEditPage id={id} />
    </FreshOnEachVisit>
  );
}
