import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { callBackend } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * POST /api/auth/logout -> POST /logout
 *
 * Cabut token di backend, lalu buang cookie. Kalau backend gagal dihubungi,
 * cookie tetap dibuang supaya user tidak terkunci di sesi yang tidak dipakai.
 */
export async function POST() {
  // Mode mock tidak punya backend, jadi cukup buang cookie saja.
  if (!isMockMode()) {
    try {
      await callBackend("/logout", { method: "POST" });
    } catch (error) {
      console.error("[auth/logout] gagal memanggil backend:", error);
    }
  }

  (await cookies()).delete(SESSION_COOKIE);

  return NextResponse.json({
    success: true,
    message: "Logout berhasil",
    data: null,
  });
}
