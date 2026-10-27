"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { HolidayResource } from "@/types/api/holiday";

import { HariLiburForm } from "./HariLiburForm";

/** Halaman edit hari libur: ambil dulu datanya, lalu tampilkan form yang sudah terisi. */
export function HariLiburEditPage({ id }: { id: string }) {
  const { data: holiday, loading, error } = useApiGet<HolidayResource>(`/api/holidays/${id}`);

  if (loading) return <PageLoading label="Memuat data hari libur..." />;
  if (error || !holiday) return <PageError message={error ?? "Hari libur tidak ditemukan."} />;

  return <HariLiburForm holiday={holiday} />;
}
