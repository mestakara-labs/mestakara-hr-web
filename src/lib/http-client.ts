/**
 * Klien HTTP untuk komponen client.
 *
 * Selalu memanggil route handler Next (path diawali "/api/..."), tidak pernah
 * backend Laravel langsung. Token sesi ada di cookie HttpOnly dan disisipkan
 * oleh route handler, jadi browser tidak perlu tahu soal token.
 *
 * Contoh:
 *   const { data } = await apiGet<UserResource>("/api/auth/me");
 *   await apiPost("/api/auth/logout");
 *   await apiPut("/api/divisions/operasional", { code, name, description });
 *   await apiDelete("/api/divisions/operasional");
 */
import type { ApiResponse } from "@/types/api/response";

/** Error dari backend (status non-2xx atau success: false). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Detail validasi: { field: ["pesan"] } — hanya ada pada 422. */
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(path, init);

  // Kalau server mengirim sesuatu yang bukan JSON, anggap saja kosong.
  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || json?.success === false) {
    throw new ApiError(
      response.status,
      json?.message ?? `Request gagal (${response.status})`,
      json?.errors,
    );
  }

  return json as ApiResponse<T>;
}

/** Ambil data. */
export function apiGet<T>(path: string) {
  return request<T>(path);
}

/** Kirim data baru dalam bentuk JSON. */
export function apiPost<T>(path: string, body: unknown = {}) {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Kirim perubahan data dalam bentuk JSON. */
export function apiPut<T>(path: string, body: unknown = {}) {
  return request<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Kirim data baru yang berisi FILE (multipart/form-data).
 * Header Content-Type sengaja tidak diisi; browser mengisinya sendiri.
 *
 *   const form = new FormData();
 *   form.append("name", "Asep");
 *   form.append("photo", file);
 *   await apiPostForm("/api/employees", form);
 */
export function apiPostForm<T>(path: string, form: FormData) {
  return request<T>(path, { method: "POST", body: form });
}

/** Kirim perubahan data yang berisi FILE (multipart/form-data). */
export function apiPutForm<T>(path: string, form: FormData) {
  return request<T>(path, { method: "PUT", body: form });
}

/** Hapus data. */
export function apiDelete<T>(path: string) {
  return request<T>(path, { method: "DELETE" });
}

/**
 * UNDUH FILE dari server (mis. Excel), lalu simpan ke komputer user.
 *
 *   1. Ambil file dari `path`
 *   2. Gagal (atau isinya kosong) -> lempar ApiError berisi pesan dari server (JSON)
 *   3. Berhasil -> nama file diambil dari header Content-Disposition kiriman server;
 *      kalau tidak ada, pakai `fallbackFileName`
 *   4. Browser menyimpan filenya
 *
 *   const fileName = await apiDownload("/api/employees/export", "Data Karyawan.xlsx");
 *
 * Hasilnya nama file yang disimpan.
 */
export async function apiDownload(path: string, fallbackFileName: string): Promise<string> {
  const response = await fetch(path);

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as ApiResponse<null> | null;
    throw new ApiError(response.status, json?.message ?? `Unduhan gagal (${response.status})`, json?.errors);
  }

  const fileName = fileNameFromDisposition(response.headers.get("content-disposition")) ?? fallbackFileName;
  const blob = await response.blob();

  // Server bisa gagal di tengah jalan dan mengirim isi kosong (mis. 204); jangan simpan file kosong.
  if (blob.size === 0) throw new ApiError(response.status, "File kosong dari server. Silakan coba lagi atau hubungi admin.");

  // Buat link sementara ke file itu, "klik" link-nya, lalu buang lagi.
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return fileName;
}

/**
 * Ambil nama file dari header Content-Disposition. null kalau tidak ada.
 *   `attachment; filename*=UTF-8''Data%20Karyawan.xlsx` -> "Data Karyawan.xlsx"
 *   `attachment; filename="Data Karyawan.xlsx"`        -> "Data Karyawan.xlsx"
 */
function fileNameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;

  // Bentuk filename*= didahulukan karena aman untuk huruf khusus.
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      // Isinya rusak: coba bentuk filename= biasa di bawah.
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1].trim() : null;
}
