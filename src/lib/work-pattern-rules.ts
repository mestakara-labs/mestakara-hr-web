/**
 * ATURAN POLA KERJA yang dipakai editor pola (browser) DAN data mock (server).
 *
 * Pola = tabel slot × hari siklus. Fungsi di sini menghitung RINGKASAN pola:
 * berapa slot di setiap shift per hari, dan beban kerja setiap slot.
 */
import { shiftDurationMinutes } from "./shift-rules";

/** Batas panjang siklus pola. */
export const MIN_CYCLE_DAYS = 1;
export const MAX_CYCLE_DAYS = 28;

/** Batas wajar jam kerja per minggu (sebagai PERINGATAN, bukan larangan). */
export const WEEKLY_WORK_LIMIT_MINUTES = 40 * 60;

/** Nama hari, urut dari Senin (1) sampai Minggu (7). */
export const WEEKDAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

/**
 * CARA MENAMPILKAN HARI SIKLUS di editor & ringkasan pola (HANYA tampilan, tidak disimpan).
 *   mode "number"  -> Hari ke-1, Hari ke-2, ...
 *   mode "weekday" -> umpamakan hari ke-1 = `dayOneWeekday` (1 = Senin ... 7 = Minggu),
 *                     mis. hari ke-1 = Rabu -> Rabu, Kamis, Jumat, ... (berputar terus)
 * Hari ke-1 yang sebenarnya ditentukan oleh Tanggal Mulai Berlaku Jadwal di regu kerja.
 */
export interface DayView {
  mode: "number" | "weekday";
  dayOneWeekday: number;
}

export const DEFAULT_DAY_VIEW: DayView = { mode: "number", dayOneWeekday: 1 };

/** Judul kolom hari siklus ke-`dayIndex` (mulai 1), mis. "Hari ke-3" atau "Rabu". */
export function dayLabel(dayIndex: number, view: DayView): string {
  if (view.mode === "number") return `Hari ke-${dayIndex}`;
  return WEEKDAY_NAMES[(view.dayOneWeekday - 1 + dayIndex - 1) % 7];
}

/** Shift minimal yang dibutuhkan untuk menghitung jam kerja. */
interface ShiftHours {
  id: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
}

/** Slot minimal yang dibutuhkan ringkasan. */
interface SlotDays {
  shift_ids: (string | null)[];
}

/**
 * Jumlah slot per shift di SETIAP hari siklus.
 *   hasil[0] = hari ke-1, mis. { "shift-pagi": 2, "shift-sore": 1 }
 */
export function coveragePerDay(slots: SlotDays[], cycleDays: number): Record<string, number>[] {
  return Array.from({ length: cycleDays }, (_, dayIndex) => {
    const counts: Record<string, number> = {};
    for (const slot of slots) {
      const shiftId = slot.shift_ids[dayIndex];
      if (shiftId) counts[shiftId] = (counts[shiftId] ?? 0) + 1;
    }
    return counts;
  });
}

/** Beban kerja satu slot dalam satu siklus. */
export interface SlotWorkload {
  workDays: number;
  offDays: number;
  /** Jam kerja bersih rata-rata per 7 hari, dalam menit */
  weeklyWorkMinutes: number;
  /** true = melebihi WEEKLY_WORK_LIMIT_MINUTES */
  isOverLimit: boolean;
  /** true = tidak ada hari libur sama sekali di siklus ini */
  hasNoDayOff: boolean;
}

/**
 * Hitung beban kerja satu slot.
 *   jam per minggu = (jam kerja bersih satu siklus) × 7 ÷ panjang siklus
 */
export function slotWorkload(slot: SlotDays, cycleDays: number, shifts: ShiftHours[]): SlotWorkload {
  const days = slot.shift_ids.slice(0, cycleDays);
  let cycleMinutes = 0;
  let workDays = 0;

  for (const shiftId of days) {
    const shift = shifts.find((item) => item.id === shiftId);
    if (!shift) continue;
    workDays++;
    cycleMinutes += shiftDurationMinutes(shift.start_time, shift.end_time) - shift.break_minutes;
  }

  const weeklyWorkMinutes = cycleDays > 0 ? Math.round((cycleMinutes * 7) / cycleDays) : 0;

  return {
    workDays,
    offDays: cycleDays - workDays,
    weeklyWorkMinutes,
    isOverLimit: weeklyWorkMinutes > WEEKLY_WORK_LIMIT_MINUTES,
    hasNoDayOff: workDays === cycleDays,
  };
}

/**
 * Panjang siklus diganti -> daftar shift setiap slot disesuaikan:
 * hari tambahan diisi libur (null), hari yang berlebih dibuang.
 */
export function resizeShiftIds(shiftIds: (string | null)[], cycleDays: number): (string | null)[] {
  return Array.from({ length: cycleDays }, (_, index) => shiftIds[index] ?? null);
}
