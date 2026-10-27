import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { BidangForm } from "@/features/bidang/BidangForm";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function TambahBidang() {
  return (
    <FreshOnEachVisit>
      <BidangForm />
    </FreshOnEachVisit>
  );
}
