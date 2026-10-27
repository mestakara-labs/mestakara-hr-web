import { DashboardPage } from "@/features/dashboard/DashboardPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 * Baris ini memberi tahu Next.js hal tersebut supaya tidak muncul peringatan
 * "instant navigation". Tambahkan baris yang sama di setiap page baru di /dashboard.
 */
export const instant = false;

export default function Dashboard() {
  return <DashboardPage />;
}
