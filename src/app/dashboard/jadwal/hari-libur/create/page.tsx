import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { HariLiburForm } from "@/features/hari-libur/HariLiburForm";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function TambahHariLibur() {
  return (
    <FreshOnEachVisit>
      <HariLiburForm />
    </FreshOnEachVisit>
  );
}
