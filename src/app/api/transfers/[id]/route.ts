import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockDeleteTransfer, mockGetTransfer, mockUpdateTransfer } from "@/lib/mock/transfer-mock";

/** GET /api/transfers/{id} -> GET /transfers/{id} — detail satu usulan mutasi. */
export async function GET(request: NextRequest, context: RouteContext<"/api/transfers/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetTransfer(id));
  }

  return forward(request, `/transfers/${id}`);
}

/**
 * PUT /api/transfers/{id} -> PUT /transfers/{id} — ubah usulan Draf / Menunggu Dokumen.
 * Dikirim sebagai multipart/form-data karena bisa berisi scan SK.
 */
export async function PUT(request: NextRequest, context: RouteContext<"/api/transfers/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(await mockUpdateTransfer(id, await request.formData(), await mockCurrentUserName()));
  }

  return forward(request, `/transfers/${id}`);
}

/** DELETE /api/transfers/{id} -> DELETE /transfers/{id} — hapus usulan Draf. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/transfers/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeleteTransfer(id));
  }

  return forward(request, `/transfers/${id}`);
}
