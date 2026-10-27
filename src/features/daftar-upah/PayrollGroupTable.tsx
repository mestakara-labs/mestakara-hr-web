"use client";

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";
import { cn } from "cn";

import { formatRupiah } from "@/lib/wage-rules";
import type { PayrollGroup, PayrollTotals } from "@/types/api/payroll";

interface PayrollGroupTableProps {
  groups: PayrollGroup[];
  /** Kelompok yang sedang dipilih (tabel rincian difilter ke kelompok ini); null = semua */
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

/** Kolom uang di rekap, urut seperti REKAP DPU. */
const MONEY_COLUMNS: { key: keyof PayrollTotals; label: string }[] = [
  { key: "base_pay", label: "Gaji Upah" },
  { key: "overtime_pay", label: "Lembur" },
  { key: "operational_allowance", label: "Ops & Jab" },
  { key: "incentive", label: "Insentif" },
  { key: "meal_allowance", label: "Uang Makan" },
  { key: "gross", label: "Jumlah" },
  { key: "deductions", label: "Potongan" },
  { key: "net", label: "Diterima" },
];

/**
 * REKAP PER KELOMPOK (seperti sheet REKAP DPU), satu baris per kelompok + baris JUMLAH:
 *
 *   Kelompok (+ Sub Unit/AFD) | Karyawan | HKE | Absen | Gaji Upah | Lembur | ... | Diterima
 *
 * Klik baris = tabel rincian di bawah hanya menampilkan kelompok itu; klik lagi = semua.
 */
export function PayrollGroupTable({ groups, selectedKey, onSelect }: PayrollGroupTableProps) {
  const sum = (key: keyof PayrollTotals) => groups.reduce((total, group) => total + group.totals[key], 0);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="min-w-400">
        <TableHeader>
          <TableRow>
            <TableHead>Kelompok</TableHead>
            <TableHead className="text-right">Karyawan</TableHead>
            <TableHead className="text-right">HKE</TableHead>
            <TableHead className="text-right">Absen</TableHead>
            {MONEY_COLUMNS.map(({ key, label }) => (
              <TableHead key={key} className="text-right">
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow
              key={group.key}
              onClick={() => onSelect(selectedKey === group.key ? null : group.key)}
              className={cn("cursor-pointer", selectedKey === group.key && "bg-brand-subtle")}
            >
              <TableCell className="min-w-56 whitespace-normal">
                <p className="font-medium text-fg-heading">{group.name}</p>
                <p className="typo-body-s text-fg-tertiary">
                  {group.sub_units.map((unit) => `${unit.name}${unit.afdeling_code ? ` (${unit.afdeling_code})` : ""}`).join(", ") || "-"}
                </p>
              </TableCell>
              <TableCell className="text-right">{group.employee_count}</TableCell>
              <TableCell className="text-right">{group.totals.hke}</TableCell>
              <TableCell className="text-right">{group.totals.present_days}</TableCell>
              {MONEY_COLUMNS.map(({ key }) => (
                <TableCell key={key} className={cn("text-right whitespace-nowrap", key === "net" && "font-medium text-fg-heading")}>
                  {formatRupiah(group.totals[key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-medium">JUMLAH</TableCell>
            <TableCell className="text-right">{groups.reduce((total, group) => total + group.employee_count, 0)}</TableCell>
            <TableCell className="text-right">{sum("hke")}</TableCell>
            <TableCell className="text-right">{sum("present_days")}</TableCell>
            {MONEY_COLUMNS.map(({ key }) => (
              <TableCell key={key} className="text-right font-medium whitespace-nowrap">
                {formatRupiah(sum(key))}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
