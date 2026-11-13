"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mestakara/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@mestakara/ui/tabs";

import { seriesColor } from "@/lib/chart-colors";
import type { EmployeeProfileResource } from "@/types/api/employee";

import { BREAKDOWN_GROUPS, calculateBreakdown, STATUS_COLUMNS, type BreakdownRow } from "./employee-breakdown";
import { toPercent } from "./employee-stats";

/**
 * Kartu "Sebaran Karyawan per Status Karyawan" (paling bawah, lebar penuh):
 *
 *   ┌ Sebaran Karyawan per Status Karyawan            ● Tetap ● PKWT ● Casual ● Daily Worker ┐
 *   │ [Sub Unit] [Bidang] [Objek Penempatan] [Kategori Objek] [Level BRM] [Jenis Kelamin] ... │
 *   │ Sub Unit        Tetap  PKWT  Casual  Daily Worker  Total       Proporsi                 │
 *   │ Kantor Induk       40    10       5             3  58 (28%)    ▓▓▓▓▓▓▓▒▒░·              │
 *   │ ...                                                                                     │
 *   │ Total             150    35      15            10  210 (100%)                           │
 *   └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * Hitungannya ada di employee-breakdown.ts. Tab mengikuti daftar BREAKDOWN_GROUPS.
 */
export function EmployeeBreakdownCard({ employees }: { employees: EmployeeProfileResource[] }) {
  const [groupValue, setGroupValue] = useState(BREAKDOWN_GROUPS[0].value);
  const group = BREAKDOWN_GROUPS.find((item) => item.value === groupValue) ?? BREAKDOWN_GROUPS[0];
  const { rows, totalRow } = calculateBreakdown(employees, group);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>Sebaran Karyawan per Status Karyawan</CardTitle>
          <CardDescription>Jumlah karyawan Aktif per status karyawan, dikelompokkan per {group.label}</CardDescription>
        </div>
        <StatusLegend />
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <Tabs value={groupValue} onValueChange={setGroupValue}>
          {/* Di layar kecil tab bisa digeser ke samping */}
          <TabsList variant="line" className="w-full justify-start overflow-x-auto">
            {BREAKDOWN_GROUPS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow>
                <TableHead>{group.label}</TableHead>
                {STATUS_COLUMNS.map((column) => (
                  <TableHead key={column.status} className="text-right">
                    {column.label}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-1/4">Proporsi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row) => (
                <BreakdownTableRow key={row.label} row={row} grandTotal={totalRow.total} />
              ))}
            </TableBody>

            <TableFooter>
              <BreakdownTableRow row={totalRow} grandTotal={totalRow.total} />
            </TableFooter>
          </Table>
        </div>

        <p className="text-xs text-fg-tertiary">
          Catatan: hanya karyawan Aktif pada Periode Data. Penempatan memakai jabatan utama (Definitif, atau Level BRM
          tertinggi) dan objek penempatan pertamanya.
        </p>
      </CardContent>
    </Card>
  );
}

/** Satu baris tabel: nama kelompok | jumlah per status | total (persen) | batang proporsi. */
function BreakdownTableRow({ row, grandTotal }: { row: BreakdownRow; grandTotal: number }) {
  return (
    <TableRow>
      <TableCell className="font-medium text-fg-heading">{row.label}</TableCell>

      {row.counts.map((count, index) => (
        // Angka 0 dibuat pudar supaya angka yang ada isinya lebih mudah terlihat.
        <TableCell key={STATUS_COLUMNS[index].status} className={`text-right tabular-nums ${count === 0 ? "text-fg-tertiary" : ""}`}>
          {count}
        </TableCell>
      ))}

      <TableCell className="text-right whitespace-nowrap tabular-nums">
        <span className="font-medium text-fg-heading">{row.total}</span>
        <span className="ml-1 text-fg-tertiary">({toPercent(row.total, grandTotal)})</span>
      </TableCell>

      <TableCell>
        <StackedBar counts={row.counts} total={row.total} />
      </TableCell>
    </TableRow>
  );
}

/**
 * Batang bertumpuk: setiap warna = satu status, panjangnya = bagian status itu di baris ini.
 *   ▓▓▓▓▓▓▓ (Tetap) ▒▒ (PKWT) ░ (Casual) · (Daily Worker)
 */
function StackedBar({ counts, total }: { counts: number[]; total: number }) {
  return (
    <div className="flex h-2.5 min-w-32 overflow-hidden rounded-full bg-subtle">
      {counts.map((count, index) => (
        <span
          key={STATUS_COLUMNS[index].status}
          className="h-full"
          style={{ width: `${total === 0 ? 0 : (count / total) * 100}%`, backgroundColor: seriesColor(index) }}
          title={`${STATUS_COLUMNS[index].label}: ${count}`}
        />
      ))}
    </div>
  );
}

/** Keterangan warna batang: ● Tetap ● PKWT ● Casual ● Daily Worker */
function StatusLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {STATUS_COLUMNS.map((column, index) => (
        <li key={column.status} className="flex items-center gap-1.5 typo-body-s text-fg-secondary">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: seriesColor(index) }} />
          {column.label}
        </li>
      ))}
    </ul>
  );
}
