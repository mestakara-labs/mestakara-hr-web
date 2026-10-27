"use client";

import { TriangleAlert } from "lucide-react";
import { cn } from "cn";

import { ShiftBadge } from "@/features/shift/ShiftBadge";
import { formatMinutes } from "@/lib/shift-rules";
import { coveragePerDay, dayLabel, slotWorkload, WEEKLY_WORK_LIMIT_MINUTES, type DayView } from "@/lib/work-pattern-rules";
import type { ShiftResource } from "@/types/api/shift";
import type { PatternSlotPayload } from "@/types/api/work-pattern";

interface PatternSummaryProps {
  slots: PatternSlotPayload[];
  cycleDays: number;
  /** Cara menampilkan judul hari (Hari ke-n / nama hari) */
  dayView: DayView;
  shifts: ShiftResource[];
}

/**
 * RINGKASAN POLA (dihitung otomatis dari editor):
 *
 *   Jumlah slot per shift          Hari ke-1  Hari ke-2 ... Hari ke-7
 *   [P] Pagi                            1          1    ...     2
 *   [T] Tengah                      1   1   1  ...  1
 *
 *   Beban kerja per slot     Hari kerja | Libur | Jam kerja / minggu
 *   A Posisi A                  6      |   1   | 30 jam
 *   (!) peringatan kalau > 40 jam/minggu atau tanpa hari libur
 */
export function PatternSummary({ slots, cycleDays, dayView, shifts }: PatternSummaryProps) {
  const coverage = coveragePerDay(slots, cycleDays);
  const days = Array.from({ length: cycleDays }, (_, index) => index);
  // Hanya shift yang dipakai di pola ini, urut sesuai daftar shift.
  const usedShifts = shifts.filter((shift) => slots.some((slot) => slot.shift_ids.includes(shift.id)));

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className="typo-label-m text-fg-heading">Jumlah slot per shift</p>
        {usedShifts.length === 0 ? (
          <p className="typo-body-s text-fg-tertiary">Belum ada shift yang dipilih di editor.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse typo-body-s">
              <thead className="bg-subtle text-fg-secondary">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Shift</th>
                  {days.map((day) => (
                    <th key={day} className="px-2 py-2 text-center font-medium whitespace-nowrap">
                      {dayLabel(day + 1, dayView)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usedShifts.map((shift) => (
                  <tr key={shift.id} className="border-t border-border">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <ShiftBadge shift={shift} showName />
                    </td>
                    {days.map((day) => {
                      const count = coverage[day][shift.id] ?? 0;
                      return (
                        <td
                          key={day}
                          className={cn("px-2 py-2 text-center", count === 0 ? "text-fg-tertiary" : "text-fg-heading")}
                        >
                          {count === 0 ? "–" : count}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-fg-tertiary">Catatan: &ldquo;–&rdquo; = tidak ada slot di shift itu pada hari tersebut.</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="typo-label-m text-fg-heading">Beban kerja per slot</p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse typo-body-s">
            <thead className="bg-subtle text-fg-secondary">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Slot</th>
                <th className="px-3 py-2 text-center font-medium">Hari kerja</th>
                <th className="px-3 py-2 text-center font-medium">Libur</th>
                <th className="px-3 py-2 text-left font-medium">Jam kerja / minggu</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const workload = slotWorkload(slot, cycleDays, shifts);
                const warnings = [
                  workload.isOverLimit && `lebih dari ${formatMinutes(WEEKLY_WORK_LIMIT_MINUTES)}`,
                  workload.hasNoDayOff && "tanpa hari libur",
                ].filter(Boolean);

                return (
                  <tr key={slot.id} className="border-t border-border">
                    <td className="px-3 py-2 whitespace-nowrap text-fg-heading">
                      <strong>{slot.code}</strong> {slot.name}
                    </td>
                    <td className="px-3 py-2 text-center">{workload.workDays}</td>
                    <td className="px-3 py-2 text-center">{workload.offDays}</td>
                    <td className="px-3 py-2">
                      <span className={warnings.length > 0 ? "text-fg-warning" : "text-fg-primary"}>
                        {formatMinutes(workload.weeklyWorkMinutes)}
                      </span>
                      {warnings.length > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-fg-warning">
                          <TriangleAlert className="size-3.5" />
                          {warnings.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-fg-tertiary">
          Catatan: jam kerja per minggu = jam kerja bersih satu siklus × 7 ÷ panjang siklus. Hanya peringatan, pola
          tetap bisa disimpan.
        </p>
      </div>
    </div>
  );
}
