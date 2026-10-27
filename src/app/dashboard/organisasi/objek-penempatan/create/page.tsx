import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { ObjekPenempatanFormPage } from "@/features/objek-penempatan/ObjekPenempatanFormPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function TambahObjekPenempatan() {
  return (
    <FreshOnEachVisit>
      <ObjekPenempatanFormPage />
    </FreshOnEachVisit>
  );
}
