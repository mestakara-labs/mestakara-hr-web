"use client";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@mestakara/ui/chart";

import { seriesColor } from "@/lib/chart-colors";
import { formatCompact, formatValue } from "@/lib/dashboard-format";
import type { SeriesData } from "@/types/api/dashboard";

interface SeriesChartProps {
  data: SeriesData;
  /**
   * "vertical"   = batang tegak (kategori di bawah), cocok untuk bulan
   * "horizontal" = batang mendatar (kategori di kiri), cocok untuk nama panjang / banyak
   * "auto"       = mendatar kalau semua seri berupa batang dan kategorinya lebih dari 8 atau namanya panjang
   */
  layout?: "auto" | "vertical" | "horizontal";
  /** Klik batang -> kunci kategorinya (mis. untuk menelusuri lebih dalam di Analitik). Kosong = batang tidak bisa diklik. */
  onSelect?: (categoryKey: string) => void;
}

/** Huruf label sumbu (px) — kecil supaya muat di layar HP. */
const AXIS_TICK = { fontSize: 11 };

/** Nama kategori yang lebih panjang dari ini membuat grafik "auto" mendatar (supaya namanya terbaca utuh). */
const LONG_LABEL = 14;

/**
 * Ujung sumbu angka: sedikit di atas nilai terbesar, dibulatkan ke angka "cantik" supaya batang tidak menempel
 * di tepi dan label sumbunya rapi. 280 -> 300, 13.195.000 -> 15.000.000, 0 -> 1.
 */
function withHeadroom(dataMax: number): number {
  const target = dataMax * 1.05;
  if (target <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(target));
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((item) => item * power >= target) ?? 10;
  return step * power;
}

/**
 * GRAFIK KATEGORI × SERI: batang, batang bertumpuk (seri dengan `stack` sama), dan/atau garis.
 *
 *   Tren biaya:  bulan di bawah, batang bertumpuk gaji/lembur/tunjangan + garis diterima
 *   Per kelompok: nama kelompok di kiri, satu batang per kelompok
 *
 * Warna seri dari lib/chart-colors.ts. Kunci seri dibuat "s0, s1, ..." supaya aman dipakai sebagai nama warna CSS.
 */
export function SeriesChart({ data, layout = "auto", onSelect }: SeriesChartProps) {
  const hasLongLabel = data.categories.some((category) => category.label.length > LONG_LABEL);
  const horizontal =
    layout === "horizontal" ||
    (layout === "auto" && data.series.every((item) => item.kind === "bar") && (data.categories.length > 8 || hasLongLabel));

  // Satu baris per kategori: { label: "Jan", s0: 1000, s1: 250, ... }
  const rows = data.categories.map((category, index) => ({
    label: category.label,
    ...Object.fromEntries(data.series.map((item, seriesIndex) => [`s${seriesIndex}`, item.values[index] ?? 0])),
  }));
  const config: ChartConfig = Object.fromEntries(
    data.series.map((item, index) => [`s${index}`, { label: item.label, color: seriesColor(index) }]),
  );
  const height = horizontal ? Math.max(240, data.categories.length * 32 + 48) : 300;
  const tick = (value: number) => formatCompact(value, data.unit);

  if (data.categories.length === 0) return <p className="typo-body-s text-fg-tertiary">Belum ada data.</p>;

  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <ComposedChart data={rows} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: 4, right: 16, top: 8 }}>
        <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
        <XAxis
          type={horizontal ? "number" : "category"}
          dataKey={horizontal ? undefined : "label"}
          tickFormatter={horizontal ? tick : undefined}
          domain={horizontal ? [0, withHeadroom] : undefined}
          allowDecimals={data.unit === "persen"}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type={horizontal ? "category" : "number"}
          dataKey={horizontal ? "label" : undefined}
          tickFormatter={horizontal ? undefined : tick}
          domain={horizontal ? undefined : [0, withHeadroom]}
          allowDecimals={data.unit === "persen"}
          tick={AXIS_TICK}
          width={horizontal ? 120 : 72}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-fg-secondary">
                    <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                    {config[String(name)]?.label}
                  </span>
                  <span className="font-medium text-fg-primary">{formatValue(Number(value), data.unit)}</span>
                </div>
              )}
            />
          }
        />
        {data.series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {data.series.map((item, index) =>
          item.kind === "line" ? (
            <Line key={item.key} type="monotoneX" dataKey={`s${index}`} stroke={`var(--color-s${index})`} strokeWidth={2} dot={false} />
          ) : (
            <Bar
              key={item.key}
              dataKey={`s${index}`}
              stackId={item.stack}
              fill={`var(--color-s${index})`}
              radius={item.stack ? 0 : 4}
              className={onSelect ? "cursor-pointer" : undefined}
              onClick={onSelect ? (_, categoryIndex) => onSelect(data.categories[categoryIndex]?.key ?? "") : undefined}
            />
          ),
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
