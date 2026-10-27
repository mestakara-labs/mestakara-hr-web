import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockDeleteDivision, mockGetDivision, mockUpdateDivision } from "@/lib/mock/division-mock";
import { toNextResponse } from "@/lib/mock/mock-response";

/** GET /api/divisions/{id} -> GET /divisions/{id} — detail satu bidang. */
export async function GET(request: NextRequest, context: RouteContext<"/api/divisions/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetDivision(id));
  }

  return forward(request, `/divisions/${id}`);
}

/** PUT /api/divisions/{id} -> PUT /divisions/{id} — ubah bidang. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/divisions/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockUpdateDivision(id, await request.json()));
  }

  return forward(request, `/divisions/${id}`);
}

/** DELETE /api/divisions/{id} -> DELETE /divisions/{id} — hapus bidang. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/divisions/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeleteDivision(id));
  }

  return forward(request, `/divisions/${id}`);
}
