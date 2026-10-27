import { OrganisasiPage } from "@/features/organisasi/OrganisasiPage";

/**
 * Halaman ini baru tampil SETELAH sesi login dicek oleh RequireAuth
 * (src/app/dashboard/layout.tsx), jadi tidak bisa tampil instan saat navigasi.
 * Baris ini memberi tahu Next.js hal tersebut supaya tidak muncul peringatan
 * "instant navigation".
 */
export const instant = false;

export default function Organisasi() {
  return <OrganisasiPage />;
}
