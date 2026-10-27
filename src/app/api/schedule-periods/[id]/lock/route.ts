import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockLockSchedulePeriod } from "@/lib/mock/schedule-period-mock";

/** POST /api/schedule-periods/{id}/lock -> POST /schedule-periods/{id}/lock — kunci jadwal (Terbit -> Terkunci). */
export async function POST(request: NextRequest, context: RouteContext<"/api/schedule-periods/[id]/lock">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockLockSchedulePeriod(id, await mockCurrentUserName()));
  }

  return forward(request, `/schedule-periods/${id}/lock`);
}
