import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockCreatePosition, mockListPositions } from "@/lib/mock/position-mock";

/** GET /api/positions -> GET /positions — daftar semua jabatan. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (tambah / ubah / hapus), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListPositions());
  }

  return forward(request, "/positions");
}

/** POST /api/positions -> POST /positions — tambah jabatan baru. */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockCreatePosition(await request.json()));
  }

  return forward(request, "/positions");
}
