import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { mockCancelActivation } from "@/lib/mock/activation-mock";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";

/**
 * POST /api/employee-activations/{id}/cancel -> POST /employee-activations/{id}/cancel
 * — batalkan usulan Berlaku (semua perubahannya dikembalikan). Body: { reason } (wajib).
 */
export async function POST(request: NextRequest, context: RouteContext<"/api/employee-activations/[id]/cancel">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockCancelActivation(id, await request.json(), await mockCurrentUserName()));
  }

  return forward(request, `/employee-activations/${id}/cancel`);
}
