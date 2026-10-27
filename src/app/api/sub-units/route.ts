import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockCreateSubUnit, mockListSubUnits } from "@/lib/mock/sub-unit-mock";

/** GET /api/sub-units -> GET /sub-units — daftar semua sub unit. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (tambah / ubah / hapus), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListSubUnits());
  }

  return forward(request, "/sub-units");
}

/** POST /api/sub-units -> POST /sub-units — tambah sub unit baru. */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockCreateSubUnit(await request.json()));
  }

  return forward(request, "/sub-units");
}
