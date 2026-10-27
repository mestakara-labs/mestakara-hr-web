import { connection, NextRequest, NextResponse } from "next/server";

import { forwardFile } from "@/lib/api-client";
import { isMockMode } from "@/lib/mock/auth-mock";
import { mockGetEmployeeFile } from "@/lib/mock/employee-mock";

/**
 * GET /api/employees/{id}/files?type=...&education=... -> GET /employees/{id}/files
 * — FILE milik karyawan, untuk dibuka di tab baru:
 *
 *   type=dokumen                 dokumen dasar penambahan karyawan
 *   type=ijazah&education={id}   ijazah satu riwayat pendidikan
 *
 * PDF dibuka di browser ("inline"); file lain (gambar) diunduh ("attachment").
 */
export async function GET(request: NextRequest, context: RouteContext<"/api/employees/[id]/files">) {
  const { id } = await context.params;

  if (isMockMode()) {
    // File bisa berubah (lewat form karyawan), jadi jangan dibuat statis saat build.
    await connection();

    const { searchParams } = request.nextUrl;
    const file = mockGetEmployeeFile(id, searchParams.get("type") ?? "", searchParams.get("education"));

    if (!file) {
      return NextResponse.json({ success: false, message: "File tidak ditemukan.", data: null }, { status: 404 });
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

  return forwardFile(request, `/employees/${id}/files`);
}
