import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockChangeSupervisors } from "@/lib/mock/supervisor-mock";

/**
 * POST /api/position-assignments/supervisors -> POST /position-assignments/supervisors
 * — ubah atasan langsung SATU atau BEBERAPA penugasan sekaligus (tanpa SK, tercatat di riwayat).
 */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    // Nama pengguna yang sedang login dicatat di riwayat atasan.
    return toNextResponse(mockChangeSupervisors(await request.json(), await mockCurrentUserName()));
  }

  return forward(request, "/position-assignments/supervisors");
}
