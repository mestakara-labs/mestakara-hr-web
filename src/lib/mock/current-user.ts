/**
 * Nama pengguna yang sedang login (data mock), untuk dicatat sebagai "diubah oleh"
 * di riwayat atasan dan usulan mutasi. Hanya dipakai di route handler (membaca cookie).
 */
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/session-cookie";

import { mockGetUser } from "./auth-mock";

/** Nama pengguna yang sedang login, atau "-" kalau tidak diketahui. */
export async function mockCurrentUserName(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return mockGetUser(token).body.data?.name ?? "-";
}
