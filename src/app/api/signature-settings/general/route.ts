import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/signature-settings/general -> GET /signature-settings/general — penanda tangan Umum (tempat, Daftar Upah, SPKL). */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, "/signature-settings/general");
}

/** PUT /api/signature-settings/general -> PUT /signature-settings/general — simpan penanda tangan Umum. */
export async function PUT(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, "/signature-settings/general");
}
