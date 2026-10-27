import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PenonaktifanListPage } from "@/features/penonaktifan/PenonaktifanListPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function PenonaktifanKaryawan() {
  return (
    <FreshOnEachVisit>
      <PenonaktifanListPage />
    </FreshOnEachVisit>
  );
}
