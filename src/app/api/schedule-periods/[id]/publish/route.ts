import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockPublishSchedulePeriod } from "@/lib/mock/schedule-period-mock";

/** POST /api/schedule-periods/{id}/publish -> POST /schedule-periods/{id}/publish — terbitkan jadwal (Draf -> Terbit). */
export async function POST(request: NextRequest, context: RouteContext<"/api/schedule-periods/[id]/publish">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockPublishSchedulePeriod(id, await mockCurrentUserName()));
  }

  return forward(request, `/schedule-periods/${id}/publish`);
}
