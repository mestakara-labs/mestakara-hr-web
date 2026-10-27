import { PolaKerjaListPage } from "@/features/pola-kerja/PolaKerjaListPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function PolaKerja() {
  return <PolaKerjaListPage />;
}
