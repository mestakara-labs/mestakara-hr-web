import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockDeleteWorkGroup, mockGetWorkGroup, mockUpdateWorkGroup } from "@/lib/mock/work-group-mock";

/** GET /api/work-groups/{id} -> GET /work-groups/{id} — detail satu regu kerja. */
export async function GET(request: NextRequest, context: RouteContext<"/api/work-groups/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetWorkGroup(id));
  }

  return forward(request, `/work-groups/${id}`);
}

/** PUT /api/work-groups/{id} -> PUT /work-groups/{id} — ubah regu kerja (+ anggota baru; anggota lama tidak diubah). Body: WorkGroupPayload. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/work-groups/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockUpdateWorkGroup(id, await request.json()));
  }

  return forward(request, `/work-groups/${id}`);
}

/** DELETE /api/work-groups/{id} -> DELETE /work-groups/{id} — hapus regu kerja. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/work-groups/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeleteWorkGroup(id));
  }

  return forward(request, `/work-groups/${id}`);
}
