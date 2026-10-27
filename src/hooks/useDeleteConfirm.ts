"use client";

import { useCallback, useState } from "react";
import { toast } from "@mestakara/ui/sonner";

import { ApiError } from "@/lib/http-client";

interface UseDeleteConfirmOptions<TRow> {
  /** Kirim permintaan hapus ke server. Lempar error kalau gagal. */
  onDelete: (row: TRow) => Promise<void>;
  /** Dipanggil HANYA kalau penghapusan berhasil, mis. untuk memuat ulang tabel. */
  onSuccess: () => void;
  /** Pesan toast kalau berhasil, mis. (bidang) => `Bidang "${bidang.name}" berhasil dihapus` */
  successMessage: (row: TRow) => string;
}

/**
 * Alur hapus satu baris tabel:
 *
 *   1. Tombol "Hapus" diklik     -> `ask(baris)` membuka dialog konfirmasi
 *   2. User menekan "Hapus"      -> `confirm()` mengirim permintaan ke server
 *   3a. Berhasil                 -> dialog ditutup, toast hijau, `onSuccess()` (tabel dimuat ulang)
 *   3b. Ditolak server (mis. 409 karena masih dipakai)
 *                                -> dialog ditutup, toast merah berisi alasannya
 *
 * @example
 * const hapus = useDeleteConfirm<DivisionResource>({
 *   onDelete: (bidang) => apiDelete(`/api/divisions/${bidang.id}`),
 *   onSuccess: reload,
 *   successMessage: (bidang) => `Bidang "${bidang.name}" berhasil dihapus`,
 * });
 *
 * <ConfirmDeleteDialog target={hapus.target} ... onConfirm={hapus.confirm} onCancel={hapus.cancel} />
 */
export function useDeleteConfirm<TRow>({
  onDelete,
  onSuccess,
  successMessage,
}: UseDeleteConfirmOptions<TRow>) {
  /** Baris yang sedang ditanyakan. null = dialog tertutup. */
  const [target, setTarget] = useState<TRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // useCallback: fungsi ini tetap sama di setiap render, karena biasanya
  // diteruskan ke konfigurasi kolom tabel yang dibuat sekali dengan useMemo.
  const ask = useCallback((row: TRow) => setTarget(row), []);

  function cancel() {
    // Permintaan yang sudah terkirim tidak bisa dibatalkan.
    if (deleting) return;
    setTarget(null);
  }

  async function confirm() {
    if (!target) return;

    setDeleting(true);

    try {
      await onDelete(target);
      toast.success(successMessage(target));
      onSuccess();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
      toast.error("Data gagal dihapus", { description: message });
    } finally {
      setDeleting(false);
      setTarget(null);
    }
  }

  return { target, deleting, ask, cancel, confirm };
}
