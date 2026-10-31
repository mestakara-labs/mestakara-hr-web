import { AnalitikPage } from "@/features/analitik/AnalitikPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 */
export const instant = false;

export default function Analitik() {
  return <AnalitikPage />;
}
