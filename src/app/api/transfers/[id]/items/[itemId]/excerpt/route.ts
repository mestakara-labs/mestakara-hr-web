import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockUploadExcerpt } from "@/lib/mock/transfer-mock";

/**
 * POST /api/transfers/{id}/items/{itemId}/excerpt -> POST /transfers/{id}/items/{itemId}/excerpt
 * — unggah scan PETIKAN SK satu karyawan (multipart/form-data, file `excerpt_file`).
 * Petikan ini menggantikan scan SK kolektif sebagai dokumen dasar penugasan karyawan itu.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/transfers/[id]/items/[itemId]/excerpt">,
) {
  const { id, itemId } = await context.params;

  if (isMockMode()) {
    return toNextResponse(await mockUploadExcerpt(id, itemId, await request.formData()));
  }

  return forward(request, `/transfers/${id}/items/${itemId}/excerpt`);
}
