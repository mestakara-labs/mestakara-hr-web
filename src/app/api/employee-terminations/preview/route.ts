import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockPreviewTermination } from "@/lib/mock/termination-mock";

/**
 * POST /api/employee-terminations/preview -> POST /employee-terminations/preview
 * — PRATINJAU DAMPAK penonaktifan (jabatan diakhiri, bawahan dialihkan, regu ditinggalkan)
 * untuk isian yang BELUM disimpan. Body: { items: [{ id, employee_id, effective_date }] }.
 */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockPreviewTermination(await request.json()));
  }

  return forward(request, "/employee-terminations/preview");
}
