import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { mockListAssignments } from "@/lib/mock/assignment-mock";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";

/**
 * GET /api/position-assignments -> GET /position-assignments — daftar semua penugasan jabatan.
 * `?employee_id={id}` = hanya penugasan satu karyawan (untuk Histori Jabatan di detail karyawan).
 *
 * Hanya untuk membaca. Penugasan dibuat & diakhiri lewat Mutasi & Penempatan.
 */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (lewat mutasi), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListAssignments(request.nextUrl.searchParams.get("employee_id")));
  }

  return forward(request, "/position-assignments");
}
