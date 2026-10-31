import { redirect } from "next/navigation";

/**
 * Halaman ini hanya meneruskan ke /dashboard (tidak punya tampilan), jadi tidak ada yang bisa
 * divalidasi sebagai navigasi instan.
 */
export const instant = false;

/** Halaman "/" tidak punya isi sendiri; langsung diarahkan ke dashboard. */
export default function RootPage() {
  redirect("/dashboard");
}
