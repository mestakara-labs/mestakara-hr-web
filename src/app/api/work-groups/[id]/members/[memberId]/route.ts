import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockEndGroupMember } from "@/lib/mock/work-group-mock";

/**
 * PUT /api/work-groups/{id}/members/{memberId} -> PUT /work-groups/{id}/members/{memberId}
 * — akhiri keanggotaan. Body: { end_date }. Riwayat anggota tidak pernah dihapus.
 */
export async function PUT(request: NextRequest, context: RouteContext<"/api/work-groups/[id]/members/[memberId]">) {
  const { id, memberId } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockEndGroupMember(id, memberId, await request.json()));
  }

  return forward(request, `/work-groups/${id}/members/${memberId}`);
}
