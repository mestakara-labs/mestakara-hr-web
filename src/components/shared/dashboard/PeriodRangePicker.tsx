"use client";

import { useState } from "react";
import { CalendarDays, RotateCcw } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@mestakara/ui/popover";

import { MONTH_NAMES } from "@/lib/date";
import { lastMonthOf, periodYearOptions, type DataPeriod } from "@/lib/period-rules";
import {
  FIRST_DASHBOARD_YEAR,
  MAX_RANGE_MONTHS,
  defaultRange,
  normalizeRange,
  rangeLabel,
  type PeriodRange,
} from "@/lib/period-range";

interface PeriodRangePickerProps {
  value: PeriodRange;
  onChange: (range: PeriodRange) => void;
}

/**
 * Tombol PERIODE RENTANG di pojok kartu / grafik:
 *
 *   [📅 Jan – Okt 2026 ▾]
 *      Dari [Januari ▾][2026 ▾]   s.d. [Oktober ▾][2026 ▾]
 *      Maks. 24 bulan. Bulan berjalan dihitung sampai hari ini.
 *      [↺ Awal Tahun s.d. Hari Ini]                 [Terapkan]
 *
 * Pilihan baru berlaku setelah "Terapkan"; dirapikan dulu oleh normalizeRange (tukar, maks 24 bulan).
 */
export function PeriodRangePicker({ value, onChange }: PeriodRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PeriodRange>(value);

  function openChange(next: boolean) {
    // Setiap kali dibuka, isian dimulai dari pilihan yang sedang berlaku.
    if (next) setDraft(value);
    setOpen(next);
  }

  function apply(range: PeriodRange) {
    onChange(normalizeRange(range));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" aria-label={`Periode ${rangeLabel(value)}`}>
          <CalendarDays />
          {rangeLabel(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-auto flex-col gap-3">
        <MonthYearSelect label="Dari" value={draft.from} onChange={(from) => setDraft({ ...draft, from })} />
        <MonthYearSelect label="s.d." value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
        <p className="typo-body-s text-fg-tertiary">
          Maks. {MAX_RANGE_MONTHS} bulan. Bulan berjalan dihitung sampai hari ini.
        </p>
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => apply(defaultRange())}>
            <RotateCcw />
            Awal Tahun s.d. Hari Ini
          </Button>
          <Button type="button" size="sm" onClick={() => apply(draft)}>
            Terapkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Satu baris pilihan bulan + tahun. Bulan yang belum tiba tidak muncul di pilihan. */
function MonthYearSelect({ label, value, onChange }: { label: string; value: DataPeriod; onChange: (period: DataPeriod) => void }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr_6rem] items-center gap-2">
      <span className="typo-label-m text-fg-secondary">{label}</span>
      <NativeSelect
        aria-label={`Bulan ${label}`}
        value={String(value.month)}
        onChange={(event) => onChange({ ...value, month: Number(event.target.value) })}
      >
        {MONTH_NAMES.slice(0, lastMonthOf(value.year)).map((name, index) => (
          <NativeSelectOption key={name} value={String(index + 1)}>
            {name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={`Tahun ${label}`}
        value={String(value.year)}
        onChange={(event) => {
          const year = Number(event.target.value);
          onChange({ year, month: Math.min(value.month, lastMonthOf(year)) });
        }}
      >
        {periodYearOptions(FIRST_DASHBOARD_YEAR).map((year) => (
          <NativeSelectOption key={year} value={String(year)}>
            {year}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
