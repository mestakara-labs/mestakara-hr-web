"use client";

import { useState } from "react";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { heatColor } from "@/lib/chart-colors";
import { formatCell, formatShare, unitCaption } from "@/lib/dashboard-format";
import type { MatrixData } from "@/types/api/dashboard";

import { COMPACT_TABLE } from "./table-style";

/**
 * MATRIKS BERWARNA baris × kolom + Total, mis. Bidang × Status Karyawan:
 *
 *   Tampilkan [Jumlah ▾]                                   Satuan: orang
 *                Tetap  PKWT  Casual  DW   Total
 *   Operasional  ▓104   ▒42   ███173  ░0    319
 *   ...
 *   Total         160    73     359   5     597
 *
 * Makin besar nilainya, makin pekat warnanya. "Persen" = porsi dari total keseluruhan.
 *
 * LEBAR KOLOM: kolom nama = 1/4 tabel (min. 10rem, nama panjang turun baris); kolom angka minimal 5rem
 * dan berbagi sisa lebar, jadi di layar lebar angkanya tidak terdorong jauh dari namanya.
 */
export function HeatMatrixTable({ data }: { data: MatrixData }) {
  const [mode, setMode] = useState<"value" | "share">("value");
  const largest = Math.max(...data.values.flat(), 1);
  const show = (value: number) => (mode === "share" ? formatShare(value, data.total) : formatCell(value, data.unit));
  const caption = mode === "value" ? unitCaption(data.unit) : "Persen dari total keseluruhan";

  if (data.rows.length === 0) return <p className="typo-body-s text-fg-tertiary">Belum ada data.</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 typo-body-s text-fg-secondary">
        <label className="flex items-center gap-2">
          Tampilkan
          <NativeSelect size="sm" value={mode} onChange={(event) => setMode(event.target.value as "value" | "share")}>
            <NativeSelectOption value="value">Jumlah</NativeSelectOption>
            <NativeSelectOption value="share">Persen</NativeSelectOption>
          </NativeSelect>
        </label>
        {caption && <span className="text-fg-tertiary">{caption}</span>}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className={COMPACT_TABLE}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4 min-w-40" />
              {data.columns.map((column) => (
                <TableHead key={column.key} className="min-w-20 text-right whitespace-normal">
                  {column.label}
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, rowIndex) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium whitespace-normal text-fg-heading">{row.label}</TableCell>
                {data.columns.map((column, columnIndex) => {
                  const value = data.values[rowIndex]?.[columnIndex] ?? 0;
                  return (
                    <TableCell key={column.key} className="text-right" style={{ backgroundColor: heatColor(value / largest) }}>
                      {show(value)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-medium">{show(data.row_totals[rowIndex] ?? 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              {data.column_totals.map((total, index) => (
                <TableCell key={data.columns[index]?.key ?? index} className="text-right">
                  {show(total)}
                </TableCell>
              ))}
              <TableCell className="text-right">{show(data.total)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
