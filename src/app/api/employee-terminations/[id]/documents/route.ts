import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { mockSaveTerminationDocument } from "@/lib/mock/termination-mock";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";

/**
 * POST /api/employee-terminations/{id}/documents -> POST /employee-terminations/{id}/documents
 * — ganti satu dokumen usulan yang sudah Berlaku (multipart/form-data).
 * `item_id` kosong = dokumen kolektif; diisi = dokumen per orang karyawan itu.
 */
export async function POST(request: NextRequest, context: RouteContext<"/api/employee-terminations/[id]/documents">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(await mockSaveTerminationDocument(id, await request.formData()));
  }

  return forward(request, `/employee-terminations/${id}/documents`);
}
