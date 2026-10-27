"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { ShiftResource } from "@/types/api/shift";

import { ShiftForm } from "./ShiftForm";

/** Halaman edit shift: ambil dulu data shiftnya, lalu tampilkan form yang sudah terisi. */
export function ShiftEditPage({ id }: { id: string }) {
  const { data: shift, loading, error } = useApiGet<ShiftResource>(`/api/shifts/${id}`);

  if (loading) return <PageLoading label="Memuat data shift..." />;
  if (error || !shift) return <PageError message={error ?? "Shift tidak ditemukan."} />;

  return <ShiftForm shift={shift} />;
}
