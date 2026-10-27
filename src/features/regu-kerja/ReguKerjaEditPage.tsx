"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { WorkGroupResource } from "@/types/api/work-group";

import { ReguEditForm } from "./ReguEditForm";

/** Halaman edit regu kerja: ambil dulu data regunya, lalu tampilkan form Data Regu yang sudah terisi. */
export function ReguKerjaEditPage({ id }: { id: string }) {
  const { data: group, loading, error } = useApiGet<WorkGroupResource>(`/api/work-groups/${id}`);

  if (loading) return <PageLoading label="Memuat data regu kerja..." />;
  if (error || !group) return <PageError message={error ?? "Regu kerja tidak ditemukan."} />;

  return <ReguEditForm group={group} />;
}
