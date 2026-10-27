import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";
import { mockSaveBasisDocument } from "@/lib/mock/transfer-mock";

/**
 * POST /api/transfers/{id}/basis-document -> POST /transfers/{id}/basis-document
 * — simpan DOKUMEN DASAR usulan mutasi dari halaman detail (usulan Draf / Menunggu Dokumen).
 * Dikirim sebagai multipart/form-data: basis_document_type, basis_document_number,
 * basis_document_date, dan file `basis_document_file` (atau keep_basis_document_file = "1").
 */
export async function POST(request: NextRequest, context: RouteContext<"/api/transfers/[id]/basis-document">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(await mockSaveBasisDocument(id, await request.formData()));
  }

  return forward(request, `/transfers/${id}/basis-document`);
}
