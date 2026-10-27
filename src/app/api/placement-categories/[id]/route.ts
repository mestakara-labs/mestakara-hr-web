import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import {
  mockDeletePlacementCategory,
  mockGetPlacementCategory,
  mockUpdatePlacementCategory,
} from "@/lib/mock/placement-category-mock";

/** GET /api/placement-categories/{id} -> GET /placement-categories/{id} — detail satu kategori objek. */
export async function GET(request: NextRequest, context: RouteContext<"/api/placement-categories/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetPlacementCategory(id));
  }

  return forward(request, `/placement-categories/${id}`);
}

/** PUT /api/placement-categories/{id} -> PUT /placement-categories/{id} — ubah kategori objek. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/placement-categories/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockUpdatePlacementCategory(id, await request.json()));
  }

  return forward(request, `/placement-categories/${id}`);
}

/** DELETE /api/placement-categories/{id} -> DELETE /placement-categories/{id} — hapus kategori objek. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/placement-categories/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeletePlacementCategory(id));
  }

  return forward(request, `/placement-categories/${id}`);
}
