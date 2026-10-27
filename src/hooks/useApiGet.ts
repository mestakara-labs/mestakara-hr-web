"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, apiGet } from "@/lib/http-client";

/**
 * Ambil data dari route handler BFF saat halaman dibuka.
 *
 *   const { data, loading, error, reload } = useApiGet<DivisionResource[]>("/api/divisions");
 *
 * - `loading`    true selama data PERTAMA KALI diambil
 * - `refreshing` true selama data diambil ulang karena `path` BERUBAH (mis. ganti periode);
 *                data lama tetap tersedia sampai data baru datang
 * - `error`      pesan error kalau gagal (mis. "Bidang tidak ditemukan.")
 * - `reload`     ambil ulang datanya, mis. setelah sebuah baris dihapus
 */
export function useApiGet<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Alamat yang hasilnya sedang dipegang `data` / `error`. */
  const [loadedPath, setLoadedPath] = useState<string | null>(null);

  // Setiap kali angka ini bertambah, data diambil ulang (lihat `reload`).
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // Kalau halaman sudah ditinggalkan sebelum data datang, hasilnya diabaikan.
    let isCancelled = false;

    async function load() {
      try {
        const response = await apiGet<T>(path);
        if (!isCancelled) {
          setData(response.data);
          setError(null);
        }
      } catch (loadError) {
        console.error(`Gagal memuat ${path}:`, loadError);
        if (!isCancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Data gagal dimuat. Silakan muat ulang halaman.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
          setLoadedPath(path);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [path, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  // Sudah pernah dimuat, tapi untuk alamat yang lain -> sedang mengambil data alamat yang baru.
  const refreshing = !loading && loadedPath !== path;

  return { data, loading, refreshing, error, reload };
}
