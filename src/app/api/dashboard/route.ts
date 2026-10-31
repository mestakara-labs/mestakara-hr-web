import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Dashboard & Analitik SDM tidak punya versi mock: di mode mock membalas 501 (lihat backendOnly).

/** GET /api/dashboard?from=&to= -> GET /dashboard — semua widget dashboard dengan periode bawaan, tanpa filter. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, "/dashboard");
}
