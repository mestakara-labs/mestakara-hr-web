import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { formatValue } from "@/lib/dashboard-format";
import type { TableData } from "@/types/api/dashboard";

/**
 * Tabel kecil di kartu dashboard, mis. 10 cost center terbesar.
 * Kolom bersatuan ditulis rata kanan sesuai satuannya; kolom pertama jadi tautan kalau baris punya `href`.
 */
export function MiniTable({ data }: { data: TableData }) {
  if (data.rows.length === 0) return <p className="typo-body-s text-fg-tertiary">Belum ada data.</p>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {data.columns.map((column) => (
              <TableHead key={column.key} className={column.unit ? "text-right" : undefined}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row) => (
            <TableRow key={row.key}>
              {data.columns.map((column, index) => {
                const value = row[column.key];
                const text = typeof value === "number" && column.unit ? formatValue(value, column.unit) : (value ?? "-");

                return (
                  <TableCell key={column.key} className={column.unit ? "text-right whitespace-nowrap" : "whitespace-normal"}>
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
