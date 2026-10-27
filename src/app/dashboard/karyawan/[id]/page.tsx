import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { KaryawanDetailPage } from "@/features/karyawan/KaryawanDetailPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/karyawan/{id} — detail lengkap satu karyawan.
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function DetailKaryawan({ params }: PageProps<"/dashboard/karyawan/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <DetailKaryawanContent params={params} />
    </Suspense>
  );
}

async function DetailKaryawanContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <KaryawanDetailPage id={id} />
    </FreshOnEachVisit>
  );
}
