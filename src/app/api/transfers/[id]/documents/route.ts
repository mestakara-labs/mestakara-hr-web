import { connection, NextRequest, NextResponse } from "next/server";

import { forwardFile } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockGetTransferDocument } from "@/lib/mock/transfer-mock";

/**
 * GET /api/transfers/{id}/documents?type=...&item=...&format=... -> GET /transfers/{id}/documents
 * — FILE dokumen usulan mutasi, untuk dibuka di tab baru atau diunduh:
 *
 *   type=sk&format=pdf|doc                 SK kolektif (dibuat dari template)
 *   type=petikan&item={id}&format=pdf|doc  petikan SK satu karyawan
 *   type=scan                              scan SK kolektif bertanda tangan
 *   type=scan-petikan&item={id}            scan petikan SK satu karyawan
 *   type=dasar                             dokumen dasar mutasi
 *
 * PDF dibuka di browser ("inline"); Word diunduh ("attachment").
 */
export async function GET(request: NextRequest, context: RouteContext<"/api/transfers/[id]/documents">) {
  const { id } = await context.params;

  if (isMockMode()) {
    // File bisa berubah, jadi jangan dibuat statis saat build.
    await connection();

    const { searchParams } = request.nextUrl;
    const file = mockGetTransferDocument(id, {
      type: searchParams.get("type") ?? "",
      item: searchParams.get("item"),
      format: searchParams.get("format") ?? "pdf",
    });

    if (!file) {
      return NextResponse.json({ success: false, message: "Dokumen tidak ditemukan.", data: null }, { status: 404 });
    }

    const disposition = file.type === "application/pdf" ? "inline" : "attachment";
    return new NextResponse(Buffer.from(file.bytes), {
      headers: {
        "Content-Type": file.type,
        // encodeURIComponent supaya nama file berhuruf khusus tetap aman.
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      },
    });
  }

  return forwardFile(request, `/transfers/${id}/documents`);
}
