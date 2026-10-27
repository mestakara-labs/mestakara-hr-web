import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockCreatePlacementCategory, mockListPlacementCategories } from "@/lib/mock/placement-category-mock";

/** GET /api/placement-categories -> GET /placement-categories — daftar semua kategori objek. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (tambah / ubah / hapus), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListPlacementCategories());
  }

  return forward(request, "/placement-categories");
}

/** POST /api/placement-categories -> POST /placement-categories — tambah kategori objek baru. */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockCreatePlacementCategory(await request.json()));
  }

  return forward(request, "/placement-categories");
}
