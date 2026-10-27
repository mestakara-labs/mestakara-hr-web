import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { PenambahanEmployeeFormPage } from "@/features/penambahan/PenambahanEmployeeFormPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/** Alamat: /dashboard/penambahan/{id}/karyawan/{employeeId}/edit — ubah data karyawan di usulan penambahan. */
export default function UbahKaryawanUsulan({ params }: PageProps<"/dashboard/penambahan/[id]/karyawan/[employeeId]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <UbahKaryawanUsulanContent params={params} />
    </Suspense>
  );
}

async function UbahKaryawanUsulanContent({ params }: { params: Promise<{ id: string; employeeId: string }> }) {
  const { id, employeeId } = await params;
  return (
    <FreshOnEachVisit>
      <PenambahanEmployeeFormPage activationId={id} employeeId={employeeId} />
    </FreshOnEachVisit>
  );
}
