import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { KelompokUpahForm } from "@/features/kelompok-upah/KelompokUpahForm";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function TambahKelompokUpah() {
  return (
    <FreshOnEachVisit>
      <KelompokUpahForm />
    </FreshOnEachVisit>
  );
}
