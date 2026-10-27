"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@mestakara/ui/input";

import { hourlyRate, overtimePay, paidHours, type OvertimeRates } from "@/lib/overtime-rules";
import { formatRupiah, parseRupiah, toRupiahText } from "@/lib/wage-rules";

/**
 * CONTOH PERHITUNGAN lembur satu hari, dihitung ulang setiap kali pengaturan atau isian contoh diubah:
 *
 *   🧮 Contoh perhitungan
 *   Gaji Pokok [2.375.000]  Lama lembur [3] jam
 *   Tarif per jam   2.375.000 ÷ 173 = Rp 13.728
 *   Jam dibayar     1 × 1,5 + 2 × 2 = 5,5 jam
 *   Upah lembur     Rp 13.728 × 5,5 = Rp 75.504 -> dibulatkan Rp 75.500
 */
export function OvertimeExample({ rates }: { rates: OvertimeRates }) {
  const [salaryText, setSalaryText] = useState("2.375.000");
  const [hoursText, setHoursText] = useState("3");

  const salary = parseRupiah(salaryText) ?? 0;
  const hours = Number(hoursText.replace(",", ".")) || 0;
  const rate = hourlyRate(salary, rates);
  const paid = paidHours(hours, rates);
  const firstHour = Math.min(hours, 1);
  const nextHours = Math.max(hours - 1, 0);
  const isValid = rates.hourly_divisor > 0 && rates.first_hour_multiplier > 0 && rates.next_hour_multiplier > 0;

  /** 5.5 -> "5,5" */
  const number = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-subtle p-4">
      <p className="flex items-center gap-2 typo-label-m text-fg-heading">
        <Calculator className="size-4 text-fg-brand" />
        Contoh perhitungan
      </p>

      <div className="flex flex-wrap items-center gap-2 typo-body-s text-fg-secondary">
        Gaji Pokok
        <Input
          aria-label="Gaji Pokok contoh"
          inputMode="numeric"
          value={salaryText}
          onChange={(event) => setSalaryText(toRupiahText(parseRupiah(event.target.value)))}
          className="w-36"
        />
        Lama lembur
        <Input
          aria-label="Lama lembur contoh (jam)"
          inputMode="decimal"
          value={hoursText}
          onChange={(event) => setHoursText(event.target.value)}
          className="w-20"
        />
        jam
      </div>

      {isValid ? (
        <dl className="grid gap-1 typo-body-s sm:grid-cols-[9rem_1fr]">
          <dt className="text-fg-tertiary">Tarif per jam</dt>
          <dd className="text-fg-primary">
            {toRupiahText(salary)} ÷ {number(rates.hourly_divisor)} = {formatRupiah(rate)}
          </dd>
          <dt className="text-fg-tertiary">Jam dibayar</dt>
          <dd className="text-fg-primary">
            {number(firstHour)} × {number(rates.first_hour_multiplier)}
            {nextHours > 0 && ` + ${number(nextHours)} × ${number(rates.next_hour_multiplier)}`} = {number(paid)} jam
          </dd>
          <dt className="text-fg-tertiary">Upah lembur</dt>
          <dd className="font-medium text-fg-heading">
            {formatRupiah(rate)} × {number(paid)} = {formatRupiah(Math.round(rate * paid))} → dibulatkan{" "}
            {formatRupiah(overtimePay(salary, hours, rates))}
          </dd>
        </dl>
      ) : (
        <p className="typo-body-s text-fg-tertiary">Lengkapi pembagi dan pengali untuk melihat contoh.</p>
      )}
    </div>
  );
}
