"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { WorkPatternResource } from "@/types/api/work-pattern";

import { PolaKerjaForm } from "./PolaKerjaForm";

/** Halaman edit pola kerja: ambil dulu data polanya, lalu tampilkan form yang sudah terisi. */
export function PolaKerjaEditPage({ id }: { id: string }) {
  const { data: pattern, loading, error } = useApiGet<WorkPatternResource>(`/api/work-patterns/${id}`);

  if (loading) return <PageLoading label="Memuat data pola kerja..." />;
  if (error || !pattern) return <PageError message={error ?? "Pola kerja tidak ditemukan."} />;

  return <PolaKerjaForm pattern={pattern} />;
}
