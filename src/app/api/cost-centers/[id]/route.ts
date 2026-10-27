import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/cost-centers/{id} -> GET /cost-centers/{id} — detail satu cost center. */
export async function GET(request: NextRequest, context: RouteContext<"/api/cost-centers/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, `/cost-centers/${id}`);
}

/** PUT /api/cost-centers/{id} -> PUT /cost-centers/{id} — ubah cost center. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/cost-centers/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/cost-centers/${id}`);
}

/** DELETE /api/cost-centers/{id} -> DELETE /cost-centers/{id} — hapus cost center (ditolak 409 kalau masih dipakai). */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/cost-centers/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/cost-centers/${id}`);
}
