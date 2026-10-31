/**
 * Jembatan ke backend Laravel. HANYA dipakai di route handler (src/app/api/**),
 * karena membaca cookie HttpOnly lewat next/headers.
 *
 * Komponen client tidak boleh mengimpor file ini — pakai @/lib/http-client.
 */
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-cookie";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000/api/v1";

/** Header untuk setiap request ke backend, ditambah token kalau user sudah login. */
async function backendHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Panggil backend dan kembalikan hasilnya sebagai objek biasa.
 * Dipakai route handler yang masih perlu mengolah hasilnya (mis. login).
 *
 *   const { status, body } = await callBackend("/login", {
 *     method: "POST",
 *     body: { login, password },
 *   });
 */
export async function callBackend<T>(
  endpoint: string,
  options: { method: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown },
): Promise<{ status: number; body: T }> {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: options.method,
    headers: await backendHeaders(),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  return { status: response.status, body: (await response.json()) as T };
}

/**
 * Teruskan request dari browser ke backend apa adanya: method, query string,
 * dan body-nya ikut (termasuk file unggahan). Ini yang dipakai hampir semua route handler.
 *
 *   export async function GET(request: NextRequest) {
 *     return forward(request, "/employees");
 *   }
 */
export async function forward(request: NextRequest, endpoint: string) {
  const hasBody = request.method !== "GET" && request.method !== "DELETE";

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}${request.nextUrl.search}`, {
      method: request.method,
      headers: {
        ...(await backendHeaders()),
        // Jenis isi dari browser ikut diteruskan: JSON, atau multipart/form-data kalau ada file.
        "Content-Type": request.headers.get("content-type") ?? "application/json",
      },
      // Diteruskan sebagai byte apa adanya, supaya file unggahan tidak rusak.
      body: hasBody ? await request.arrayBuffer() : undefined,
    });

    // Diteruskan sebagai teks supaya bentuk respons backend tidak berubah.
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Sinyal internal Next (mis. berhenti prerender saat `next build`) harus diteruskan, bukan dianggap backend gagal.
    unstable_rethrow(error);
    console.error(`[backend] ${request.method} ${endpoint} gagal:`, error);
    return backendUnavailable();
  }
}

/**
 * Teruskan FILE dari backend ke browser apa adanya (mis. PDF dokumen), bukan JSON.
 * Jenis file dan nama filenya (Content-Type & Content-Disposition) ikut diteruskan,
 * supaya browser bisa langsung menampilkannya.
 *
 *   export async function GET(request: NextRequest) {
 *     return forwardFile(request, "/position-assignments/12/decree-file");
 *   }
 */
export async function forwardFile(request: NextRequest, endpoint: string) {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}${request.nextUrl.search}`, {
      method: "GET",
      headers: { ...(await backendHeaders()), Accept: "*/*" },
    });

    const headers: Record<string, string> = {
      "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
    };
    const disposition = response.headers.get("content-disposition");
    if (disposition) headers["Content-Disposition"] = disposition;

    // Diteruskan sebagai byte apa adanya, supaya filenya tidak rusak.
    return new NextResponse(await response.arrayBuffer(), { status: response.status, headers });
  } catch (error) {
    // Sinyal internal Next (mis. berhenti prerender saat `next build`) harus diteruskan, bukan dianggap backend gagal.
    unstable_rethrow(error);
    console.error(`[backend] GET ${endpoint} gagal:`, error);
    return backendUnavailable();
  }
}

/** Respons standar kalau backend tidak bisa dihubungi. */
export function backendUnavailable() {
  return NextResponse.json(
    {
      success: false,
      message: "Tidak dapat terhubung ke server backend.",
      data: null,
    },
    { status: 502 },
  );
}
