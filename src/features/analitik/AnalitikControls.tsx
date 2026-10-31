"use client";

import { useState, type ReactNode } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import { Badge } from "@mestakara/ui/badge";
import { Button } from "@mestakara/ui/button";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "@mestakara/ui/toggle-group";

import { useFilterOptions } from "@/components/shared/dashboard/FilterOptionsContext";
import { PeriodRangePicker } from "@/components/shared/dashboard/PeriodRangePicker";
import { WidgetFilterDialog } from "@/components/shared/dashboard/WidgetFilterDialog";
import {
  ANALYTICS_DIMENSIONS,
  ANALYTICS_TOPICS,
  LIMIT_OPTIONS,
  SORT_OPTIONS,
  defaultMetric,
  type AnalyticsTopic,
} from "@/lib/analytics-rules";
import { ALL_DIMENSIONS, describeFilters, dimensionLabel, type WidgetFilters } from "@/lib/dashboard-filters";
import type { FilterDimension } from "@/types/api/dashboard";

import { defaultAnalyticsState, type AnalyticsState } from "./analytics-state";

interface AnalitikControlsProps {
  value: AnalyticsState;
  onChange: (state: AnalyticsState) => void;
}

/**
 * TOMBOL-TOMBOL ANALITIK (mengatur apa yang tampil di grafik & tabel):
 *
 *   Topik      [Karyawan] [Upah Casual & DW]
 *   Metrik     [Upah Diterima] [Gaji Upah] [Lembur] ...
 *   Periode    [📅 Jan – Okt 2026]
 *   Lihat per  [Sub Unit] [Bidang] [Segmen] ... [Bulan]
 *   Pisah per  [Tidak dipisah ▾]
 *   Filter     [Sub Unit: Malabar ✕] [Segmen: Wahana ✕] [+ Filter]
 *   Tampilan   [Jumlah] [Persen]   Grafik [Batang] [Garis] [Donat]   Urutkan [▾]  [Semua ▾]      [↺ Reset Semua]
 */
export function AnalitikControls({ value, onChange }: AnalitikControlsProps) {
  const options = useFilterOptions();
  const [isFiltering, setIsFiltering] = useState(false);
  const topic = ANALYTICS_TOPICS.find((item) => item.value === value.topic) ?? ANALYTICS_TOPICS[0];

  /** Ubah sebagian pilihan. */
  function change(patch: Partial<AnalyticsState>) {
    onChange({ ...value, ...patch });
  }

  /** Hapus filter satu dimensi. */
  function removeFilter(dimension: FilterDimension) {
    const filters: WidgetFilters = { ...value.filters };
    delete filters[dimension];
    change({ filters });
  }

  const activeFilters = ALL_DIMENSIONS.filter((dimension) => (value.filters[dimension]?.length ?? 0) > 0);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <ControlRow label="Topik">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={value.topic}
          onValueChange={(next) => next && change({ topic: next as AnalyticsTopic, metric: defaultMetric(next as AnalyticsTopic) })}
          className="flex-wrap"
        >
          {ANALYTICS_TOPICS.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ControlRow>

      <ControlRow label="Metrik">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={value.metric}
          onValueChange={(next) => next && change({ metric: next })}
          className="flex-wrap"
        >
          {topic.metrics.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ControlRow>

      <ControlRow label="Periode">
        <PeriodRangePicker value={value.range} onChange={(range) => change({ range })} />
        <span className="typo-body-s text-fg-tertiary">
          {value.topic === "workforce" ? "Jumlah karyawan = posisi akhir periode." : "Upah dijumlah sepanjang periode."}
        </span>
      </ControlRow>

      <ControlRow label="Lihat per">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={value.groupBy}
          onValueChange={(next) => next && change({ groupBy: next, splitBy: value.splitBy === next ? "" : value.splitBy })}
          className="flex-wrap justify-start"
        >
          {ANALYTICS_DIMENSIONS.map((dimension) => (
            <ToggleGroupItem key={dimension.value} value={dimension.value}>
              {dimension.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ControlRow>

      <ControlRow label="Pisah per">
        <NativeSelect
          aria-label="Pisah per"
          size="sm"
          value={value.splitBy}
          onChange={(event) => change({ splitBy: event.target.value, chart: value.chart === "donut" ? "bar" : value.chart })}
        >
          <NativeSelectOption value="">Tidak dipisah</NativeSelectOption>
          {ANALYTICS_DIMENSIONS.filter((dimension) => dimension.value !== value.groupBy).map((dimension) => (
            <NativeSelectOption key={dimension.value} value={dimension.value}>
              {dimension.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <span className="typo-body-s text-fg-tertiary">Dimensi kedua: grafik bertumpuk + tabel matriks.</span>
      </ControlRow>

      <ControlRow label="Filter">
        {activeFilters.map((dimension) => (
          <Badge key={dimension} variant="neutral" dot={false} className="gap-1">
            {describeFilters({ [dimension]: value.filters[dimension] }, options)}
            <button type="button" aria-label={`Hapus filter ${dimensionLabel(dimension)}`} onClick={() => removeFilter(dimension)}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsFiltering(true)}>
          <Plus />
          Filter
        </Button>
        <span className="typo-body-s text-fg-tertiary">Klik batang / baris untuk menelusuri lebih dalam.</span>
      </ControlRow>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <ControlRow label="Tampilan">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={value.mode}
            onValueChange={(next) => next && change({ mode: next as AnalyticsState["mode"] })}
          >
            <ToggleGroupItem value="value">Jumlah</ToggleGroupItem>
            <ToggleGroupItem value="share">Persen</ToggleGroupItem>
          </ToggleGroup>
        </ControlRow>
        <ControlRow label="Grafik">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={value.chart}
            onValueChange={(next) => next && change({ chart: next as AnalyticsState["chart"] })}
          >
            <ToggleGroupItem value="bar">Batang</ToggleGroupItem>
            <ToggleGroupItem value="line">Garis</ToggleGroupItem>
            <ToggleGroupItem value="donut" disabled={Boolean(value.splitBy)}>
              Donat
            </ToggleGroupItem>
          </ToggleGroup>
        </ControlRow>
        <ControlRow label="Urutkan">
          <NativeSelect aria-label="Urutkan" size="sm" value={value.sort} onChange={(event) => change({ sort: event.target.value })}>
            {SORT_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Batasi" size="sm" value={value.limit} onChange={(event) => change({ limit: event.target.value })}>
            {LIMIT_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </ControlRow>
        <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => onChange(defaultAnalyticsState())}>
          <RotateCcw />
          Reset Semua
        </Button>
      </div>

      <WidgetFilterDialog
        open={isFiltering}
        title="Analitik SDM"
        dimensions={ALL_DIMENSIONS}
        value={value.filters}
        onChange={(filters) => change({ filters })}
        onClose={() => setIsFiltering(false)}
      />
    </div>
  );
}

/** Satu baris kontrol: label di kiri, tombol-tombol di kanan. */
function ControlRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <span className="w-20 shrink-0 typo-label-m text-fg-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
