"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@mestakara/ui/toggle-group";

import { heatColor } from "@/lib/chart-colors";
import { formatShare, formatValue } from "@/lib/dashboard-format";
import type { MatrixData } from "@/types/api/dashboard";

/**
 * MATRIKS BERWARNA baris × kolom + Total, mis. Bidang × Status Karyawan:
 *
 *   Tampilkan: [Jumlah] [Persen]
 *              Tetap  PKWT  Casual  DW   Total
 *   Operasional  ▓12    ▒4    ███120  ░8   144
 *   ...
 *   Total         ...                      364
 *
 * Makin besar nilainya, makin pekat warnanya. "Persen" = porsi dari total keseluruhan.
 */
export function HeatMatrixTable({ data }: { data: MatrixData }) {
  const [mode, setMode] = useState<"value" | "share">("value");
  const largest = Math.max(...data.values.flat(), 1);
  const show = (value: number) => (mode === "share" ? formatShare(value, data.total) : formatValue(value, data.unit));

  if (data.rows.length === 0) return <p className="typo-body-s text-fg-tertiary">Belum ada data.</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 typo-body-s text-fg-secondary">
        Tampilkan
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={mode}
          onValueChange={(value) => value && setMode(value as "value" | "share")}
        >
          <ToggleGroupItem value="value">Jumlah</ToggleGroupItem>
          <ToggleGroupItem value="share">Persen</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              {data.columns.map((column) => (
                <TableHead key={column.key} className="text-right whitespace-nowrap">
                  {column.label}
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, rowIndex) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium whitespace-nowrap text-fg-heading">{row.label}</TableCell>
                {data.columns.map((column, columnIndex) => {
                  const value = data.values[rowIndex]?.[columnIndex] ?? 0;
                  return (
                    <TableCell
                      key={column.key}
                      className="text-right whitespace-nowrap"
                      style={{ backgroundColor: heatColor(value / largest) }}
                    >
                      {show(value)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-medium whitespace-nowrap">{show(data.row_totals[rowIndex] ?? 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              {data.column_totals.map((total, index) => (
                <TableCell key={data.columns[index]?.key ?? index} className="text-right font-medium whitespace-nowrap">
                  {show(total)}
                </TableCell>
              ))}
              <TableCell className="text-right font-medium whitespace-nowrap">{show(data.total)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
