"use client";

import { useState } from "react";
import { Calculator, Clock, Scale, Target, Wallet } from "lucide-react";
import { Button } from "@mestakara/ui/button";

import { NumberCard } from "@/components/shared/NumberCard";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { minutesToHours } from "@/lib/attendance-rules";
import { summarizeDwCost } from "@/lib/attendance-summary";
import { formatDifference } from "@/lib/dw-overtime-rules";
import { formatRupiah } from "@/lib/wage-rules";
import type { DwOvertimeTargetRow } from "@/types/api/dw-overtime";

import { DwRecommendationDialog } from "./DwRecommendationDialog";
import { DwTargetTable } from "./DwTargetTable";

interface DwTargetSectionProps {
  period: string;
  periodLabel: string;
  /** true = periode dikunci; Hitung Rekomendasi dimatikan */
  locked: boolean;
  /** Dipanggil setelah rekomendasi disimpan (daftar lembur & status tab dimuat ulang) */
  onChanged: () => void;
}

/**
 * Bagian TARGET vs UPAH LEMBUR DW di tab Lembur DW:
 *
 *   Target vs Upah Lembur DW Oktober 2026                         [🖩 Hitung Rekomendasi]
 *   [Total Jam Lembur DW 64,5 jam] [Upah Lembur DW Rp 3.380.000] [Target Rp 3.420.000] [Selisih −Rp 40.000]
 *   (tabel DwTargetTable; centang baris = hitung untuk karyawan itu saja)
 *
 * Data dari /api/dw-overtime-targets?period=YYYY-MM. Rekomendasi menggantikan baris Excel & rekomendasi lama
 * karyawan yang dihitung; baris manual & mobile tetap.
 */
export function DwTargetSection({ period, periodLabel, locked, onChanged }: DwTargetSectionProps) {
  const { data: rows, loading, error, reload } = useApiGet<DwOvertimeTargetRow[]>(`/api/dw-overtime-targets?period=${period}`);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // null = dialog tertutup; [] = semua karyawan ber-DW; isi = karyawan yang dicentang.
  const [recommendFor, setRecommendFor] = useState<string[] | null>(null);

  // Ringkasan biaya (jam, upah, target, selisih) dihitung dari daftar target yang sama dengan tabel.
  const summary = summarizeDwCost(rows ?? []);

  function afterSaved() {
    setSelectedIds([]);
    reload();
    onChanged();
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="typo-label-m text-fg-heading">Target vs Upah Lembur DW {periodLabel}</h3>
        <Button onClick={() => setRecommendFor(selectedIds)} disabled={locked || !rows || summary.withDwDays === 0}>
          <Calculator />
          {selectedIds.length > 0 ? `Hitung Rekomendasi (${selectedIds.length} karyawan)` : "Hitung Rekomendasi"}
        </Button>
      </div>
      <p className="typo-body-s text-fg-tertiary">
        Target = hari DW × Rp/hari. Hitung Rekomendasi menyebar jam lembur (kelipatan 30 menit, mulai 17.00, maks. 4 jam/hari)
        ke tanggal K/DW tanpa lembur reguler, sedekat mungkin dengan target. Hasilnya menggantikan baris Excel & rekomendasi lama;
        baris manual & mobile tetap. Centang karyawan untuk menghitung sebagian saja.
      </p>

      {loading && <PageLoading label="Memuat target lembur DW..." />}
      {error && <PageError message={error} />}

      {rows && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <NumberCard
              title="Total Jam Lembur DW"
              icon={Clock}
              value={`${minutesToHours(summary.minutes)} jam`}
              textValue
              note={`${summary.employees} karyawan · ${summary.entries} baris`}
            />
            <NumberCard
              title="Upah Lembur DW"
              icon={Wallet}
              value={formatRupiah(summary.pay)}
              textValue
              note="dibayar sebagai lembur, pengganti hari DW"
            />
            <NumberCard
              title="Target"
              icon={Target}
              value={formatRupiah(summary.target)}
              textValue
              note={`hari DW × Rp/hari · ${summary.withDwDays} karyawan ber-DW`}
            />
            <NumberCard
              title="Selisih"
              icon={Scale}
              value={formatDifference(summary.pay - summary.target)}
              textValue
              note={`upah − target (minus = kurang) · ${summary.notMatched} karyawan belum sesuai`}
            />
          </div>

          <DwTargetTable rows={rows} selection={{ selectedIds, onChange: setSelectedIds }} />
        </>
      )}

      <DwRecommendationDialog
        employeeIds={recommendFor}
        period={period}
        periodLabel={periodLabel}
        onClose={() => setRecommendFor(null)}
        onSaved={afterSaved}
      />
    </section>
  );
}
