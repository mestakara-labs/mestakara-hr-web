"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { SubUnitResource } from "@/types/api/sub-unit";

import { SubUnitForm } from "./SubUnitForm";

/** Halaman edit sub unit: ambil dulu data sub unitnya, lalu tampilkan form yang sudah terisi. */
export function SubUnitEditPage({ id }: { id: string }) {
  const { data: subUnit, loading, error } = useApiGet<SubUnitResource>(`/api/sub-units/${id}`);

  if (loading) return <PageLoading label="Memuat data sub unit..." />;
  if (error || !subUnit) return <PageError message={error ?? "Sub unit tidak ditemukan."} />;

  return <SubUnitForm subUnit={subUnit} />;
}
