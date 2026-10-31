import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { formatCell } from "@/lib/dashboard-format";
import type { TableData } from "@/types/api/dashboard";

import { COMPACT_TABLE } from "./table-style";

/**
 * Tabel kecil di kartu dashboard, mis. 10 cost center terbesar.
 * Kolom bersatuan ditulis rata kanan (satuan orang / jam / hari cukup di judul kolom); kolom teks boleh terlipat.
 * Kolom pertama jadi tautan kalau baris punya `href`.
 */
export function MiniTable({ data }: { data: TableData }) {
  if (data.rows.length === 0) return <p className="typo-body-s text-fg-tertiary">Belum ada data.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className={COMPACT_TABLE}>
        <TableHeader>
          <TableRow>
            {data.columns.map((column) => (
              <TableHead key={column.key} className={column.unit ? "text-right" : undefined}>
                {column.label}
                {(column.unit === "orang" || column.unit === "jam" || column.unit === "hari") && ` (${column.unit})`}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row) => (
            <TableRow key={row.key}>
              {data.columns.map((column, index) => {
                const value = row[column.key];
                const text = typeof value === "number" && column.unit ? formatCell(value, column.unit) : (value ?? "-");

                return (
                  <TableCell key={column.key} className={column.unit ? "text-right" : "min-w-28 whitespace-normal"}>
                    {index === 0 && row.href ? (
                      <Link href={row.href} className="font-medium text-fg-heading hover:underline">
                        {text}
                      </Link>
                    ) : (
                      text
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
