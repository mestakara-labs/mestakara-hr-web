import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockCreateShift, mockListShifts } from "@/lib/mock/shift-mock";

/** GET /api/shifts -> GET /shifts — daftar semua shift. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (tambah / ubah / hapus), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListShifts());
  }

  return forward(request, "/shifts");
}

/** POST /api/shifts -> POST /shifts — tambah shift baru. */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockCreateShift(await request.json()));
  }

  return forward(request, "/shifts");
}
