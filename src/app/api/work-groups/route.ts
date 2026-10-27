import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockCreateWorkGroup, mockListWorkGroups } from "@/lib/mock/work-group-mock";

/** GET /api/work-groups -> GET /work-groups — daftar semua regu kerja. */
export async function GET(request: NextRequest) {
  if (isMockMode()) {
    // Data mock bisa berubah (tambah / ubah / hapus), jadi jangan dibuat statis saat build.
    await connection();
    return toNextResponse(mockListWorkGroups());
  }

  return forward(request, "/work-groups");
}

/** POST /api/work-groups -> POST /work-groups — tambah regu kerja baru (+ anggota baru). Body: WorkGroupPayload. */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockCreateWorkGroup(await request.json()));
  }

  return forward(request, "/work-groups");
}
