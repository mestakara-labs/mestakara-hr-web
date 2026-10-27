"use client";

import type { ReactNode } from "react";
import { CalendarDays, RotateCcw } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import { Spinner } from "@mestakara/ui/spinner";

import { formatDate, MONTH_NAMES } from "@/lib/date";
import {
  currentPeriod,
  isCurrentPeriod,
  lastMonthOf,
  periodReferenceDate,
  periodYearOptions,
  type DataPeriod,
} from "@/lib/period-rules";

interface PeriodFilterProps {
  value: DataPeriod;
  onChange: (period: DataPeriod) => void;
  /** Tahun paling awal yang bisa dipilih, mis. tahun Tanggal Masuk karyawan paling lama */
  firstYear: number;
  /** true selama data periode yang baru sedang dimuat */
  loading: boolean;
  /** Tombol di sisi kanan, mis. "Ekspor Excel" */
  action?: ReactNode;
}

/**
 * Filter PERIODE DATA di atas tabel Data Karyawan:
 *
 *   📅 Periode Data  [September ▾] [2026 ▾]  [⟲ Bulan Ini]            [▦ Ekspor Excel]
 *      Data per 30 September 2026.
 *
 * Bulan yang belum tiba tidak bisa dipilih. Aturan tanggal acuannya ada di lib/period-rules.ts.
 * Di HP, tombol `action` turun ke bawah filter.
 */
export function PeriodFilter({ value, onChange, firstYear, loading, action }: PeriodFilterProps) {
  /** Ganti tahun. Kalau bulannya jadi belum tiba (mis. Desember di tahun ini), mundur ke bulan terakhir yang boleh. */
  function changeYear(year: number) {
    onChange({ year, month: Math.min(value.month, lastMonthOf(year)) });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 typo-label-m text-fg-heading">
            <CalendarDays className="size-4 text-fg-brand" />
            Periode Data
          </span>

          <NativeSelect
            aria-label="Bulan periode data"
            value={String(value.month)}
            onChange={(event) => onChange({ ...value, month: Number(event.target.value) })}
            className="w-36"
          >
            {MONTH_NAMES.map((name, index) => (
              <NativeSelectOption key={name} value={String(index + 1)} disabled={index + 1 > lastMonthOf(value.year)}>
                {name}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <NativeSelect
            aria-label="Tahun periode data"
            value={String(value.year)}
            onChange={(event) => changeYear(Number(event.target.value))}
            className="w-28"
          >
            {periodYearOptions(firstYear).map((year) => (
              <NativeSelectOption key={year} value={String(year)}>
                {year}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isCurrentPeriod(value)}
            onClick={() => onChange(currentPeriod())}
          >
            <RotateCcw />
            Bulan Ini
          </Button>
        </div>

        <p className="flex items-center gap-2 typo-body-s text-fg-tertiary">
          {loading && <Spinner />}
          {loading ? "Memuat data periode..." : `Data per ${formatDate(periodReferenceDate(value))}.`}
        </p>
      </div>

      {action && <div className="flex shrink-0 flex-col sm:flex-row">{action}</div>}
    </div>
  );
}
