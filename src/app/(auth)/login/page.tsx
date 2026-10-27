import { Suspense } from "react";

import { LoginPage } from "@/features/auth/LoginPage";

export default function Login() {
  // LoginForm (di dalam LoginPage) memakai useSearchParams untuk membaca callbackUrl,
  // jadi harus ada Suspense di atasnya supaya halaman ini bisa di-prerender saat build.
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
