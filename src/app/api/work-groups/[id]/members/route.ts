import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockListGroupMembers } from "@/lib/mock/work-group-mock";

/** GET /api/work-groups/{id}/members -> GET /work-groups/{id}/members — anggota regu (aktif & riwayat).
 * Anggota baru ditambahkan lewat PUT /api/work-groups/{id} (wizard regu kerja). */
export async function GET(request: NextRequest, context: RouteContext<"/api/work-groups/[id]/members">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(mockListGroupMembers(id));
  }

  return forward(request, `/work-groups/${id}/members`);
}
