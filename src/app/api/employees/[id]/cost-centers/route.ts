import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/employees/{id}/cost-centers -> GET /employees/{id}/cost-centers — riwayat cost center satu karyawan. */
export async function GET(request: NextRequest, context: RouteContext<"/api/employees/[id]/cost-centers">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, `/employees/${id}/cost-centers`);
}

/** POST /api/employees/{id}/cost-centers -> POST /employees/{id}/cost-centers — tambah catatan cost center. */
export async function POST(request: NextRequest, context: RouteContext<"/api/employees/[id]/cost-centers">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/employees/${id}/cost-centers`);
}
