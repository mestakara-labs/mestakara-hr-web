import { connection, NextRequest } from "next/server";

import { forwardFile } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/wage-schemes/template -> GET /wage-schemes/template — FILE Excel template data upah `?period=YYYY-MM` (skema + rekening + cost center). */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forwardFile(request, "/wage-schemes/template");
}
