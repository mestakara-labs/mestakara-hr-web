import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** POST /api/wage-schemes/bulk -> POST /wage-schemes/bulk — ubah skema upah banyak karyawan sekaligus (hanya isian di `fields`). */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, "/wage-schemes/bulk");
}
