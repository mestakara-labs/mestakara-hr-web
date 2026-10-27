import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { mockCancelTermination } from "@/lib/mock/termination-mock";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";

/**
 * POST /api/employee-terminations/{id}/cancel -> POST /employee-terminations/{id}/cancel
 * — batalkan usulan Berlaku (semua perubahannya dikembalikan). Body: { reason } (wajib).
 */
export async function POST(request: NextRequest, context: RouteContext<"/api/employee-terminations/[id]/cancel">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockCancelTermination(id, await request.json(), await mockCurrentUserName()));
  }

  return forward(request, `/employee-terminations/${id}/cancel`);
}
