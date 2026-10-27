"use client";

import type { ReactNode } from "react";
import { cn } from "cn";

import { ShiftBadge } from "@/features/shift/ShiftBadge";
import { isoWeekday, parseDate } from "@/lib/date";
import type { HolidayResource } from "@/types/api/holiday";
import type { ShiftResource } from "@/types/api/shift";

/** Satu sel kalender: satu karyawan pada satu tanggal. */
export interface ScheduleGridCell {
  date: string;
  /** Shift hari itu. null = libur (atau tidak aktif, lihat `inactive`). */
  shiftId: string | null;
  /** Kode slot yang dipakai hari itu, mis. "A" (ditampilkan kecil) */
  slotCode?: string | null;
  /** true = karyawan belum/sudah tidak aktif di regu pada tanggal ini (ditampilkan "–") */
  inactive?: boolean;
  /** true = sel ini sudah diubah manual (diberi tanda titik) */
  isManual?: boolean;
  /** Kalau diisi, sel bisa diklik (mis. untuk mengubah jadwal) */
  onClick?: () => void;
}

/** Satu baris kalender: satu karyawan. */
export interface ScheduleGridRow {
  key: string;
  title: string;
  subtitle?: ReactNode;
  cells: ScheduleGridCell[];
}

interface ScheduleGridProps {
  dates: string[];
  rows: ScheduleGridRow[];
  shifts: ShiftResource[];
  holidays: HolidayResource[];
  /** Shift yang tidak ada orangnya, per tanggal: { "2026-10-14": ["P"] }. Kosong = baris tidak ditampilkan. */
  vacanciesByDate?: Record<string, string[]>;
}

const WEEKDAY_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/**
 * KALENDER JADWAL: karyawan × tanggal.
 *
 *              Sen Sel Rab ... Min        <- kolom akhir pekan diarsir, hari libur ditandai merah
 *              5   6   7       11
 *   Asep        P   P   P  ...  P         <- kode shift berwarna; L = libur; "–" = tidak aktif
 *               a   a   a       a         <- kode slot (kecil)
 *   ...
 *   Shift kosong    –   –   P             <- hanya kalau ada lowongan
 *
 * Dipakai pratinjau rotasi di Regu Kerja dan halaman Jadwal Kerja.
 */
export function ScheduleGrid({ dates, rows, shifts, holidays, vacanciesByDate }: ScheduleGridProps) {
  const holidayByDate = new Map(holidays.map((holiday) => [holiday.date, holiday]));
  const shiftById = new Map(shifts.map((shift) => [shift.id, shift]));
  const showVacancies = vacanciesByDate !== undefined && Object.keys(vacanciesByDate).length > 0;

  /** Kelas latar kolom: akhir pekan diarsir tipis. */
  function columnClass(date: string): string {
    return isoWeekday(date) >= 6 ? "bg-subtle" : "";
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="border-collapse typo-body-s">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-48 border-b border-border bg-surface px-3 py-2 text-left font-medium text-fg-secondary">
              Karyawan
            </th>
            {dates.map((date) => {
              const holiday = holidayByDate.get(date);
              return (
                <th
                  key={date}
                  title={holiday ? `${holiday.name} (${holiday.type})` : undefined}
                  className={cn(
                    "min-w-11 border-b border-l border-border px-1 py-1 text-center font-normal",
                    columnClass(date),
                  )}
                >
                  <span className={cn("block text-xs", holiday ? "text-fg-danger" : "text-fg-tertiary")}>
                    {WEEKDAY_SHORT[isoWeekday(date) - 1]}
                  </span>
                  <span className={cn("block font-medium", holiday ? "text-fg-danger" : "text-fg-heading")}>
                    {parseDate(date).getDate()}
                  </span>
                  {holiday && <span className="mx-auto block size-1.5 rounded-full bg-danger" aria-hidden />}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="sticky left-0 z-10 border-b border-border bg-surface px-3 py-2">
                <p className="font-medium whitespace-nowrap text-fg-heading">{row.title}</p>
                {row.subtitle && <div className="text-xs text-fg-tertiary">{row.subtitle}</div>}
              </td>
              {row.cells.map((cell) => (
                <td
                  key={cell.date}
                  className={cn("border-b border-l border-border p-0 text-center", columnClass(cell.date))}
                >
                  <CellContent cell={cell} shift={cell.shiftId ? shiftById.get(cell.shiftId) : undefined} />
                </td>
              ))}
            </tr>
          ))}

          {showVacancies && (
            <tr>
              <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-medium text-fg-danger">Shift kosong</td>
              {dates.map((date) => (
                <td
                  key={date}
                  className={cn("border-l border-border px-1 py-2 text-center text-xs", columnClass(date))}
                >
                  {vacanciesByDate?.[date]?.length ? (
                    <span className="font-medium text-fg-danger">{vacanciesByDate[date].join(" ")}</span>
                  ) : (
                    <span className="text-fg-tertiary">·</span>
                  )}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Isi satu sel: badge shift (atau L / –), kode slot kecil, dan tanda ubahan manual. */
function CellContent({ cell, shift }: { cell: ScheduleGridCell; shift: ShiftResource | undefined }) {
  const content = (
    <span className="relative flex flex-col items-center gap-0.5 px-1 py-1.5">
      {cell.inactive ? (
        <span className="text-fg-tertiary">–</span>
      ) : shift ? (
        <ShiftBadge shift={shift} />
      ) : (
        <span className="text-fg-tertiary">L</span>
      )}
      {cell.slotCode && !cell.inactive && (
        <span className="text-[11px] leading-none text-fg-tertiary">{cell.slotCode.toLowerCase()}</span>
      )}
      {cell.isManual && (
        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-warning" title="Diubah manual" />
      )}
    </span>
  );

  if (!cell.onClick || cell.inactive) return content;

  return (
    <button type="button" onClick={cell.onClick} className="w-full hover:bg-brand-subtle" aria-label={`Ubah jadwal ${cell.date}`}>
      {content}
    </button>
  );
}
