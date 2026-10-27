"use client";

import { useEffect, useState } from "react";

import { apiPost } from "@/lib/http-client";
import type { TerminationPreviewResource } from "@/types/api/employee-termination";

import type { PenonaktifanItemValues } from "./penonaktifan-form-values";

/** Hasil Pratinjau Dampak: dampak per id item, atau pesan error. Keduanya null = sedang dihitung. */
interface TerminationPreviewState {
  preview: TerminationPreviewResource | null;
  error: string | null;
}

/**
 * PRATINJAU DAMPAK dari server untuk isian wizard yang BELUM disimpan: jabatan yang diakhiri,
 * bawahan yang dialihkan, dan regu yang ditinggalkan per karyawan.
 * Dihitung ulang hanya kalau karyawan atau TMT-nya berubah.
 */
export function useTerminationPreview(items: PenonaktifanItemValues[]): TerminationPreviewState {
  const [state, setState] = useState<TerminationPreviewState>({ preview: null, error: null });

  // Hanya bagian yang berpengaruh, dalam bentuk teks supaya mudah dibandingkan.
  const relevantItems = JSON.stringify(
    items.map(({ id, employee_id, effective_date }) => ({ id, employee_id, effective_date })),
  );

  useEffect(() => {
    let isCancelled = false;

    apiPost<TerminationPreviewResource>("/api/employee-terminations/preview", { items: JSON.parse(relevantItems) })
      .then((response) => {
        if (!isCancelled) setState({ preview: response.data, error: null });
      })
      .catch(() => {
        if (!isCancelled) setState({ preview: null, error: "Pratinjau dampak gagal dihitung. Silakan coba lagi." });
      });

    return () => {
      isCancelled = true;
    };
  }, [relevantItems]);

  return state;
}
