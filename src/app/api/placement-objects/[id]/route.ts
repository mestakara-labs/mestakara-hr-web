import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockDeletePlacementObject, mockGetPlacementObject, mockUpdatePlacementObject } from "@/lib/mock/placement-object-mock";

/** GET /api/placement-objects/{id} -> GET /placement-objects/{id} — detail satu objek penempatan. */
export async function GET(request: NextRequest, context: RouteContext<"/api/placement-objects/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetPlacementObject(id));
  }

  return forward(request, `/placement-objects/${id}`);
}

/** PUT /api/placement-objects/{id} -> PUT /placement-objects/{id} — ubah objek penempatan. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/placement-objects/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockUpdatePlacementObject(id, await request.json()));
  }

  return forward(request, `/placement-objects/${id}`);
}

/** DELETE /api/placement-objects/{id} -> DELETE /placement-objects/{id} — hapus objek penempatan. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/placement-objects/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeletePlacementObject(id));
  }

  return forward(request, `/placement-objects/${id}`);
}
