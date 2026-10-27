import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockCurrentUserName } from "@/lib/mock/current-user";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockActivateTransfer } from "@/lib/mock/transfer-mock";

/**
 * POST /api/transfers/{id}/activate -> POST /transfers/{id}/activate
 * — unggah scan SK kolektif yang sudah ditandatangani; usulan Menunggu Dokumen menjadi BERLAKU.
 * Dikirim sebagai multipart/form-data (file `signed_file`).
 */
export async function POST(request: NextRequest, context: RouteContext<"/api/transfers/[id]/activate">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(await mockActivateTransfer(id, await request.formData(), await mockCurrentUserName()));
  }

  return forward(request, `/transfers/${id}/activate`);
}
