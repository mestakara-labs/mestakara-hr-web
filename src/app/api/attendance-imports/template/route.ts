import { connection, NextRequest } from "next/server";

import { forwardFile } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data absensi tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/attendance-imports/template -> GET /attendance-imports/template — FILE Excel template `?period=YYYY-MM&type=daftar_hadir|lembur_reguler|lembur_dw`, sudah terisi data tersimpan. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forwardFile(request, "/attendance-imports/template");
}
