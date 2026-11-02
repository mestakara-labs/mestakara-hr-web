import { Clock, Crown, Percent, Wallet } from "lucide-react";

import { NumberCard } from "@/components/shared/NumberCard";
import { minutesToHours } from "@/lib/attendance-rules";
import { summarizeRegularOvertimeCost } from "@/lib/attendance-summary";
import { formatRupiah } from "@/lib/wage-rules";
import type { OvertimeEntryRow } from "@/types/api/attendance";
import type { PayrollRow } from "@/types/api/payroll";

interface OvertimeCostCardsProps {
  /** Daftar Lembur Reguler kategori ini */
  entries: OvertimeEntryRow[];
  /** Baris Daftar Upah kategori ini; null = masih dimuat / gagal */
  costRows: PayrollRow[] | null;
  costError: string | null;
}

/**
 * RINGKASAN BIAYA tab Lembur Reguler:
 *
 *   [Total Jam Lembur 64,5 jam]  [Upah Lembur Reguler Rp 8.451.100]  [Porsi terhadap Upah 1,3%]  [Biaya Lembur Terbesar  ]
 *    18 karyawan · 37 baris       rata-rata Rp 469.506/karyawan        Rp 1,3 per Rp 100 upah      A. ROHMAN · Rp 480.000
 *
 * Jam & baris dari daftar lembur; upah dari Daftar Upah (dihitung backend).
 */
export function OvertimeCostCards({ entries, costRows, costError }: OvertimeCostCardsProps) {
  const summary = summarizeRegularOvertimeCost(entries, costRows ?? []);
  const costPending = costRows === null;
  const pendingText = costError ? "-" : "…";
  const pendingNote = costError ? `Upah gagal dimuat: ${costError}` : "Memuat upah dari Daftar Upah...";
  const share = summary.shareOfBasePay.toLocaleString("id-ID", { maximumFractionDigits: 1 });

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <NumberCard
        title="Total Jam Lembur"
        icon={Clock}
        value={`${minutesToHours(summary.minutes)} jam`}
        textValue
        note={`${summary.employees} karyawan · ${summary.entries} baris`}
      />
      <NumberCard
        title="Upah Lembur Reguler"
        icon={Wallet}
        value={costPending ? pendingText : formatRupiah(summary.pay)}
        textValue
        note={costPending ? pendingNote : `rata-rata ${formatRupiah(Math.round(summary.averagePay))}/karyawan yang lembur`}
      />
      <NumberCard
        title="Porsi terhadap Upah"
        icon={Percent}
        value={costPending ? pendingText : `${share}%`}
        textValue
        note={costPending ? pendingNote : `Rp ${share} lembur dari setiap Rp 100 upah hari kerja`}
      />
      <NumberCard
        title="Biaya Lembur Terbesar"
        icon={Crown}
        value={costPending ? pendingText : (summary.top?.name ?? "-")}
        textValue
        note={
          costPending
            ? pendingNote
            : summary.top
              ? `${formatRupiah(summary.top.pay)} · ${minutesToHours(summary.top.minutes)} jam`
              : "Belum ada lembur reguler pada periode ini."
        }
      />
    </div>
  );
}
