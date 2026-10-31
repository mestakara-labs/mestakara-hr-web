"use client";

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";
import { cn } from "cn";

import { HeatMatrixTable } from "@/components/shared/dashboard/HeatMatrixTable";
import { ANALYTICS_DIMENSIONS, analyticsDimensionLabel, findMetric } from "@/lib/analytics-rules";
import { formatValue } from "@/lib/dashboard-format";
import type { AnalyticsView } from "@/types/api/analytics";

import type { AnalyticsState } from "./analytics-state";

interface AnalitikTableProps {
  result: AnalyticsView;
  state: AnalyticsState;
  /** Klik baris -> telusuri kelompok itu */
  onSelect: (key: string) => void;
}

/**
 * TABEL ANALITIK:
 *   tanpa "Pisah per": No | <Lihat per> | <Metrik> | Porsi (batang + %)   + baris Total
 *   dengan "Pisah per": matriks berwarna (HeatMatrixTable)
 * Urutan baris mengikuti pilihan "Urutkan" (diurutkan backend).
 */
export function AnalitikTable({ result, state, onSelect }: AnalitikTableProps) {
  if (result.matrix) return <HeatMatrixTable data={result.matrix} />;

  const metricLabel = findMetric(state.topic, state.metric)?.label ?? state.metric;
  const canDrill = Boolean(ANALYTICS_DIMENSIONS.find((dimension) => dimension.value === state.groupBy)?.filter);

  if (result.rows.length === 0) return <p className="typo-body-s text-fg-tertiary">Tidak ada data untuk pilihan ini.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">No</TableHead>
            <TableHead>{analyticsDimensionLabel(state.groupBy)}</TableHead>
            <TableHead className="text-right">{metricLabel}</TableHead>
            <TableHead className="w-56">Porsi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.rows.map((row, index) => (
            <TableRow
              key={row.key}
              onClick={canDrill ? () => onSelect(row.key) : undefined}
              className={cn(canDrill && "cursor-pointer")}
            >
              <TableCell className="text-fg-tertiary">{index + 1}</TableCell>
              <TableCell className="font-medium whitespace-normal text-fg-heading">{row.label}</TableCell>
              <TableCell className="text-right whitespace-nowrap">{formatValue(row.value, result.unit)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-chart-1" style={{ width: `${Math.min(row.share, 100)}%` }} />
                  </div>
                  <span className="w-12 text-right typo-body-s text-fg-secondary">
                    {row.share.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell />
            <TableCell className="font-medium">Total</TableCell>
            <TableCell className="text-right font-medium whitespace-nowrap">{formatValue(result.summary.total, result.unit)}</TableCell>
            <TableCell className="typo-body-s text-fg-secondary">
              {state.limit ? `Top ${state.limit} dari total semua kelompok` : "100%"}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
