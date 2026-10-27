/**
 * Bentuk hasil semua fungsi mock: `{ status, body }`, SAMA seperti `callBackend()`
 * di @/lib/api-client. Jadi route handler memperlakukan data mock dan data backend
 * dengan cara yang sama.
 */
import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api/response";

export interface MockResult<T> {
  status: number;
  body: ApiResponse<T>;
}

/** Hasil berhasil, mis. `success("Bidang berhasil ditambahkan", bidang, 201)`. */
export function success<T>(message: string, data: T, status = 200): MockResult<T> {
  return { status, body: { success: true, message, data } };
}

/**
 * Hasil gagal.
 * - 404 = data tidak ditemukan
 * - 409 = ditolak karena data masih dipakai
 * - 422 = isian tidak valid; `errors` berisi pesan per isian: { code: ["Kode sudah dipakai"] }
 */
export function failure(
  status: number,
  message: string,
  errors?: Record<string, string[]>,
): MockResult<null> {
  return { status, body: { success: false, message, data: null, errors } };
}

/**
 * Hasil untuk fitur yang TIDAK punya versi mock (hanya tersedia saat tersambung ke backend),
 * mis. data upah & ekspor Excel. Browser menampilkan pesannya sebagai error biasa.
 */
export function backendOnly(): MockResult<null> {
  return failure(501, "Fitur ini hanya tersedia saat tersambung ke backend (AUTH_MOCK=false).");
}

/** Ubah hasil mock menjadi respons route handler. */
export function toNextResponse<T>(result: MockResult<T>) {
  return NextResponse.json(result.body, { status: result.status });
}
