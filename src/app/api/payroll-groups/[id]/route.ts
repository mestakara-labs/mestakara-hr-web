import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/payroll-groups/{id} -> GET /payroll-groups/{id} — detail satu kelompok. */
export async function GET(request: NextRequest, context: RouteContext<"/api/payroll-groups/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, `/payroll-groups/${id}`);
}

/** PUT /api/payroll-groups/{id} -> PUT /payroll-groups/{id} — ubah kelompok. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/payroll-groups/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/payroll-groups/${id}`);
}

/** DELETE /api/payroll-groups/{id} -> DELETE /payroll-groups/{id} — hapus kelompok (ditolak 409 kalau masih dipakai). */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/payroll-groups/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/payroll-groups/${id}`);
}
