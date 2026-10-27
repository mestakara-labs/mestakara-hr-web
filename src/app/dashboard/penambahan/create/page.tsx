import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PenambahanWizardPage } from "@/features/penambahan/PenambahanWizardPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

/** Alamat: /dashboard/penambahan/create — wizard usulan penambahan baru. */
export default function TambahPenambahan() {
  return (
    <FreshOnEachVisit>
      <PenambahanWizardPage initialStep={1} />
    </FreshOnEachVisit>
  );
}
