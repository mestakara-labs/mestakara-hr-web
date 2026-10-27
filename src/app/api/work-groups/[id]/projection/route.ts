import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockProjectWorkGroup } from "@/lib/mock/work-group-mock";

/**
 * GET /api/work-groups/{id}/projection?from=YYYY-MM-DD&to=YYYY-MM-DD -> GET /work-groups/{id}/projection
 * — proyeksi jadwal regu dari rumus rotasi (tidak disimpan) beserta slot kosong.
 */
export async function GET(request: NextRequest, context: RouteContext<"/api/work-groups/[id]/projection">) {
  const { id } = await context.params;

  if (isMockMode()) {
    // Hasilnya berubah mengikuti data anggota & pola, jadi jangan dibuat statis saat build.
    await connection();
    const { searchParams } = request.nextUrl;
    return toNextResponse(mockProjectWorkGroup(id, searchParams.get("from") ?? "", searchParams.get("to") ?? ""));
  }

  return forward(request, `/work-groups/${id}/projection`);
}
