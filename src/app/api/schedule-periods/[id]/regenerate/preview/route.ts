import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockPreviewRegenerate } from "@/lib/mock/schedule-regenerate-mock";

/**
 * POST /api/schedule-periods/{id}/regenerate/preview -> POST /schedule-periods/{id}/regenerate/preview
 * — PRATINJAU buat ulang jadwal (tidak disimpan). Body: { from_date, keep_manual, reason }.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/schedule-periods/[id]/regenerate/preview">,
) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockPreviewRegenerate(id, await request.json()));
  }

  return forward(request, `/schedule-periods/${id}/regenerate/preview`);
}
