import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** PUT /api/payroll/deductions -> PUT /payroll/deductions — ubah potongan satu / beberapa karyawan (isian yang tidak dikirim tidak diubah). */
export async function PUT(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, "/payroll/deductions");
}
