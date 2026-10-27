import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockDeleteWorkPattern, mockGetWorkPattern, mockUpdateWorkPattern } from "@/lib/mock/work-pattern-mock";

/** GET /api/work-patterns/{id} -> GET /work-patterns/{id} — detail satu pola kerja. */
export async function GET(request: NextRequest, context: RouteContext<"/api/work-patterns/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetWorkPattern(id));
  }

  return forward(request, `/work-patterns/${id}`);
}

/** PUT /api/work-patterns/{id} -> PUT /work-patterns/{id} — ubah pola kerja. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/work-patterns/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockUpdateWorkPattern(id, await request.json()));
  }

  return forward(request, `/work-patterns/${id}`);
}

/** DELETE /api/work-patterns/{id} -> DELETE /work-patterns/{id} — hapus pola kerja. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/work-patterns/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeleteWorkPattern(id));
  }

  return forward(request, `/work-patterns/${id}`);
}
