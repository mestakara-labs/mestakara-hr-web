import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/cost-centers -> GET /cost-centers — daftar semua cost center. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, "/cost-centers");
}

/** POST /api/cost-centers -> POST /cost-centers — tambah cost center. */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, "/cost-centers");
}
