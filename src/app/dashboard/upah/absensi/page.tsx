import { Suspense } from "react";

import { PageLoading } from "@/components/shared/PageState";
import { UnggahAbsensiPage } from "@/features/unggah-absensi/UnggahAbsensiPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function UnggahAbsensi() {
  // UnggahAbsensiPage membaca tab yang dibuka dari alamat halaman (?tab=, lewat useSearchParams),
  // jadi harus ada Suspense di atasnya supaya halaman ini bisa di-prerender saat build.
  return (
    <Suspense fallback={<PageLoading />}>
      <UnggahAbsensiPage />
    </Suspense>
  );
}
