import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { PenambahanWizardPage } from "@/features/penambahan/PenambahanWizardPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/penambahan/{id}/edit?langkah=1 — lanjutkan usulan Draf (mis. kembali dari form karyawan).
 * `id` & `langkah` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditPenambahan({ params, searchParams }: PageProps<"/dashboard/penambahan/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditPenambahanContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditPenambahanContent({
  params,
  searchParams,
}: Pick<PageProps<"/dashboard/penambahan/[id]/edit">, "params" | "searchParams">) {
  const { id } = await params;
  const { langkah } = await searchParams;
  const step = Number(langkah);
  return (
    <FreshOnEachVisit>
      <PenambahanWizardPage activationId={id} initialStep={step >= 1 && step <= 4 ? step : 1} />
    </FreshOnEachVisit>
  );
}
