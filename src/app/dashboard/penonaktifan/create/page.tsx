import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PenonaktifanWizardPage } from "@/features/penonaktifan/PenonaktifanWizardPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/** Alamat: /dashboard/penonaktifan/create — wizard usulan penonaktifan baru. */
export default function TambahPenonaktifan() {
  return (
    <FreshOnEachVisit>
      <PenonaktifanWizardPage />
    </FreshOnEachVisit>
  );
}
