/**
 * PEMBUAT JADWAL (generator) data mock — pengganti service backend `ScheduleGenerator`.
 * Nantinya backend menjalankan logika yang sama lewat cron (tanggal 20 untuk bulan depan)
 * dan lewat tombol "Buat Jadwal".
 *
 *   untuk setiap anggota aktif × setiap tanggal di bulan itu:
 *     shiftOnDate(regu, pola, anggota, tanggal)  -> slot & shift (lihat lib/schedule-rules.ts)
 *     jam shift disalin ke planned_start / planned_end
 */
import { addDays } from "@/lib/date";
import { SCHEDULE_SOURCE } from "@/lib/schedule-period-rules";
import { coveragePerDay } from "@/lib/work-pattern-rules";
import { crossesMidnight } from "@/lib/shift-rules";
import { dayIndexOnDate, shiftOnDate, type RotationSettings } from "@/lib/schedule-rules";
import type { ScheduleVacancy } from "@/types/api/schedule";

import type { ShiftRecord } from "./schedule/shifts";
import type { GroupMemberRecord } from "./schedule/work-groups";
import type { WorkPatternRecord } from "./schedule/work-patterns";

/** Periode jadwal seperti yang DISIMPAN. */
export interface SchedulePeriodRecord {
  id: string;
  group_id: string;
  month: string;
  status: string;
  generated_at: string;
  generated_by: string;
  published_at: string | null;
  published_by: string | null;
  locked_at: string | null;
  locked_by: string | null;
}

/** Satu baris jadwal seperti yang DISIMPAN. */
export interface ScheduleEntryRecord {
  id: string;
  period_id: string;
  member_id: string;
  employee_id: string;
  work_date: string;
  shift_id: string | null;
  planned_start: string | null;
  planned_end: string | null;
  slot_code: string | null;
  generated_shift_id: string | null;
  source: string;
}

/** Satu riwayat perubahan jadwal. */
export interface ScheduleChangeRecord {
  id: string;
  schedule_id: string;
  old_shift_id: string | null;
  new_shift_id: string | null;
  reason: string | null;
  changed_by: string;
  changed_at: string;
}

/**
 * Jam rencana sebuah shift pada tanggal kerja, disalin ke jadwal.
 *   Pagi 07:00–12:00 tgl 14 -> 2026-10-14T07:00 s.d. 2026-10-14T12:00
 *   Malam 22:00–06:00 tgl 14 -> 2026-10-14T22:00 s.d. 2026-10-15T06:00 (selesai keesokan harinya)
 */
export function plannedTimes(date: string, shift: ShiftRecord | undefined) {
  if (!shift) return { planned_start: null, planned_end: null };

  const endDate = crossesMidnight(shift.start_time, shift.end_time) ? addDays(date, 1) : date;
  return { planned_start: `${date}T${shift.start_time}`, planned_end: `${endDate}T${shift.end_time}` };
}

/** Buat baris jadwal untuk setiap anggota yang aktif pada setiap tanggal. */
export function buildEntries(
  periodId: string,
  rotation: RotationSettings,
  pattern: WorkPatternRecord,
  members: GroupMemberRecord[],
  shifts: ShiftRecord[],
  dates: string[],
  createId: (prefix: string) => string,
): ScheduleEntryRecord[] {
  return members.flatMap((member) =>
    dates.flatMap((date): ScheduleEntryRecord[] => {
      const result = shiftOnDate(rotation, pattern, member, date);
      if (!result) return []; // anggota tidak aktif pada tanggal ini

      const shift = shifts.find((item) => item.id === result.shiftId);
      return [
        {
          id: createId("jadwal"),
          period_id: periodId,
          member_id: member.id,
          employee_id: member.employee_id,
          work_date: date,
          shift_id: result.shiftId,
          ...plannedTimes(date, shift),
          slot_code: result.slot.code,
          generated_shift_id: result.shiftId,
          source: SCHEDULE_SOURCE.generator,
        },
      ];
    }),
  );
}

/**
 * Shift yang KURANG orang pada setiap tanggal:
 *   kebutuhan = jumlah slot pola yang berisi shift itu pada hari siklus tersebut
 *   terisi    = jumlah baris jadwal dengan shift itu pada tanggal tersebut
 * Kurang = kebutuhan − terisi (hanya yang lebih dari 0).
 */
export function computeVacancies(
  rotation: RotationSettings,
  pattern: WorkPatternRecord,
  entries: ScheduleEntryRecord[],
  dates: string[],
): ScheduleVacancy[] {
  const coverage = coveragePerDay(pattern.slots, pattern.cycle_days);

  // Sebelum Tanggal Mulai Berlaku Jadwal, regu belum berjalan -> tidak ada shift kosong.
  return dates.filter((date) => date >= rotation.anchor_date).flatMap((date) => {
    const required = coverage[dayIndexOnDate(rotation, pattern, date) - 1];
    return Object.entries(required).flatMap(([shiftId, needed]) => {
      const filled = entries.filter((entry) => entry.work_date === date && entry.shift_id === shiftId).length;
      return filled < needed ? [{ date, shift_id: shiftId, missing: needed - filled }] : [];
    });
  });
}
