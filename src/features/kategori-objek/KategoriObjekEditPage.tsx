"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { PlacementCategoryResource } from "@/types/api/placement-category";

import { KategoriObjekForm } from "./KategoriObjekForm";

/** Halaman edit kategori objek: ambil dulu data kategori objeknya, lalu tampilkan form yang sudah terisi. */
export function KategoriObjekEditPage({ id }: { id: string }) {
  const { data: category, loading, error } = useApiGet<PlacementCategoryResource>(`/api/placement-categories/${id}`);

  if (loading) return <PageLoading label="Memuat data kategori objek..." />;
  if (error || !category) return <PageError message={error ?? "Kategori tidak ditemukan."} />;

  return <KategoriObjekForm category={category} />;
}
