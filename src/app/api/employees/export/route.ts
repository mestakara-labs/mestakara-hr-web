import { connection, NextRequest } from "next/server";

import { forwardFile } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { failure, toNextResponse } from "@/lib/mock/mock-response";

/**
 * GET /api/employees/export?active_status=... -> GET /employees/export
 * — FILE EXCEL (.xlsx) data karyawan, untuk diunduh dari halaman Data Karyawan.
 *
 *   active_status=Aktif | Belum Aktif | Nonaktif   kosong = semua karyawan
 *
 * Isi dan format Excel-nya disusun SELURUHNYA oleh backend; di sini file hanya diteruskan
 * apa adanya, termasuk nama filenya (Content-Disposition), mis.
 * "Database Karyawan PTPN I Regional 2 Unit Agrowisata - Oktober 2026.xlsx".
 */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Jangan dibuat statis saat build: jawaban ini bergantung pada mode yang sedang dipakai.
    await connection();
    return toNextResponse(failure(501, "Ekspor Excel hanya tersedia saat tersambung ke backend."));
  }

  return forwardFile(request, "/employees/export");
}
