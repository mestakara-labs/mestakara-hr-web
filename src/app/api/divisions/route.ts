import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCreateDivision, mockListDivisions } from "@/lib/mock/division-mock";
import { toNextResponse } from "@/lib/mock/mock-response";

/** GET /api/divisions -> GET /divisions — daftar semua bidang. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (tambah / ubah / hapus), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListDivisions());
  }

  return forward(request, "/divisions");
}

/** POST /api/divisions -> POST /divisions — tambah bidang baru. */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockCreateDivision(await request.json()));
  }

  return forward(request, "/divisions");
}
