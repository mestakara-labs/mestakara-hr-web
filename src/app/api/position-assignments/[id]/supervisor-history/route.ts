import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockGetSupervisorHistory } from "@/lib/mock/supervisor-mock";

/**
 * GET /api/position-assignments/{id}/supervisor-history -> GET /position-assignments/{id}/supervisor-history
 * — riwayat perubahan atasan satu penugasan, terbaru di atas.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/position-assignments/[id]/supervisor-history">,
) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetSupervisorHistory(id));
  }

  return forward(request, `/position-assignments/${id}/supervisor-history`);
}
