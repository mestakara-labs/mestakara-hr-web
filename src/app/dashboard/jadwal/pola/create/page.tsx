import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { PolaKerjaForm } from "@/features/pola-kerja/PolaKerjaForm";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function TambahPolaKerja() {
  return (
    <FreshOnEachVisit>
      <PolaKerjaForm />
    </FreshOnEachVisit>
  );
}
