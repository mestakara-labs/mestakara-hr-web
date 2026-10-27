import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockCancelTransfer } from "@/lib/mock/transfer-mock";

/**
 * POST /api/transfers/{id}/cancel -> POST /transfers/{id}/cancel — batalkan usulan.
 * Body: { reason }. Alasan wajib untuk usulan yang sudah Berlaku.
 */
export async function POST(request: NextRequest, context: RouteContext<"/api/transfers/[id]/cancel">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockCancelTransfer(id, await request.json(), await mockCurrentUserName()));
  }

  return forward(request, `/transfers/${id}/cancel`);
}
