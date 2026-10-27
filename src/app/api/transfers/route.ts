import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockCreateTransfer, mockListTransfers } from "@/lib/mock/transfer-mock";

/** GET /api/transfers -> GET /transfers — daftar usulan mutasi & penempatan. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah, jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListTransfers());
  }

  return forward(request, "/transfers");
}

/**
 * POST /api/transfers -> POST /transfers — buat usulan mutasi.
 * Dikirim sebagai multipart/form-data karena bisa berisi scan SK.
 */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(await mockCreateTransfer(await request.formData(), await mockCurrentUserName()));
  }

  return forward(request, "/transfers");
}
