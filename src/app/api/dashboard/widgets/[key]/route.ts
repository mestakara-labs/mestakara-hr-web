import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Dashboard & Analitik SDM tidak punya versi mock: di mode mock membalas 501 (lihat backendOnly).

/**
 * GET /api/dashboard/widgets/{key}?from=&to=&filters[..][]=&group_by= -> GET /dashboard/widgets/{key}
 * — satu widget dengan periode / filter pilihan user (mis. key "payroll.trend").
 */
export async function GET(request: NextRequest, context: RouteContext<"/api/dashboard/widgets/[key]">) {
  const { key } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, `/dashboard/widgets/${encodeURIComponent(key)}`);
}
