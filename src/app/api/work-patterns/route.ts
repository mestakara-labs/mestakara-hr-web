import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockCreateWorkPattern, mockListWorkPatterns } from "@/lib/mock/work-pattern-mock";

/** GET /api/work-patterns -> GET /work-patterns — daftar semua pola kerja. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (tambah / ubah / hapus), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListWorkPatterns());
  }

  return forward(request, "/work-patterns");
}

/** POST /api/work-patterns -> POST /work-patterns — tambah pola kerja baru. */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockCreateWorkPattern(await request.json()));
  }

  return forward(request, "/work-patterns");
}
