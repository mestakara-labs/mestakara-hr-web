import { connection, NextRequest, NextResponse } from "next/server";

import { forwardFile } from "@/lib/api-client";
import { mockGetTerminationFile } from "@/lib/mock/termination-mock";
import { isMockMode } from "@/lib/mock/auth-mock";

/**
 * GET /api/employee-terminations/{id}/files?item={id} -> GET /employee-terminations/{id}/files
 * — FILE dokumen dasar penonaktifan, dibuka di tab baru:
 *
 *   (tanpa item)   dokumen kolektif usulan
 *   item={id}      dokumen per orang satu karyawan
 */
export async function GET(request: NextRequest, context: RouteContext<"/api/employee-terminations/[id]/files">) {
  const { id } = await context.params;

  if (isMockMode()) {
    // File bisa berubah, jadi jangan dibuat statis saat build.
    await connection();

    const file = mockGetTerminationFile(id, request.nextUrl.searchParams.get("item"));
    if (!file) {
      return NextResponse.json({ success: false, message: "Dokumen tidak ditemukan.", data: null }, { status: 404 });
    }

    const disposition = file.type === "application/pdf" || file.type.startsWith("image/") ? "inline" : "attachment";
    return new NextResponse(Buffer.from(file.bytes), {
      headers: {
        "Content-Type": file.type,
        // encodeURIComponent supaya nama file berhuruf khusus tetap aman.
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      },
    });
  }

  return forwardFile(request, `/employee-terminations/${id}/files`);
}
