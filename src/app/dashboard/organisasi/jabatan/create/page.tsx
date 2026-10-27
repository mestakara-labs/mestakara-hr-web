import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { JabatanFormPage } from "@/features/jabatan/JabatanFormPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function TambahJabatan() {
  return (
    <FreshOnEachVisit>
      <JabatanFormPage />
    </FreshOnEachVisit>
  );
}
