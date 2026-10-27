import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { mockDeleteTermination, mockGetTermination, mockUpdateTermination } from "@/lib/mock/termination-mock";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";

/** GET /api/employee-terminations/{id} -> GET /employee-terminations/{id} — detail satu usulan penonaktifan. */
export async function GET(request: NextRequest, context: RouteContext<"/api/employee-terminations/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(mockGetTermination(id));
  }

  return forward(request, `/employee-terminations/${id}`);
}

/**
 * PUT /api/employee-terminations/{id} -> PUT /employee-terminations/{id} — ubah usulan Draf
 * (Simpan sebagai Draf, atau Simpan & Berlakukan). Dikirim sebagai multipart/form-data.
 */
export async function PUT(request: NextRequest, context: RouteContext<"/api/employee-terminations/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(await mockUpdateTermination(id, await request.formData(), await mockCurrentUserName()));
  }

  return forward(request, `/employee-terminations/${id}`);
}

/** DELETE /api/employee-terminations/{id} -> DELETE /employee-terminations/{id} — hapus usulan Draf. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/employee-terminations/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeleteTermination(id));
  }

  return forward(request, `/employee-terminations/${id}`);
}
