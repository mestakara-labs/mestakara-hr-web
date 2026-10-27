import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockDeleteShift, mockGetShift, mockUpdateShift } from "@/lib/mock/shift-mock";

/** GET /api/shifts/{id} -> GET /shifts/{id} — detail satu shift. */
export async function GET(request: NextRequest, context: RouteContext<"/api/shifts/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetShift(id));
  }

  return forward(request, `/shifts/${id}`);
}

/** PUT /api/shifts/{id} -> PUT /shifts/{id} — ubah shift. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/shifts/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockUpdateShift(id, await request.json()));
  }

  return forward(request, `/shifts/${id}`);
}

/** DELETE /api/shifts/{id} -> DELETE /shifts/{id} — hapus shift. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/shifts/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeleteShift(id));
  }

  return forward(request, `/shifts/${id}`);
}
