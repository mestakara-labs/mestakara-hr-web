import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/overtime-settings -> GET /overtime-settings — Pengaturan Lembur. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, "/overtime-settings");
}

/** PUT /api/overtime-settings -> PUT /overtime-settings — simpan Pengaturan Lembur. */
export async function PUT(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, "/overtime-settings");
}
