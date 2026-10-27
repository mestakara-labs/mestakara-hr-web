import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { mockSaveActivationDocument } from "@/lib/mock/activation-mock";
import { isMockMode } from "@/lib/mock/auth-mock";
import { toNextResponse } from "@/lib/mock/mock-response";

/**
 * POST /api/employee-activations/{id}/documents -> POST /employee-activations/{id}/documents
 * — unggah / ganti satu dokumen usulan yang sudah Berlaku (multipart/form-data).
 * `item_id` kosong = dokumen kolektif; diisi = dokumen per orang karyawan itu.
 */
export async function POST(request: NextRequest, context: RouteContext<"/api/employee-activations/[id]/documents">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(await mockSaveActivationDocument(id, await request.formData()));
  }

  return forward(request, `/employee-activations/${id}/documents`);
}
