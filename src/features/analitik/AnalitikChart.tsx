"use client";

import { DistributionChart } from "@/components/shared/dashboard/DistributionChart";
import { SeriesChart } from "@/components/shared/dashboard/SeriesChart";
import { findMetric } from "@/lib/analytics-rules";
import type { AnalyticsView } from "@/types/api/analytics";
import type { SeriesData } from "@/types/api/dashboard";

import type { AnalyticsState } from "./analytics-state";

interface AnalitikChartProps {
  result: AnalyticsView;
  state: AnalyticsState;
  /** Klik batang -> telusuri kelompok itu */
  onSelect: (key: string) => void;
}

/**
 * SATU GRAFIK ANALITIK, menurut pilihan:
 *   tanpa "Pisah per": Batang / Garis / Donat, satu seri = metrik terpilih
 *   dengan "Pisah per": Batang bertumpuk / Garis, satu seri per nilai dimensi kedua
 * "Persen" = porsi dari total.
 */
export function AnalitikChart({ result, state, onSelect }: AnalitikChartProps) {
  const unit = state.mode === "share" ? "persen" : result.unit;
  const metricLabel = findMetric(state.topic, state.metric)?.label ?? state.metric;
  // Per bulan lebih enak dibaca tegak (bulan di bawah); selain itu otomatis.
  const layout = state.groupBy === "month" ? "vertical" : "auto";
  const percent = (value: number, total: number) => (total === 0 ? 0 : (value / total) * 100);

  if (result.matrix) {
    const matrix = result.matrix;
    const series: SeriesData = {
      categories: matrix.rows,
      unit,
      series: matrix.columns.map((column, columnIndex) => ({
        ...column,
        kind: state.chart === "line" ? "line" : "bar",
        stack: state.chart === "line" ? undefined : "pisah",
        values: matrix.rows.map((_, rowIndex) => {
          const value = matrix.values[rowIndex]?.[columnIndex] ?? 0;
          return state.mode === "share" ? percent(value, matrix.total) : value;
        }),
      })),
    };
    return <SeriesChart data={series} layout={layout} onSelect={onSelect} />;
  }

  const values = result.rows.map((row) => (state.mode === "share" ? row.share : row.value));

  if (state.chart === "donut") {
    return (
      <DistributionChart
        data={{
          items: result.rows.map((row, index) => ({ key: row.key, label: row.label, value: values[index] })),
          total: values.reduce((sum, value) => sum + value, 0),
          unit,
        }}
      />
    );
  }

  const series: SeriesData = {
    categories: result.rows,
    unit,
    series: [{ key: state.metric, label: metricLabel, kind: state.chart === "line" ? "line" : "bar", values }],
  };
  return <SeriesChart data={series} layout={layout} onSelect={onSelect} />;
}
