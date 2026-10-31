"use client";

import { useEffect, useState } from "react";

import { countActiveFilters, appendFilters, type WidgetFilters } from "@/lib/dashboard-filters";
import { ApiError, apiGet } from "@/lib/http-client";
import { defaultRange, isDefaultRange, rangeToParams, type PeriodRange } from "@/lib/period-range";
import type { DashboardWidget } from "@/types/api/dashboard";

/** Hasil pengambilan terakhir, beserta alamatnya (supaya ketahuan masih sesuai pilihan atau belum). */
interface Fetched {
  path: string;
  widget: DashboardWidget | null;
  error: string | null;
}

/**
 * PERIODE & FILTER SATU KARTU DASHBOARD. Setiap kartu berdiri sendiri:
 *
 *   const card = useDashboardWidget("payroll.trend", widgets["payroll.trend"]);
 *   card.widget      -> data yang ditampilkan
 *   card.setRange()  -> ganti periode kartu ini saja
 *   card.setFilters()-> ganti filter kartu ini saja
 *
 * Selama pilihan masih bawaan (awal tahun s.d. hari ini, tanpa filter), data diambil dari `initial`
 * (hasil GET /api/dashboard sekali untuk semua kartu). Begitu diubah, HANYA kartu ini yang diambil ulang
 * dari /api/dashboard/widgets/{key}. Data lama tetap tampil selama data baru dimuat.
 *
 * `defaultGroupBy`: untuk grafik yang punya pilihan "Lihat per" (mis. per Bidang / Sub Unit).
 */
export function useDashboardWidget(key: string, initial: DashboardWidget | undefined, defaultGroupBy?: string) {
  const [range, setRange] = useState<PeriodRange>(() => defaultRange());
  const [filters, setFilters] = useState<WidgetFilters>({});
  const [groupBy, setGroupBy] = useState(defaultGroupBy);
  const [fetched, setFetched] = useState<Fetched | null>(null);

  const isDefault = isDefaultRange(range) && countActiveFilters(filters) === 0 && groupBy === defaultGroupBy;

  // null = cukup pakai `initial`; selain itu alamat untuk mengambil kartu ini saja.
  let path: string | null = null;
  if (!isDefault || !initial) {
    const query = new URLSearchParams(rangeToParams(range));
    appendFilters(query, filters);
    if (groupBy) query.set("group_by", groupBy);
    path = `/api/dashboard/widgets/${encodeURIComponent(key)}?${query}`;
  }

  useEffect(() => {
    if (!path) return;
    // Kalau pilihan sudah berganti lagi sebelum hasilnya datang, hasil lama diabaikan.
    let isCancelled = false;

    apiGet<DashboardWidget>(path)
      .then((response) => {
        if (!isCancelled) setFetched({ path, widget: response.data, error: null });
      })
      .catch((error) => {
        const message = error instanceof ApiError ? error.message : "Data gagal dimuat.";
        if (!isCancelled) setFetched({ path, widget: null, error: message });
      });

    return () => {
      isCancelled = true;
    };
  }, [path]);

  const isLoaded = path === null || fetched?.path === path;

  // Data yang ditampilkan:
  //   pilihan bawaan          -> initial
  //   hasil pilihan ini ada   -> hasil itu
  //   masih memuat            -> data sebelumnya (hasil lama, atau initial)
  let widget: DashboardWidget | null;
  if (path === null) widget = initial ?? null;
  else if (isLoaded) widget = fetched?.widget ?? null;
  else widget = fetched?.widget ?? initial ?? null;

  /** Kembali ke bawaan: awal tahun s.d. hari ini, tanpa filter. */
  function reset() {
    setRange(defaultRange());
    setFilters({});
    setGroupBy(defaultGroupBy);
  }

  return {
    widget,
    loading: !isLoaded,
    error: isLoaded && path !== null ? (fetched?.error ?? null) : null,
    range,
    setRange,
    filters,
    setFilters,
    groupBy,
    setGroupBy,
    isDefault,
    reset,
  };
}
