import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data absensi tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/overtime-entries -> GET /overtime-entries — daftar lembur `?period=YYYY-MM&type=lembur_reguler|lembur_dw`. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, "/overtime-entries");
}

/** POST /api/overtime-entries -> POST /overtime-entries — tambah satu baris lembur manual (alasan wajib). */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, "/overtime-entries");
}
