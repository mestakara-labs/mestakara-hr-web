import { connection, NextRequest } from "next/server";

import { forwardFile } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Dashboard & Analitik SDM tidak punya versi mock: di mode mock membalas 501 (lihat backendOnly).

/** GET /api/analytics/export?(isian sama dengan /api/analytics) -> GET /analytics/export — file Excel Analitik SDM. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forwardFile(request, "/analytics/export");
}
