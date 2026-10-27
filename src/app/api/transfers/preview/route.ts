import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockPreviewTransfer } from "@/lib/mock/transfer-mock";

/**
 * POST /api/transfers/preview -> POST /transfers/preview
 * — perkiraan perubahan atasan otomatis untuk isian usulan yang BELUM disimpan.
 */
export async function POST(request: NextRequest) {
  if (isMockMode()) {
    return toNextResponse(mockPreviewTransfer(await request.json()));
  }

  return forward(request, "/transfers/preview");
}
