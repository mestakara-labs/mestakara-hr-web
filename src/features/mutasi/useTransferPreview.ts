"use client";

import { useEffect, useState } from "react";

import { apiPost } from "@/lib/http-client";
import type { TransferItemPayload, TransferPreviewResource } from "@/types/api/transfer";

/** Jeda sebelum perkiraan dihitung ulang, supaya server tidak dipanggil di setiap klik. */
const DELAY_MS = 400;

/**
 * Perkiraan dari server untuk isian wizard yang BELUM disimpan:
 *   - perubahan atasan otomatis (ditampilkan di langkah Tinjau)
 *   - jumlah bawahan yang bisa dikembalikan per jabatan (pilihan "Kembalikan bawahan")
 *
 * Dihitung ulang hanya kalau isian yang berpengaruh berubah: karyawan, jabatan lama,
 * jabatan baru, atau pilihan "Kembalikan bawahan". null = sedang dihitung / gagal.
 */
export function useTransferPreview(items: TransferItemPayload[]): TransferPreviewResource | null {
  const [preview, setPreview] = useState<TransferPreviewResource | null>(null);

  // Hanya bagian yang berpengaruh, dalam bentuk teks supaya mudah dibandingkan.
  const relevantItems = JSON.stringify(
    items.map(({ id, employee_id, from_assignment_id, position_id, restore_subordinates }) => ({
      id,
      employee_id,
      from_assignment_id,
      position_id,
      restore_subordinates,
    })),
  );

  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(async () => {
      try {
        const response = await apiPost<TransferPreviewResource>("/api/transfers/preview", {
          items: JSON.parse(relevantItems),
        });
        if (!isCancelled) setPreview(response.data);
      } catch {
        if (!isCancelled) setPreview(null);
      }
    }, DELAY_MS);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [relevantItems]);

  return preview;
}
