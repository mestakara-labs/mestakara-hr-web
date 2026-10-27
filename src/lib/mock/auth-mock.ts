/**
 * DATA CONTOH (MOCK) UNTUK LOGIN — SEMENTARA, SELAMA BACKEND BELUM SIAP.
 *
 * Aktif kalau `.env.local` berisi AUTH_MOCK=true. Route handler di
 * src/app/api/auth/** memanggil fungsi di file ini sebagai pengganti backend.
 *
 * Setiap fungsi mengembalikan `{ status, body }` dengan bentuk yang SAMA
 * seperti `callBackend()` di @/lib/api-client. Jadi saat backend Laravel siap,
 * cukup ubah AUTH_MOCK=false — kode lain tidak perlu diubah.
 *
 * Akun contoh (bisa login dengan NIK atau email):
 *
 *   NIK        Email                          Kata sandi
 *   10928374   admin.sdm@agrowisata.test      Mestakara#2026
 *   10928375   staf.sdm@agrowisata.test       Mestakara#2026
 */
import type { ApiResponse } from "@/types/api/response";
import type { LoginResponse, UserResource } from "@/types/api/user";

/** Apakah aplikasi sedang memakai data contoh? */
export function isMockMode(): boolean {
  return process.env.AUTH_MOCK === "true";
}

/** User contoh + kata sandinya. Kata sandi tidak pernah ikut dikirim ke browser. */
const MOCK_USERS: Array<UserResource & { password: string }> = [
  {
    id: 1,
    nik: "10928374",
    name: "Admin SDM",
    email: "admin.sdm@agrowisata.test",
    position: "Administrator SDM",
    unit_name: "Unit Agrowisata",
    password: "Mestakara#2026",
  },
  {
    id: 2,
    nik: "10928375",
    name: "Staf SDM",
    email: "staf.sdm@agrowisata.test",
    position: "Staf SDM",
    unit_name: "Unit Agrowisata",
    password: "Mestakara#2026",
  },
];

/** Token contoh berbentuk "mock-token-<id user>", mis. "mock-token-1". */
const TOKEN_PREFIX = "mock-token-";

/** Buang kata sandi sebelum data user dikirim keluar. */
function withoutPassword(user: UserResource & { password: string }): UserResource {
  return {
    id: user.id,
    nik: user.nik,
    name: user.name,
    email: user.email,
    position: user.position,
    unit_name: user.unit_name,
  };
}

/** Pengganti backend `POST /login`. `login` boleh berisi NIK atau email. */
export function mockLogin(
  login: string,
  password: string,
): { status: number; body: ApiResponse<LoginResponse | null> } {
  const user = MOCK_USERS.find(
    (item) =>
      (item.nik === login || item.email.toLowerCase() === login.toLowerCase()) &&
      item.password === password,
  );

  if (!user) {
    return {
      status: 401,
      body: { success: false, message: "NIK/Email atau kata sandi salah.", data: null },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      message: "Login berhasil",
      data: { token: `${TOKEN_PREFIX}${user.id}`, user: withoutPassword(user) },
    },
  };
}

/** Pengganti backend `GET /me`: cari user pemilik token. */
export function mockGetUser(
  token: string | undefined,
): { status: number; body: ApiResponse<UserResource | null> } {
  const userId = Number(token?.replace(TOKEN_PREFIX, ""));
  const user = MOCK_USERS.find((item) => item.id === userId);

  if (!token || !user) {
    return {
      status: 401,
      body: { success: false, message: "Sesi tidak valid, silakan login kembali.", data: null },
    };
  }

  return {
    status: 200,
    body: { success: true, message: "Data user", data: withoutPassword(user) },
  };
}
