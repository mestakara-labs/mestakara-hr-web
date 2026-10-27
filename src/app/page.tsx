import { redirect } from "next/navigation";

/** Halaman "/" tidak punya isi sendiri; langsung diarahkan ke dashboard. */
export default function RootPage() {
  redirect("/dashboard");
}
