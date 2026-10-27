import { FreshOnEachVisit } from "@/components/shared/FreshOnEachVisit";
import { KategoriObjekForm } from "@/features/kategori-objek/KategoriObjekForm";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function TambahKategoriObjek() {
  return (
    <FreshOnEachVisit>
      <KategoriObjekForm />
    </FreshOnEachVisit>
  );
}
