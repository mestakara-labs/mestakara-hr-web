import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUnavailable, callBackend } from "@/lib/api-client";
import { isMockMode, mockLogin } from "@/lib/mock/auth-mock";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-cookie";
import type { ApiResponse } from "@/types/api/response";
import type { LoginResponse } from "@/types/api/user";

/** Hasil pemeriksaan login, dari backend maupun dari data contoh (mock). */
type LoginResult = { status: number; body: ApiResponse<LoginResponse | null> };

/**
 * POST /api/auth/login -> POST /login
 *
 * Body dari browser: { login, password, rememberMe }
 * `login` berisi NIK atau email.
 *
 * Token dari backend disimpan di cookie HttpOnly, jadi tidak ikut dikirim
 * ke browser. Yang dikembalikan hanya data user.
 */
export async function POST(request: NextRequest) {
  const { login, password, rememberMe } = await request.json();

  // 1. Periksa NIK/Email + kata sandi: ke data contoh (mock) atau ke backend.
  let result: LoginResult;

  if (isMockMode()) {
    result = mockLogin(login, password);
  } else {
    try {
      result = await callBackend("/login", { method: "POST", body: { login, password } });
    } catch (error) {
      console.error("[auth/login] gagal memanggil backend:", error);
      return backendUnavailable();
    }
  }

  // 2. Login gagal: teruskan pesan error apa adanya ke browser.
  const loginData = result.body.data;

  if (result.status !== 200 || !loginData) {
    return NextResponse.json(result.body, { status: result.status });
  }

  // 3. Login berhasil: simpan token di cookie HttpOnly.
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, loginData.token, sessionCookieOptions(rememberMe === true));

  // 4. Kirim data user saja (tanpa token) ke browser.
  return NextResponse.json({
    success: true,
    message: result.body.message,
    data: loginData.user,
  });
}
