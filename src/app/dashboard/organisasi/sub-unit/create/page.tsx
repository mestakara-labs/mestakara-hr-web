import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { SubUnitForm } from "@/features/sub-unit/SubUnitForm";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function TambahSubUnit() {
  return (
    <FreshOnEachVisit>
      <SubUnitForm />
    </FreshOnEachVisit>
  );
}
