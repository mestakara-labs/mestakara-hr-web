import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockGetOrganization } from "@/lib/mock/position-mock";

/**
 * GET /api/organization -> GET /organization
 *
 * Mengembalikan struktur organisasi: daftar jabatan beserta pegawainya.
 */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (tambah / ubah / hapus), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockGetOrganization());
  }

  return forward(request, "/organization");
}
