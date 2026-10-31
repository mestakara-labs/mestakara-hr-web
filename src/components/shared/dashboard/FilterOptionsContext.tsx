"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useApiGet } from "@/hooks/useApiGet";
import type { FilterOptionsResource } from "@/types/api/dashboard";

const FilterOptionsContext = createContext<FilterOptionsResource | null>(null);

/**
 * Pilihan filter grafik (sub unit, bidang, segmen, ...) diambil SEKALI untuk satu halaman
 * (GET /api/dashboard/filter-options), lalu dipakai semua dialog filter di dalamnya.
 *
 *   <FilterOptionsProvider> ...halaman dashboard / analitik... </FilterOptionsProvider>
 */
export function FilterOptionsProvider({ children }: { children: ReactNode }) {
  const { data } = useApiGet<FilterOptionsResource>("/api/dashboard/filter-options");
  return <FilterOptionsContext.Provider value={data}>{children}</FilterOptionsContext.Provider>;
}

/** Pilihan filter; null selama belum termuat. */
export function useFilterOptions(): FilterOptionsResource | null {
  return useContext(FilterOptionsContext);
}
