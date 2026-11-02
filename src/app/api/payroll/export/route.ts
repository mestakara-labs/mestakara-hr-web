import { connection, NextRequest } from "next/server";

import { forwardFile } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data upah tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/**
 * GET /api/payroll/export -> GET /payroll/export — FILE dokumen Daftar Upah (rekap kelompok terpilih + rincian per kelompok)
 * `?period=&group_by=&employee_category=casual|daily_worker&document=daftar_upah|payroll|spkl_all|spkl_reguler|spkl_dw
 *  &group_keys=a,b (kosong = semua)&format=xlsx|pdf&employee_ids=a,b (opsional, hanya SPKL)
 *  &sign_date=YYYY-MM-DD (tanggal tanda tangan)&show_draft=1|0 (tulisan DRAF; periode dikunci = tidak pernah DRAF)`.
 */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    await connection();
    return toNextResponse(backendOnly());
  }

  return forwardFile(request, "/payroll/export");
}
