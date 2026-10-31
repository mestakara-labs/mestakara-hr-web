"use client";

import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@mestakara/ui/chart";

import { StatBarList } from "@/components/shared/StatBarList";
import { seriesColor } from "@/lib/chart-colors";
import { formatShare, formatValue } from "@/lib/dashboard-format";
import type { DistributionData } from "@/types/api/dashboard";

/**
 * PORSI PER KATEGORI:
 *   "donut" -> donat + daftar (nama, jumlah, %) di sampingnya     cocok untuk ≤ 6 kategori (gender, status)
 *   "bar"   -> daftar batang (StatBarList)                         cocok untuk banyak kategori (pendidikan, BRM)
 */
export function DistributionChart({ data, variant = "donut" }: { data: DistributionData; variant?: "donut" | "bar" }) {
  if (data.items.length === 0 || data.total === 0) return <p className="typo-body-s text-fg-tertiary">Belum ada data.</p>;

  if (variant === "bar") {
    return (
      <StatBarList
        items={data.items.map((item, index) => ({ label: item.label, count: item.value, color: seriesColor(index) }))}
        showPercentage
      />
    );
  }

  const config: ChartConfig = Object.fromEntries(
    data.items.map((item, index) => [`d${index}`, { label: item.label, color: seriesColor(index) }]),
  );
  const rows = data.items.map((item, index) => ({ name: `d${index}`, value: item.value, fill: seriesColor(index) }));

  return (
    // Bertumpuk (donat di atas, daftar di bawah) kalau KARTUNYA sempit; berdampingan kalau kartunya lebar (≥ 28rem).
    <div className="@container">
      <div className="flex flex-col items-center gap-4 @md:flex-row">
        <ChartContainer config={config} className="aspect-square w-36 shrink-0">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <span>
                      {config[String(name)]?.label}: <b>{formatValue(Number(value), data.unit)}</b>
                    </span>
                  )}
                />
              }
            />
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="95%" strokeWidth={2}>
              {rows.map((row) => (
                <Cell key={row.name} fill={row.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Satu grid 4 kolom (titik | nama | jumlah | %): nama dipotong "..." kalau sempit, angka tidak pernah keluar kartu. */}
        <ul className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-1.5 typo-body-s">
          {data.items.map((item, index) => (
            <li key={item.key} className="contents">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: seriesColor(index) }} />
              <span className="truncate text-fg-primary" title={item.label}>
                {item.label}
              </span>
              <span className="text-right font-medium whitespace-nowrap text-fg-heading">{formatValue(item.value, data.unit)}</span>
              <span className="text-right whitespace-nowrap text-fg-tertiary">{formatShare(item.value, data.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
