import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/signature-settings/divisions/{id} -> GET /signature-settings/divisions/{id} — penanda tangan satu Bidang. */
export async function GET(request: NextRequest, context: RouteContext<"/api/signature-settings/divisions/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, `/signature-settings/divisions/${id}`);
}

/** PUT /api/signature-settings/divisions/{id} -> PUT /signature-settings/divisions/{id} — simpan (null = pakai Umum). */
export async function PUT(request: NextRequest, context: RouteContext<"/api/signature-settings/divisions/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/signature-settings/divisions/${id}`);
}
