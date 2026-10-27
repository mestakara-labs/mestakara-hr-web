import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { mockCreateTermination, mockListTerminations } from "@/lib/mock/termination-mock";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";

/** GET /api/employee-terminations -> GET /employee-terminations — daftar usulan penonaktifan karyawan. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah, jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListTerminations());
  }

  return forward(request, "/employee-terminations");
}

/**
 * POST /api/employee-terminations -> POST /employee-terminations — buat usulan penonaktifan.
 * Dikirim sebagai multipart/form-data karena bisa berisi file dokumen.
 */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(await mockCreateTermination(await request.formData(), await mockCurrentUserName()));
  }

  return forward(request, "/employee-terminations");
}
