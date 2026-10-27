import { SubUnitListPage } from "@/features/sub-unit/SubUnitListPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function SubUnit() {
  return <SubUnitListPage />;
}
