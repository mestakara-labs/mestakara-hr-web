import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/employees/{id}/wage-schemes -> GET /employees/{id}/wage-schemes — riwayat skema upah satu karyawan. */
export async function GET(request: NextRequest, context: RouteContext<"/api/employees/[id]/wage-schemes">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, `/employees/${id}/wage-schemes`);
}

/** POST /api/employees/{id}/wage-schemes -> POST /employees/{id}/wage-schemes — tambah catatan skema upah. */
export async function POST(request: NextRequest, context: RouteContext<"/api/employees/[id]/wage-schemes">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/employees/${id}/wage-schemes`);
}
