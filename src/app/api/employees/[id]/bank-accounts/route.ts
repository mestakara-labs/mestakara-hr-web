import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/employees/{id}/bank-accounts -> GET /employees/{id}/bank-accounts — riwayat rekening bank satu karyawan. */
export async function GET(request: NextRequest, context: RouteContext<"/api/employees/[id]/bank-accounts">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, `/employees/${id}/bank-accounts`);
}

/** POST /api/employees/{id}/bank-accounts -> POST /employees/{id}/bank-accounts — tambah catatan rekening. */
export async function POST(request: NextRequest, context: RouteContext<"/api/employees/[id]/bank-accounts">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/employees/${id}/bank-accounts`);
}
