import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data absensi tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/dw-overtime-targets -> GET /overtime-dw/targets — Target vs Upah Lembur DW per karyawan `?period=YYYY-MM`. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, "/overtime-dw/targets");
}
