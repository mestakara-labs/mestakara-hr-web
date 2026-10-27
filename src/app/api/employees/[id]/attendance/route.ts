import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data absensi tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** GET /api/employees/{id}/attendance -> GET /employees/{id}/attendance — detail absensi satu karyawan `?period=YYYY-MM` (kode per tanggal, lembur, jejak perubahan). */
export async function GET(request: NextRequest, context: RouteContext<"/api/employees/[id]/attendance">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forward(request, `/employees/${id}/attendance`);
}

/** PUT /api/employees/{id}/attendance -> PUT /employees/{id}/attendance — koreksi manual kode satu tanggal (alasan wajib). */
export async function PUT(request: NextRequest, context: RouteContext<"/api/employees/[id]/attendance">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/employees/${id}/attendance`);
}
