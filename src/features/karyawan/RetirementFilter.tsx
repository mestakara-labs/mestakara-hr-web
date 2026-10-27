"use client";

import { CalendarRange, RotateCcw } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";

import {
  checkRetirementFilter,
  describeRetirementFilter,
  EMPTY_RETIREMENT_FILTER,
  isRetirementFilterActive,
  MONTH_OPTIONS,
  type MonthYear,
  type RetirementFilterValue,
} from "./employee-retirement";

interface RetirementFilterProps {
  value: RetirementFilterValue;
  onChange: (value: RetirementFilterValue) => void;
  /** Pilihan tahun (lihat retirementYearOptions) */
  yearOptions: string[];
  /** Jumlah karyawan hasil filter, untuk kalimat keterangan */
  resultCount: number;
}

/**
 * Filter PENSIUN PADA PERIODE di atas tabel Data Karyawan:
 *
 *   📅 Pensiun pada periode
 *   Dari [Bulan ▾][Tahun ▾]   s.d.   [Bulan ▾][Tahun ▾]   [⟲ Reset]
 *   Menampilkan 4 karyawan Tetap yang pensiun Januari 2027 s.d. Juni 2027.
 *
 * Boleh diisi satu ujung saja ("mulai ..." atau "sampai ..."). Logikanya ada di employee-retirement.ts.
 */
export function RetirementFilter({ value, onChange, yearOptions, resultCount }: RetirementFilterProps) {
  const isActive = isRetirementFilterActive(value);
  const error = checkRetirementFilter(value);
  // Belum ada satu pun pilihan -> tombol Reset tidak perlu.
  const isEmpty = [value.from.month, value.from.year, value.to.month, value.to.year].every((item) => item === "");

  /** Ubah satu ujung periode ("from" / "to"). */
  function changeEnd(end: keyof RetirementFilterValue, next: MonthYear) {
    onChange({ ...value, [end]: next });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <p className="flex items-center gap-2 typo-label-m text-fg-heading">
        <CalendarRange className="size-4 text-fg-brand" />
        Pensiun pada periode
      </p>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <MonthYearSelect
          label="Dari"
          value={value.from}
          onChange={(next) => changeEnd("from", next)}
          yearOptions={yearOptions}
        />
        <span className="typo-body-s text-fg-secondary">s.d.</span>
        <MonthYearSelect
          label="Sampai"
          value={value.to}
          onChange={(next) => changeEnd("to", next)}
          yearOptions={yearOptions}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_RETIREMENT_FILTER)}
          disabled={isEmpty}
          className="self-start lg:self-auto"
        >
          <RotateCcw />
          Reset
        </Button>
      </div>

      {error ? (
        <p className="typo-body-s text-fg-danger">{error}</p>
      ) : isActive ? (
        <p className="typo-body-s text-fg-secondary">
          Menampilkan <strong className="text-fg-heading">{resultCount} karyawan Tetap</strong> yang pensiun{" "}
          {describeRetirementFilter(value)}.
        </p>
      ) : (
        <p className="text-xs text-fg-tertiary">
          Catatan: pilih bulan dan tahun. Boleh hanya &ldquo;Dari&rdquo; atau hanya &ldquo;Sampai&rdquo;. Hanya
          karyawan Tetap yang punya masa pensiun.
        </p>
      )}
    </div>
  );
}

/** Pilihan bulan + tahun untuk satu ujung periode, mis. "Dari [Januari ▾][2027 ▾]". */
function MonthYearSelect({
  label,
  value,
  onChange,
  yearOptions,
}: {
  label: string;
  value: MonthYear;
  onChange: (value: MonthYear) => void;
  yearOptions: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 typo-body-s text-fg-secondary lg:w-auto">{label}</span>
      <NativeSelect
        aria-label={`Bulan ${label.toLowerCase()}`}
        value={value.month}
        onChange={(event) => onChange({ ...value, month: event.target.value })}
      >
        <NativeSelectOption value="">Bulan</NativeSelectOption>
        {MONTH_OPTIONS.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={`Tahun ${label.toLowerCase()}`}
        value={value.year}
        onChange={(event) => onChange({ ...value, year: event.target.value })}
      >
        <NativeSelectOption value="">Tahun</NativeSelectOption>
        {yearOptions.map((year) => (
          <NativeSelectOption key={year} value={year}>
            {year}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
