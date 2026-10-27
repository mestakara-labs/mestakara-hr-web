import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { ReguKerjaEditPage } from "@/features/regu-kerja/ReguKerjaEditPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/jadwal/regu/{id}/edit — ubah DATA REGU saja (anggota di /anggota).
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditReguKerja({ params }: PageProps<"/dashboard/jadwal/regu/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditReguKerjaContent params={params} />
    </Suspense>
  );
}

async function EditReguKerjaContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <ReguKerjaEditPage id={id} />
    </FreshOnEachVisit>
  );
}
