import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { KaryawanEditPage } from "@/features/karyawan/KaryawanEditPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/karyawan/{id}/edit
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditKaryawan({ params }: PageProps<"/dashboard/karyawan/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditKaryawanContent params={params} />
    </Suspense>
  );
}

async function EditKaryawanContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <KaryawanEditPage id={id} />
    </FreshOnEachVisit>
  );
}
