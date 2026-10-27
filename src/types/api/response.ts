/**
 * Bentuk respons backend.
 * Semua endpoint membungkus datanya dengan struktur ini.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  /** Hanya ada pada respons error validasi (422): { field: ["pesan"] } */
  errors?: Record<string, string[]>;
}
