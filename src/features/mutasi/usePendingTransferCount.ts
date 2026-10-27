"use client";

import { useEffect, useState } from "react";

import { apiGet } from "@/lib/http-client";
import { TRANSFER_STATUS } from "@/lib/transfer-rules";
import type { TransferResource } from "@/types/api/transfer";

/** Nama sinyal browser yang dikirim setiap kali status usulan mutasi berubah. */
const TRANSFERS_CHANGED = "mutasi:transfers-changed";

/**
 * Beri tahu badge & pengingat bahwa status usulan berubah (mis. scan SK diunggah,
 * usulan dibatalkan), supaya angkanya dimuat ulang walau user tidak pindah halaman.
 */
export function notifyTransfersChanged() {
  window.dispatchEvent(new Event(TRANSFERS_CHANGED));
}

/**
 * Jumlah usulan mutasi yang MENUNGGU DOKUMEN (scan SK bertanda tangan belum diunggah).
 * Dipakai untuk badge angka di menu sidebar dan pengingat di halaman Jabatan Karyawan.
 *
 * Angkanya dimuat ulang:
 *   - setiap kali `refreshKey` berubah (mis. alamat halaman), dan
 *   - setiap kali notifyTransfersChanged() dipanggil.
 * Kalau gagal dimuat, angkanya 0 (pengingat cukup tidak tampil).
 */
export function usePendingTransferCount(refreshKey?: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    function load() {
      apiGet<TransferResource[]>("/api/transfers")
        .then((response) => {
          const pending = response.data.filter((transfer) => transfer.status === TRANSFER_STATUS.waiting).length;
          if (!isCancelled) setCount(pending);
        })
        .catch(() => {
          if (!isCancelled) setCount(0);
        });
    }

    load();
    window.addEventListener(TRANSFERS_CHANGED, load);

    return () => {
      isCancelled = true;
      window.removeEventListener(TRANSFERS_CHANGED, load);
    };
  }, [refreshKey]);

  return count;
}
