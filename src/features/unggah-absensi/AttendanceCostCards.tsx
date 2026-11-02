import Link from "next/link";
import { CalendarCheck, MapPinned, Users, Wallet } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@mestakara/ui/card";

import { NumberCard } from "@/components/shared/NumberCard";
import type { EmployeeCategoryConfig } from "@/lib/attendance-rules";
import { summarizeAttendanceCost, type SubUnitCost } from "@/lib/attendance-summary";
import { formatCompact } from "@/lib/dashboard-format";
import { formatRupiah } from "@/lib/wage-rules";
import type { AttendanceSummaryRow } from "@/types/api/attendance";
import type { PayrollRow } from "@/types/api/payroll";

interface AttendanceCostCardsProps {
  category: EmployeeCategoryConfig;
  /** Rekap daftar hadir kategori ini */
  rows: AttendanceSummaryRow[];
  /** Baris Daftar Upah kategori ini; null = masih dimuat / gagal */
  costRows: PayrollRow[] | null;
  costError: string | null;
}

/** Angka 1 desimal gaya Indonesia: 20.5 -> "20,5". */
const oneDecimal = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 1 });

/**
 * RINGKASAN BIAYA tab Daftar Hadir:
 *
 *   [Karyawan 322]  [Hari Kerja (K) 6.667]  [Upah Hari Kerja Rp 670.031.100]  [Upah per Sub Unit / Afdeling ]
 *    Harian · Flat   rata-rata 20,7 hari     rata-rata Rp 2.080.842/karyawan   [Gunung Mas (AFD03)  Rp 412 jt]
 *                                                                              [Kantor Induk        Rp 120 jt]
 *
 * Angka upah dari Daftar Upah (dihitung backend); jumlah daftar Upah per Sub Unit = kartu Upah Hari Kerja.
 */
export function AttendanceCostCards({ category, rows, costRows, costError }: AttendanceCostCardsProps) {
  const summary = summarizeAttendanceCost(rows, costRows ?? []);
  // Selama Daftar Upah belum dimuat, angka upah ditampilkan "…" (atau "-" kalau gagal).
  const costPending = costRows === null;
  const pendingText = costError ? "-" : "…";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <NumberCard
        title="Karyawan"
        icon={Users}
        value={summary.employees.toLocaleString("id-ID")}
        note={
          costPending ? (
            "aktif minimal sehari dalam periode"
          ) : (
            <>
              Harian {summary.dailyWage} · Flat Bulanan {summary.flatWage}
              {summary.withoutScheme > 0 && (
                <>
                  {" · "}
                  <Link href="/dashboard/upah/skema" className="text-fg-warning underline">
                    {summary.withoutScheme} belum punya skema upah
                  </Link>
                </>
              )}
            </>
          )
        }
      />
      <NumberCard
        title="Hari Kerja (K)"
        icon={CalendarCheck}
        value={summary.presentDays.toLocaleString("id-ID")}
        note={`rata-rata ${oneDecimal(summary.averagePresentDays)} hari/karyawan${
          category.hasDwOvertime && summary.overCapDays > 0 ? ` · ${summary.overCapDays} hari K di atas batas (tidak dibayar)` : ""
        }`}
      />
      <NumberCard
        title="Upah Hari Kerja"
        icon={Wallet}
        value={costPending ? pendingText : formatRupiah(summary.basePay)}
        textValue
        note={
          costError
            ? `Upah gagal dimuat: ${costError}`
            : costPending
              ? "Memuat upah dari Daftar Upah..."
              : `rata-rata ${formatRupiah(Math.round(summary.averageBasePay))}/karyawan · Harian = K × Rp/hari, Flat = prorata`
        }
      />
      <SubUnitCostCard items={costPending ? null : summary.bySubUnit} pendingText={pendingText} />
    </div>
  );
}

/**
 * Kartu daftar UPAH HARI KERJA PER SUB UNIT / AFDELING, dari yang terbesar, dengan batang porsi.
 * Daftar panjang bisa digulir di dalam kartu supaya tingginya sejajar dengan kartu lain.
 */
function SubUnitCostCard({ items, pendingText }: { items: SubUnitCost[] | null; pendingText: string }) {
  const total = (items ?? []).reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upah per Sub Unit / Afdeling</CardTitle>
        <CardAction>
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-subtle text-fg-brand">
            <MapPinned className="size-5" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items === null ? (
          <p className="typo-h3 text-fg-brand">{pendingText}</p>
        ) : items.length === 0 ? (
          <p className="typo-body-s text-fg-tertiary">Belum ada data.</p>
        ) : (
          <ul className="flex max-h-32 flex-col gap-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={item.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 typo-body-s">
                  <span className="min-w-0 truncate text-fg-primary" title={item.label}>
                    {item.label}
                  </span>
                  <span className="shrink-0 font-medium text-fg-heading" title={formatRupiah(item.amount)}>
                    {formatCompact(item.amount, "rupiah")}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-chart-1"
                    style={{ width: `${total === 0 ? 0 : (item.amount / total) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
