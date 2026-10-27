import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/signature-settings/payroll-groups/{id} -> GET /signature-settings/payroll-groups/{id} — penanda tangan satu Kelompok Daftar Upah. */
export async function GET(request: NextRequest, context: RouteContext<"/api/signature-settings/payroll-groups/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, `/signature-settings/payroll-groups/${id}`);
}

/** PUT /api/signature-settings/payroll-groups/{id} -> PUT /signature-settings/payroll-groups/{id} — simpan (null = pakai Umum). */
export async function PUT(request: NextRequest, context: RouteContext<"/api/signature-settings/payroll-groups/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/signature-settings/payroll-groups/${id}`);
}
