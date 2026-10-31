"use client";

import { useState, type ReactNode } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mestakara/ui/card";
import { Spinner } from "@mestakara/ui/spinner";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import { cn } from "cn";

import { useDashboardWidget } from "@/hooks/useDashboardWidget";
import { countActiveFilters, describeFilters } from "@/lib/dashboard-filters";
import { isDefaultRange, rangeLabel } from "@/lib/period-range";
import type { DashboardWidget, FilterDimension } from "@/types/api/dashboard";

import { ActionList } from "./ActionList";
import { DistributionChart } from "./DistributionChart";
import { useFilterOptions } from "./FilterOptionsContext";
import { HeatMatrixTable } from "./HeatMatrixTable";
import { KpiTile } from "./KpiTile";
import { MiniTable } from "./MiniTable";
import { PeriodRangePicker } from "./PeriodRangePicker";
import { SeriesChart } from "./SeriesChart";
import { WidgetFilterDialog } from "./WidgetFilterDialog";

interface WidgetCardProps {
  /** Kunci widget di backend, mis. "payroll.trend" */
  widgetKey: string;
  /** Data bawaan dari GET /api/dashboard (undefined = diambil sendiri) */
  initial: DashboardWidget | undefined;
  title: string;
  description?: string;
  /** Dimensi filter grafik ini. Kosong = tanpa tombol filter (kartu angka / ringkasan). */
  filterDimensions?: FilterDimension[];
  /** Pilihan "Lihat per", mis. [{ value: "division", label: "Bidang" }]. Pilihan pertama = bawaan. */
  groupByOptions?: { value: string; label: string }[];
  /** Cara menampilkan isi; kosong = otomatis menurut jenis datanya */
  render?: (widget: DashboardWidget) => ReactNode;
  /** Kartu angka: naik itu baik (hijau) atau buruk (merah) */
  goodWhenUp?: boolean;
  className?: string;
}

/**
 * SATU KARTU DASHBOARD yang berdiri sendiri:
 *
 *   Biaya Upah per Kelompok          [Lihat per ▾] [📅 Jan – Okt 2026] [⚲ Filter (2)]
 *   Sub Unit: Malabar · Segmen: Wahana                                  [↺ Reset]
 *   (isi: angka / grafik / matriks / tabel / daftar — menurut jenis datanya)
 *
 * Periode, filter, dan "Lihat per" hanya mengubah kartu ini (lihat useDashboardWidget).
 */
export function WidgetCard({
  widgetKey,
  initial,
  title,
  description,
  filterDimensions = [],
  groupByOptions,
  render,
  goodWhenUp,
  className,
}: WidgetCardProps) {
  const card = useDashboardWidget(widgetKey, initial, groupByOptions?.[0]?.value);
  const options = useFilterOptions();
  const [isFiltering, setIsFiltering] = useState(false);
  const activeFilters = countActiveFilters(card.filters);

  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader className="gap-2">
        {/* Judul & tombol satu baris; di kartu sempit tombolnya turun ke bawah judul. */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="min-w-0 pt-1">{title}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {groupByOptions && (
              <NativeSelect
                aria-label="Lihat per"
                size="sm"
                value={card.groupBy}
                onChange={(event) => card.setGroupBy(event.target.value)}
              >
                {groupByOptions.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    Per {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
            <PeriodRangePicker value={card.range} onChange={card.setRange} />
            {filterDimensions.length > 0 && (
              <Button type="button" variant={activeFilters > 0 ? "tonal" : "outline"} size="sm" onClick={() => setIsFiltering(true)}>
                <Filter />
                Filter{activeFilters > 0 && ` (${activeFilters})`}
              </Button>
            )}
            {!card.isDefault && (
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Kembalikan ${title} ke bawaan`} onClick={card.reset}>
                <RotateCcw />
              </Button>
            )}
          </div>
        </div>
        {(description || activeFilters > 0) && (
          <CardDescription>
            {description}
            {activeFilters > 0 && <span className="block text-fg-brand">{describeFilters(card.filters, options)}</span>}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className={cn("relative transition-opacity", card.loading && card.widget && "opacity-60")}>
        {card.error && (
          <Alert variant="danger">
            <AlertDescription>{card.error}</AlertDescription>
          </Alert>
        )}
        {!card.error && !card.widget && (
          <div className="flex h-32 items-center justify-center text-fg-tertiary">
            {card.loading ? <Spinner /> : <span className="typo-body-s">Belum ada data.</span>}
          </div>
        )}
        {!card.error && card.widget && (render ? render(card.widget) : <WidgetBody widget={card.widget} goodWhenUp={goodWhenUp} />)}
        {!isDefaultRange(card.range) && (
          <p className="mt-3 typo-body-s text-fg-tertiary">Periode khusus: {rangeLabel(card.range)}</p>
        )}
      </CardContent>

      <WidgetFilterDialog
        open={isFiltering}
        title={title}
        dimensions={filterDimensions}
        value={card.filters}
        onChange={card.setFilters}
        onClose={() => setIsFiltering(false)}
      />
    </Card>
  );
}

/** Tampilan bawaan menurut jenis data widget. */
function WidgetBody({ widget, goodWhenUp }: { widget: DashboardWidget; goodWhenUp?: boolean }) {
  switch (widget.type) {
    case "kpi":
      return <KpiTile data={widget.data} goodWhenUp={goodWhenUp} />;
    case "series":
      return <SeriesChart data={widget.data} />;
    case "distribution":
      return <DistributionChart data={widget.data} />;
    case "matrix":
      return <HeatMatrixTable data={widget.data} />;
    case "table":
      return <MiniTable data={widget.data} />;
    case "list":
      return <ActionList data={widget.data} />;
  }
}
