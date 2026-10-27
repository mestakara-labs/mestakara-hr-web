import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockCreateSchedulePeriod, mockListSchedulePeriods } from "@/lib/mock/schedule-period-mock";

/** GET /api/schedule-periods?group_id=&month= -> GET /schedule-periods — daftar periode jadwal. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    const { searchParams } = request.nextUrl;
    return toNextResponse(mockListSchedulePeriods(searchParams.get("group_id"), searchParams.get("month")));
  }

  return forward(request, "/schedule-periods");
}

/**
 * POST /api/schedule-periods -> POST /schedule-periods — BUAT JADWAL (Draf) satu regu untuk satu bulan.
 * Body: { group_id, month }. Di backend, proses yang sama juga dijalankan cron setiap tanggal 20.
 */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockCreateSchedulePeriod(await request.json(), await mockCurrentUserName()));
  }

  return forward(request, "/schedule-periods");
}
