import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockDeleteSchedulePeriod, mockGetSchedulePeriod } from "@/lib/mock/schedule-period-mock";

/** GET /api/schedule-periods/{id} -> GET /schedule-periods/{id} — detail periode + semua baris jadwal. */
export async function GET(request: NextRequest, context: RouteContext<"/api/schedule-periods/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(mockGetSchedulePeriod(id));
  }

  return forward(request, `/schedule-periods/${id}`);
}

/** DELETE /api/schedule-periods/{id} -> DELETE /schedule-periods/{id} — hapus jadwal Draf. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/schedule-periods/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockDeleteSchedulePeriod(id));
  }

  return forward(request, `/schedule-periods/${id}`);
}
