/**
 * Pengaturan cookie sesi login — dikumpulkan di satu tempat.
 *
 * Dipakai oleh:
 * - src/app/api/auth/**  (menyimpan & menghapus cookie)
 * - src/lib/api-client.ts (membaca token untuk dikirim ke backend)
 * - src/proxy.ts         (memeriksa apakah user sudah login)
 */

/** Nama cookie tempat token login disimpan. */
export const SESSION_COOKIE = "session_token";

/** Lama sesi kalau "Ingat saya" dicentang: 8 jam (sesuai label "Sesi 8 Jam" di halaman login). */
const REMEMBER_ME_SECONDS = 8 * 60 * 60;

/**
 * Pengaturan cookie saat login berhasil.
 *
 * - httpOnly: cookie tidak bisa dibaca JavaScript di browser (lebih aman).
 * - maxAge  : "Ingat saya" dicentang -> bertahan 8 jam.
 *             Tidak dicentang        -> undefined, artinya cookie hilang saat browser ditutup.
 */
export function sessionCookieOptions(rememberMe: boolean) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: rememberMe ? REMEMBER_ME_SECONDS : undefined,
  };
}
