import { NextRequest } from "next/server";

import { forward } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { backendOnly, toNextResponse } from "@/lib/mock/mock-response";

// Data absensi tidak punya versi mock: di mode mock semua method membalas 501 (lihat backendOnly).

/** PUT /api/overtime-entries/{id} -> PUT /overtime-entries/{id} — ubah satu baris lembur; hasilnya bersumber "manual" (alasan wajib). */
export async function PUT(request: NextRequest, context: RouteContext<"/api/overtime-entries/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/overtime-entries/${id}`);
}

/**
 * DELETE /api/overtime-entries/{id}?reason=... -> DELETE /overtime-entries/{id}?reason=... — hapus satu baris lembur.
 * Alasan dikirim lewat alamat karena permintaan DELETE diteruskan tanpa isi (lihat forward).
 */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/overtime-entries/[id]">) {
  const { id } = await context.params;

  if (isMockMode()) {
    return toNextResponse(backendOnly());
  }

  return forward(request, `/overtime-entries/${id}`);
}
