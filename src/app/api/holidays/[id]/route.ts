import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockDeleteHoliday, mockGetHoliday, mockUpdateHoliday } from "@/lib/mock/holiday-mock";

/** GET /api/holidays/{id} -> GET /holidays/{id} — detail satu hari libur. */
export async function GET(request: NextRequest, context: RouteContext<"/api/holidays/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockGetHoliday(id));
  }

  return forward(request, `/holidays/${id}`);
}

/** PUT /api/holidays/{id} -> PUT /holidays/{id} — ubah hari libur. */
export async function PUT(request: NextRequest, context: RouteContext<"/api/holidays/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockUpdateHoliday(id, await request.json()));
  }

  return forward(request, `/holidays/${id}`);
}

/** DELETE /api/holidays/{id} -> DELETE /holidays/{id} — hapus hari libur. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/holidays/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeleteHoliday(id));
  }

  return forward(request, `/holidays/${id}`);
}
