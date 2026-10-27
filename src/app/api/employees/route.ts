import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCreateEmployee, mockListEmployees } from "@/lib/mock/employee-mock";
import { toNextResponse } from "@/lib/mock/mock-response";

/**
 * GET /api/employees?period=YYYY-MM -> GET /employees — daftar semua karyawan.
 * `period` (opsional) = Periode Data: status, jabatan, dan masa kerja dihitung pada periode itu.
 */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (tambah / ubah / hapus), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListEmployees(request.nextUrl.searchParams.get("period")));
  }

  return forward(request, "/employees");
}

/**
 * POST /api/employees -> POST /employees — tambah karyawan.
 * Dikirim sebagai multipart/form-data karena ada file (foto & dokumen dasar penambahan).
 */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(await mockCreateEmployee(await request.formData()));
  }

  return forward(request, "/employees");
}
