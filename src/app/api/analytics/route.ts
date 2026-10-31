import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Dashboard & Analitik SDM tidak punya versi mock: di mode mock membalas 501 (lihat backendOnly).

/** GET /api/analytics?topic=&metric=&group_by=&split_by=&from=&to=&filters[..][]= -> GET /analytics — data Analitik SDM. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, "/analytics");
}
