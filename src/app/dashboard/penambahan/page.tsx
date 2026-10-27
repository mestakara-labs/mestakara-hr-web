import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PenambahanListPage } from "@/features/penambahan/PenambahanListPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function PenambahanKaryawan() {
  return (
    <FreshOnEachVisit>
      <PenambahanListPage />
    </FreshOnEachVisit>
  );
}
