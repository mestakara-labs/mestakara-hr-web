import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data absensi tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** POST /api/dw-overtime-recommendations/preview -> POST /overtime-dw/recommendations/preview — hitung rekomendasi TANPA menyimpan ({ period, employee_ids? }). */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, "/overtime-dw/recommendations/preview");
}
