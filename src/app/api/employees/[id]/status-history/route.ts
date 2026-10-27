import { connection, NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { mockGetEmployeeStatusHistory } from "@/lib/mock/status-history-mock";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";

/**
 * GET /api/employees/{id}/status-history -> GET /employees/{id}/status-history
 * — RIWAYAT STATUS KEPEGAWAIAN satu karyawan (penambahan; nanti juga penonaktifan), terbaru di atas.
 */
export async function GET(request: NextRequest, context: RouteContext<"/api/employees/[id]/status-history">) {
  const { id } = await context.params;

  if (isMockMode()) {
    await connection();
    return toNextResponse(mockGetEmployeeStatusHistory(id));
  }

  return forward(request, `/employees/${id}/status-history`);
}
