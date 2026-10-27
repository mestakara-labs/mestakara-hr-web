import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockDeletePosition, mockGetPosition, mockUpdatePosition } from "@/lib/mock/position-mock";

/** GET /api/positions/{id} -> GET /positions/{id} — detail satu jabatan. */
export async function GET(request: NextRequest, context: RouteContext<"/api/positions/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetPosition(id));
  }

  return forward(request, `/positions/${id}`);
}

/** PUT /api/positions/{id} -> PUT /positions/{id} — ubah jabatan. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/positions/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockUpdatePosition(id, await request.json()));
  }

  return forward(request, `/positions/${id}`);
}

/** DELETE /api/positions/{id} -> DELETE /positions/{id} — hapus jabatan. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/positions/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeletePosition(id));
  }

  return forward(request, `/positions/${id}`);
}
