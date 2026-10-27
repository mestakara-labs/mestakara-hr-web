import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { mockCreateActivation, mockListActivations } from "@/lib/mock/activation-mock";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";

/** GET /api/employee-activations -> GET /employee-activations — daftar usulan penambahan karyawan. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah, jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListActivations());
  }

  return forward(request, "/employee-activations");
}

/**
 * POST /api/employee-activations -> POST /employee-activations — buat usulan penambahan.
 * Dikirim sebagai multipart/form-data karena bisa berisi file dokumen.
 */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(await mockCreateActivation(await request.formData(), await mockCurrentUserName()));
  }

  return forward(request, "/employee-activations");
}
