import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { mockGetAssignment } from "@/lib/mock/assignment-mock";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";

/**
 * GET /api/position-assignments/{id} -> GET /position-assignments/{id} — detail satu penugasan.
 *
 * Hanya untuk membaca. Penugasan dibuat & diakhiri lewat Mutasi & Penempatan.
 */
export async function GET(request: NextRequest, context: RouteContext<"/api/position-assignments/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetAssignment(id));
  }

  return forward(request, `/position-assignments/${id}`);
}
