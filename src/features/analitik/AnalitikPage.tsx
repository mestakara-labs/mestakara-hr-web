"use client";

import { useState } from "react";
import { FileSpreadsheet, Hash, LayoutList, Scale, Sigma } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mestakara/ui/card";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";
import { cn } from "cn";

import { FilterOptionsProvider, useFilterOptions } from "@/components/shared/dashboard/FilterOptionsContext";
import { NumberCard } from "@/components/shared/NumberCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { ANALYTICS_TOPICS, analyticsDimensionLabel, findMetric, toAnalyticsView } from "@/lib/analytics-rules";
import { describeFilters } from "@/lib/dashboard-filters";
import { formatValue } from "@/lib/dashboard-format";
import { ApiError, apiDownload } from "@/lib/http-client";
import { rangeLabel } from "@/lib/period-range";
import type { AnalyticsResource } from "@/types/api/analytics";

import { AnalitikChart } from "./AnalitikChart";
import { AnalitikControls } from "./AnalitikControls";
import { AnalitikTable } from "./AnalitikTable";
import { defaultAnalyticsState, drillDown, toAnalyticsQuery, type AnalyticsState } from "./analytics-state";

/** Halaman ANALITIK SDM. Pilihan filter grafik diambil sekali untuk seluruh halaman. */
export function AnalitikPage() {
  return (
    <FilterOptionsProvider>
      <AnalitikContent />
    </FilterOptionsProvider>
  );
}

/**
 *   Analitik SDM                                                            [▦ Ekspor Excel]
 *   [Tombol-tombol: Topik · Metrik · Periode · Lihat per · Pisah per · Filter · Tampilan ...]
 *   [Total][Jumlah Kelompok][Rata-rata per Kelompok][Periode Sebelumnya]
 *   [<Metrik> per <Dimensi> — satu grafik]
 *   [Tabel / matriks + porsi % + Total]
 *
 * Setiap tombol diubah -> GET /api/analytics diambil ulang (data lama tetap tampil, agak pudar, selama memuat).
 * Klik batang / baris -> telusuri: kelompok itu jadi filter, "Lihat per" pindah ke dimensi berikutnya.
 */
function AnalitikContent() {
  const options = useFilterOptions();
  const [state, setState] = useState<AnalyticsState>(() => defaultAnalyticsState());
  const [exporting, setExporting] = useState(false);

  const query = toAnalyticsQuery(state);
  const { data, loading, refreshing, error } = useApiGet<AnalyticsResource>(`/api/analytics?${query}`);
  const result = data ? toAnalyticsView(data) : null;

  const topic = ANALYTICS_TOPICS.find((item) => item.value === state.topic);
  const metric = findMetric(state.topic, state.metric);
  const filterText = describeFilters(state.filters, options);
  const title = `${metric?.label ?? state.metric} per ${analyticsDimensionLabel(state.groupBy)}${
    state.splitBy ? `, dipisah per ${analyticsDimensionLabel(state.splitBy)}` : ""
  }`;

  async function exportExcel() {
    setExporting(true);
    try {
      const fileName = await apiDownload(
        `/api/analytics/export?${query}`,
        `Analitik SDM - ${topic?.label} per ${analyticsDimensionLabel(state.groupBy)} - ${rangeLabel(state.range)}.xlsx`,
      );
      toast.success("Analitik berhasil diekspor", { description: fileName });
    } catch (exportError) {
      const message = exportError instanceof ApiError ? exportError.message : "Terjadi kesalahan. Silakan coba lagi.";
      toast.error("Analitik gagal diekspor", { description: message });
    } finally {
      setExporting(false);
    }
  }

  const select = (key: string) => setState((current) => drillDown(current, key));

  return (
    <>
      <PageHeader
        title="Analitik SDM"
        description="Atur sendiri data yang ditampilkan: pilih topik, metrik, periode, dan cara mengelompokkannya."
        action={
          <Button variant="outline" onClick={exportExcel} disabled={exporting || !result}>
            {exporting ? <Spinner /> : <FileSpreadsheet />}
            {exporting ? "Mengekspor..." : "Ekspor Excel"}
          </Button>
        }
      />

      <AnalitikControls value={state} onChange={setState} />

      {loading && <PageLoading label="Menghitung analitik..." />}
      {error && <PageError message={error} />}

      {result && (
        <div className={cn("flex flex-col gap-4 transition-opacity", refreshing && "opacity-60")}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <NumberCard
              title={`Total ${metric?.label ?? ""}`}
              icon={Sigma}
              value={formatValue(result.summary.total, result.unit)}
              textValue
              note={rangeLabel(state.range)}
            />
            <NumberCard
              title="Jumlah Kelompok"
              icon={LayoutList}
              value={result.summary.count.toLocaleString("id-ID")}
              note={`per ${analyticsDimensionLabel(state.groupBy)}, sesuai filter`}
            />
            <NumberCard
              title="Rata-rata per Kelompok"
              icon={Scale}
              value={formatValue(result.summary.average, result.unit)}
              textValue
              note="total ÷ jumlah kelompok"
            />
            <NumberCard
              title="Periode Sebelumnya"
              icon={Hash}
              value={result.summary.previous === null ? "-" : formatValue(result.summary.previous, result.unit)}
              textValue
              note={describeChange(result.summary.total, result.summary.previous)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {rangeLabel(state.range)}
                {filterText && ` · ${filterText}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalitikChart result={result} state={state} onSelect={select} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <AnalitikTable result={result} state={state} onSelect={select} />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

/**
 * Kalimat perbandingan dengan periode sebelumnya:
 *   (597, 458) -> "▲ 30,3% dibanding periode sebelumnya"
 *   (400, 500) -> "▼ 20% dibanding periode sebelumnya"
 *   tanpa pembanding / pembanding 0 -> keterangan umum
 */
function describeChange(total: number, previous: number | null): string {
  if (!previous) return "rentang sebelumnya yang sama panjang";
  const change = ((total - previous) / previous) * 100;
  if (change === 0) return "sama dengan periode sebelumnya";
  const arrow = change > 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(change).toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dibanding periode sebelumnya`;
}
