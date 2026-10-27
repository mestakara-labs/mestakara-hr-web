import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockRegenerate } from "@/lib/mock/schedule-regenerate-mock";

/**
 * POST /api/schedule-periods/{id}/regenerate -> POST /schedule-periods/{id}/regenerate
 * — BUAT ULANG jadwal dari tanggal tertentu. Body: { from_date, keep_manual, reason }.
 */
export async function POST(request: NextRequest, context: RouteContext<"/api/schedule-periods/[id]/regenerate">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockRegenerate(id, await request.json(), await mockCurrentUserName()));
  }

  return forward(request, `/schedule-periods/${id}/regenerate`);
}
