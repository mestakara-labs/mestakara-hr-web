import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { MutasiWizardPage } from "@/features/mutasi/MutasiWizardPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/mutasi/create
 * Boleh diberi isian awal lewat alamat, mis. dari tawaran setelah menambah karyawan:
 *   /dashboard/mutasi/create?jenis=Penempatan%20Awal&karyawan=pegawai-0211
 * Isi alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function TambahMutasi({ searchParams }: PageProps<"/dashboard/mutasi/create">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <TambahMutasiContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TambahMutasiContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { jenis, karyawan } = await searchParams;

  return (
    <FreshOnEachVisit>
      <MutasiWizardPage
        presetType={typeof jenis === "string" ? jenis : undefined}
        presetEmployeeId={typeof karyawan === "string" ? karyawan : undefined}
      />
    </FreshOnEachVisit>
  );
}
