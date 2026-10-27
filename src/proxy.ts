import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * Penjaga pintu yang berjalan SEBELUM halaman dibuka.
 *
 * - Belum login (tidak ada cookie) lalu membuka /dashboard -> dialihkan ke /login
 * - Sudah login lalu membuka /login                        -> dialihkan ke /dashboard
 *
 * Proxy hanya memeriksa ADA atau TIDAK-nya cookie. Apakah token-nya masih
 * berlaku, dicek oleh /api/auth/me (lihat src/features/auth/AuthProvider.tsx).
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname.startsWith("/login");
  const isProtectedPage = pathname.startsWith("/dashboard");

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedPage && !token) {
    // Simpan halaman tujuan supaya setelah login user kembali ke sana.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/** Proxy hanya dijalankan untuk halaman berikut. */
export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};
