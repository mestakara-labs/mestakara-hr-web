import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockUpdateSchedule } from "@/lib/mock/schedule-period-mock";

/**
 * PUT /api/schedules/{id} -> PUT /schedules/{id} — ubah shift satu sel jadwal.
 * Body: { shift_id ("" = libur), reason (wajib kalau jadwal sudah Terbit) }.
 */
export async function PUT(request: NextRequest, context: RouteContext<"/api/schedules/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(mockUpdateSchedule(id, await request.json(), await mockCurrentUserName()));
  }

  return forward(request, `/schedules/${id}`);
}
