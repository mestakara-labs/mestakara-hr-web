import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockCreateHoliday, mockListHolidays } from "@/lib/mock/holiday-mock";

/** GET /api/holidays -> GET /holidays — daftar semua hari libur. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (tambah / ubah / hapus), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListHolidays());
  }

  return forward(request, "/holidays");
}

/** POST /api/holidays -> POST /holidays — tambah hari libur baru. */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockCreateHoliday(await request.json()));
  }

  return forward(request, "/holidays");
}
