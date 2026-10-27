import { Suspense } from "react";

import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PageLoading } from "@/components/shared/PageState";
import { ObjekPenempatanFormPage } from "@/features/objek-penempatan/ObjekPenempatanFormPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/**
 * Alamat: /dashboard/organisasi/objek-penempatan/{id}/edit
 * `id` di alamat baru diketahui saat halaman dibuka, jadi dibaca di dalam <Suspense>.
 */
export default function EditObjekPenempatan({ params }: PageProps<"/dashboard/organisasi/objek-penempatan/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <EditObjekPenempatanContent params={params} />
    </Suspense>
  );
}

async function EditObjekPenempatanContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FreshOnEachVisit>
      <ObjekPenempatanFormPage objectId={id} />
    </FreshOnEachVisit>
  );
}
