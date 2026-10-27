import { connection, NextRequest } from "next/server";

import { forwardFile } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/payroll/spkl -> GET /payroll/spkl — file SPKL `?period=&type=reguler|dw&group_by=&group_key=&format=xlsx|pdf&employee_ids=`. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forwardFile(request, "/payroll/spkl");
}
