import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockCreatePlacementObject, mockListPlacementObjects } from "@/lib/mock/placement-object-mock";

/** GET /api/placement-objects -> GET /placement-objects — daftar semua objek penempatan. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (tambah / ubah / hapus), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListPlacementObjects());
  }

  return forward(request, "/placement-objects");
}

/** POST /api/placement-objects -> POST /placement-objects — tambah objek penempatan baru. */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockCreatePlacementObject(await request.json()));
  }

  return forward(request, "/placement-objects");
}
