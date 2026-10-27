import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data absensi tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/attendance-imports -> GET /attendance-imports — status unggahan 3 bagian (Daftar Hadir, Lembur Reguler, Lembur DW) `?period=YYYY-MM` + riwayatnya. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, "/attendance-imports");
}

/** POST /api/attendance-imports -> POST /attendance-imports — simpan file unggahan (multipart: file, period, type); ditolak 422 kalau ada baris salah, 423 kalau periode dikunci. */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, "/attendance-imports");
}
