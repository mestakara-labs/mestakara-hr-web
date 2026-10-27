"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { OvertimeSettingResource } from "@/types/api/overtime-setting";

import { PengaturanLemburForm } from "./PengaturanLemburForm";

/** Halaman Pengaturan Lembur: ambil dulu pengaturannya, lalu tampilkan form yang sudah terisi. */
export function PengaturanLemburPage() {
  const { data: setting, loading, error, reload } = useApiGet<OvertimeSettingResource>("/api/overtime-settings");

  if (loading) return <PageLoading label="Memuat pengaturan lembur..." />;
  if (error || !setting) return <PageError message={error ?? "Pengaturan lembur gagal dimuat."} />;

  // `key`: setelah disimpan & dimuat ulang, form diisi ulang dari data server yang baru.
  return <PengaturanLemburForm key={setting.updated_at ?? "bawaan"} setting={setting} onSaved={reload} />;
}
