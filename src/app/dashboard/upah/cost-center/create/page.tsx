import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { CostCenterForm } from "@/features/cost-center/CostCenterForm";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function TambahCostCenter() {
  return (
    <FreshOnEachVisit>
      <CostCenterForm />
    </FreshOnEachVisit>
  );
}
