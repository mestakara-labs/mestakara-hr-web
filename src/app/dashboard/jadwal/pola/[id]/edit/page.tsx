import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { PolaKerjaEditPage } from "@/features/pola-kerja/PolaKerjaEditPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/jadwal/pola/{id}/edit
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditPolaKerja({ params }: PageProps<"/dashboard/jadwal/pola/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditPolaKerjaContent params={params} />
    </Suspense>
  );
}

async function EditPolaKerjaContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <PolaKerjaEditPage id={id} />
    </FreshOnEachVisit>
  );
}
