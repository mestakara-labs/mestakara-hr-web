import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { ShiftForm } from "@/features/shift/ShiftForm";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function TambahShift() {
  return (
    <FreshOnEachVisit>
      <ShiftForm />
    </FreshOnEachVisit>
  );
}
