"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { CostCenterResource } from "@/types/api/cost-center";

import { CostCenterForm } from "./CostCenterForm";

/** Halaman edit cost center: ambil dulu datanya, lalu tampilkan form yang sudah terisi. */
export function CostCenterEditPage({ id }: { id: string }) {
  const { data: costCenter, loading, error } = useApiGet<CostCenterResource>(`/api/cost-centers/${id}`);

  if (loading) return <PageLoading label="Memuat data cost center..." />;
  if (error || !costCenter) return <PageError message={error ?? "Cost center tidak ditemukan."} />;

  return <CostCenterForm costCenter={costCenter} />;
}
