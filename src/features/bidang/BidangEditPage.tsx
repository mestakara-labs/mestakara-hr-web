"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { DivisionResource } from "@/types/api/division";

import { BidangForm } from "./BidangForm";

/** Halaman edit bidang: ambil dulu data bidangnya, lalu tampilkan form yang sudah terisi. */
export function BidangEditPage({ id }: { id: string }) {
  const { data: division, loading, error } = useApiGet<DivisionResource>(`/api/divisions/${id}`);

  if (loading) return <PageLoading label="Memuat data bidang..." />;
  if (error || !division) return <PageError message={error ?? "Bidang tidak ditemukan."} />;

  return <BidangForm division={division} />;
}
