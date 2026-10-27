import { connection, NextRequest, NextResponse } from "next/server";

import { forwardFile } from "@/lib/api-client";
import { mockGetDecreeFile } from "@/lib/mock/assignment-mock";
import { isMockMode } from "@/lib/mock/auth-mock";

/**
 * GET /api/position-assignments/{id}/decree-file -> GET /position-assignments/{id}/decree-file
 * — FILE dokumen dasar penugasan (mis. PDF SK), untuk dibuka langsung di tab browser.
 *
 * Hasilnya file, bukan JSON. "inline" = browser menampilkan file, bukan mengunduhnya.
 */
export async function GET(request: NextRequest, context: RouteContext<"/api/position-assignments/[id]/decree-file">) {
  const { id } = await context.params;

  if (isMockMode()) {
    // File bisa berubah (diganti lewat form), jadi jangan dibuat statis saat build.
    await connection();

    const file = mockGetDecreeFile(id);
    if (!file) {
      return NextResponse.json({ success: false, message: "File dokumen tidak ditemukan.", data: null }, { status: 404 });
    }

    return new NextResponse(Buffer.from(file.bytes), {
      headers: {
        "Content-Type": file.type,
        // encodeURIComponent supaya nama file berhuruf khusus tetap aman.
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      },
    });
  }

  return forwardFile(request, `/position-assignments/${id}/decree-file`);
}
