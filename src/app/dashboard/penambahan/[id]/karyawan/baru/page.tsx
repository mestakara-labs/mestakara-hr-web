import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { PenambahanEmployeeFormPage } from "@/features/penambahan/PenambahanEmployeeFormPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/** Alamat: /dashboard/penambahan/{id}/karyawan/baru — form karyawan baru untuk usulan penambahan. */
export default function TambahKaryawanUsulan({ params }: PageProps<"/dashboard/penambahan/[id]/karyawan/baru">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <TambahKaryawanUsulanContent params={params} />
    </Suspense>
  );
}

async function TambahKaryawanUsulanContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <PenambahanEmployeeFormPage activationId={id} />
    </FreshOnEachVisit>
  );
}
