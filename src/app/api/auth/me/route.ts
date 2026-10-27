import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode, mockGetUser } from "@/lib/mock/auth-mock";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * GET /api/auth/me -> GET /me
 *
 * Mengembalikan data user yang sedang login. 401 berarti belum login.
 *
 * Kalau 401 padahal cookie sesi masih ada (token kedaluwarsa / dicabut / database backend
 * di-reset), cookie-nya DIBUANG. Tanpa ini user terjebak bolak-balik: halaman dashboard
 * mengarahkan ke /login, tetapi proxy.ts melihat cookie masih ada dan mengembalikannya ke /dashboard.
 */
export async function GET(request: NextRequest) {
  let response: NextResponse;

  if (isMockMode()) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const { status, body } = mockGetUser(token);
    response = NextResponse.json(body, { status });
  } else {
    response = await forward(request, "/me");
  }

  if (response.status === 401) response.cookies.delete(SESSION_COOKIE);
  return response;
}
