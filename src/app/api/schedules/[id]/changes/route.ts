import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockListScheduleChanges } from "@/lib/mock/schedule-period-mock";

/** GET /api/schedules/{id}/changes -> GET /schedules/{id}/changes — riwayat perubahan satu sel jadwal. */
export async function GET(request: NextRequest, context: RouteContext<"/api/schedules/[id]/changes">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(mockListScheduleChanges(id));
  }

  return forward(request, `/schedules/${id}/changes`);
}
