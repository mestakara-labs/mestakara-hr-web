import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { mockDeleteActivation, mockGetActivation, mockUpdateActivation } from "@/lib/mock/activation-mock";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";

/** GET /api/employee-activations/{id} -> GET /employee-activations/{id} — detail satu usulan penambahan. */
export async function GET(request: NextRequest, context: RouteContext<"/api/employee-activations/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(mockGetActivation(id));
  }

  return forward(request, `/employee-activations/${id}`);
}

/**
 * PUT /api/employee-activations/{id} -> PUT /employee-activations/{id} — ubah usulan Draf
 * (Simpan sebagai Draf, atau Simpan & Berlakukan). Dikirim sebagai multipart/form-data.
 */
export async function PUT(request: NextRequest, context: RouteContext<"/api/employee-activations/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(await mockUpdateActivation(id, await request.formData()));
  }

  return forward(request, `/employee-activations/${id}`);
}

/** DELETE /api/employee-activations/{id} -> DELETE /employee-activations/{id} — hapus usulan Draf. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/employee-activations/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeleteActivation(id));
  }

  return forward(request, `/employee-activations/${id}`);
}
