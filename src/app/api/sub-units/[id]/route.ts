import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockDeleteSubUnit, mockGetSubUnit, mockUpdateSubUnit } from "@/lib/mock/sub-unit-mock";

/** GET /api/sub-units/{id} -> GET /sub-units/{id} — detail satu sub unit. */
export async function GET(request: NextRequest, context: RouteContext<"/api/sub-units/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetSubUnit(id));
  }

  return forward(request, `/sub-units/${id}`);
}

/** PUT /api/sub-units/{id} -> PUT /sub-units/{id} — ubah sub unit. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/sub-units/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockUpdateSubUnit(id, await request.json()));
  }

  return forward(request, `/sub-units/${id}`);
}

/** DELETE /api/sub-units/{id} -> DELETE /sub-units/{id} — hapus sub unit. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/sub-units/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeleteSubUnit(id));
  }

  return forward(request, `/sub-units/${id}`);
}
