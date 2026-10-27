import { JabatanListPage } from "@/features/jabatan/JabatanListPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function Jabatan() {
  return <JabatanListPage />;
}
