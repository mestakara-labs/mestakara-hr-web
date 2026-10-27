import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { ReguAnggotaPage } from "@/features/regu-kerja/ReguAnggotaPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/jadwal/regu/{id}/anggota            — dibuka dari detail regu (kembali ke detail)
 *         /dashboard/jadwal/regu/{id}/anggota?dari=edit   — dibuka dari form Edit Regu (kembali ke form edit)
 * `id` & `dari` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function KelolaAnggotaRegu({ params, searchParams }: PageProps<"/dashboard/jadwal/regu/[id]/anggota">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <KelolaAnggotaReguContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function KelolaAnggotaReguContent({
  params,
  searchParams,
}: Pick<PageProps<"/dashboard/jadwal/regu/[id]/anggota">, "params" | "searchParams">) {
  const { id } = await params;
  const { dari } = await searchParams;
  return (
    <FreshOnEachVisit>
      <ReguAnggotaPage id={id} returnTo={dari === "edit" ? "edit" : "detail"} />
    </FreshOnEachVisit>
  );
}
