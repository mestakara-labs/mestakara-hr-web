"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { PayrollGroupResource } from "@/types/api/payroll-group";

import { KelompokUpahForm } from "./KelompokUpahForm";

/** Halaman edit Kelompok Daftar Upah: ambil dulu datanya, lalu tampilkan form yang sudah terisi. */
export function KelompokUpahEditPage({ id }: { id: string }) {
  const { data: group, loading, error } = useApiGet<PayrollGroupResource>(`/api/payroll-groups/${id}`);

  if (loading) return <PageLoading label="Memuat data kelompok..." />;
  if (error || !group) return <PageError message={error ?? "Kelompok tidak ditemukan."} />;

  return <KelompokUpahForm group={group} />;
}
