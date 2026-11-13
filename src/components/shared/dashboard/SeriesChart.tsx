"use client";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@mestakara/ui/chart";

import { useElementWidth } from "@/hooks/useElementWidth";
import { seriesColor } from "@/lib/chart-colors";
import { formatCompact } from "@/lib/dashboard-format";
import type { SeriesData } from "@/types/api/dashboard";

import { calculateChartSize, shortenLabel, VALUE_AXIS_WIDTH, type SeriesChartLayout } from "./series-chart-layout";
import { SeriesLegend, SeriesTooltip } from "./SeriesChartParts";

interface SeriesChartProps {
  data: SeriesData;
  /**
   * "vertical"   = batang tegak (kategori di bawah), cocok untuk bulan
   * "horizontal" = batang mendatar (kategori di kiri), cocok untuk nama panjang / banyak
   * "auto"       = mendatar kalau semua seri berupa batang dan kategorinya lebih dari 8 atau namanya panjang
   */
  layout?: SeriesChartLayout;
  /** Klik batang -> kunci kategorinya (mis. untuk menelusuri lebih dalam di Analitik). Kosong = batang tidak bisa diklik. */
  onSelect?: (categoryKey: string) => void;
}

/** Huruf label sumbu (px) — kecil supaya muat di layar HP. */
const AXIS_TICK = { fontSize: 11 };

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
 * Supaya tetap rapi walaupun datanya banyak (lihat series-chart-layout.ts):
 *   - nama kategori yang panjang dipotong "…" (nama lengkap ada di tooltip);
 *   - grafik tegak yang kategorinya banyak bisa DIGESER ke samping, label bawahnya dimiringkan kalau padat;
 *   - legenda ada di bawah grafik dan bisa digulir sendiri kalau serinya banyak;
 *   - tooltip hanya menulis seri yang ada nilainya (maks. 10 baris) + Total.
 *
 * Warna seri dari lib/chart-colors.ts. Kunci seri dibuat "s0, s1, ..." supaya aman dipakai sebagai nama warna CSS.
 */
export function SeriesChart({ data, layout = "auto", onSelect }: SeriesChartProps) {
  // Lebar kartu, untuk menentukan label bawah perlu dimiringkan atau tidak.
  const [wrapperRef, wrapperWidth] = useElementWidth<HTMLDivElement>();

  if (data.categories.length === 0) return <p className="typo-body-s text-fg-tertiary">Belum ada data.</p>;

  const size = calculateChartSize(data, layout, wrapperWidth);
  const { horizontal } = size;

  // Satu baris per kategori: { label: "Jan", s0: 1000, s1: 250, ... }
  const rows = data.categories.map((category, index) => ({
    label: category.label,
    ...Object.fromEntries(data.series.map((item, seriesIndex) => [`s${seriesIndex}`, item.values[index] ?? 0])),
  }));
  const config: ChartConfig = Object.fromEntries(
    data.series.map((item, index) => [`s${index}`, { label: item.label, color: seriesColor(index) }]),
  );
  const seriesLabels = Object.fromEntries(data.series.map((item, index) => [`s${index}`, item.label]));

  const valueTick = (value: number) => formatCompact(value, data.unit);
  const categoryTick = (label: string) => shortenLabel(label, size.maxLabelChars);

  return (
    <div className="flex flex-col gap-3">
      {/* Grafik tegak yang lebih lebar dari kartu bisa digeser ke samping. */}
      <div ref={wrapperRef} className="overflow-x-auto">
        <ChartContainer config={config} className="aspect-auto w-full" style={{ height: size.height, minWidth: size.minWidth }}>
          <ComposedChart data={rows} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: 4, right: 16, top: 8 }}>
            <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
            <XAxis
              type={horizontal ? "number" : "category"}
              dataKey={horizontal ? undefined : "label"}
              tickFormatter={horizontal ? valueTick : categoryTick}
              domain={horizontal ? [0, withHeadroom] : undefined}
              allowDecimals={data.unit === "persen"}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              // Grafik tegak: semua label kategori ditulis (interval 0), miring kalau tidak muat.
              interval={horizontal ? undefined : 0}
              angle={size.rotateLabels ? -40 : 0}
              textAnchor={size.rotateLabels ? "end" : "middle"}
              height={horizontal ? undefined : size.categoryAxisSize}
            />
            <YAxis
              type={horizontal ? "category" : "number"}
              dataKey={horizontal ? "label" : undefined}
              tickFormatter={horizontal ? categoryTick : valueTick}
              domain={horizontal ? undefined : [0, withHeadroom]}
              allowDecimals={data.unit === "persen"}
              tick={AXIS_TICK}
              width={horizontal ? size.categoryAxisSize : VALUE_AXIS_WIDTH}
              // Grafik mendatar: semua nama kategori ditulis (tingginya sudah disesuaikan per baris).
              interval={horizontal ? 0 : undefined}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<SeriesTooltip seriesLabels={seriesLabels} unit={data.unit} />} />
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
      </div>

      {data.series.length > 1 && (
        <SeriesLegend
          items={data.series.map((item, index) => ({ key: item.key, label: item.label, color: seriesColor(index) }))}
        />
      )}
    </div>
  );
}
