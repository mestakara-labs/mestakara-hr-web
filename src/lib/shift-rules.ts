/**
 * ATURAN SHIFT (jam kerja) yang dipakai form (browser) DAN data mock (server).
 *
 * Jam ditulis sebagai teks "HH:MM" 24 jam, mis. "07:00", "22:00".
 * Shift yang jam selesainya lebih kecil atau sama dengan jam mulai dianggap
 * LINTAS TENGAH MALAM, mis. Malam 22:00–06:00 (selesai keesokan harinya).
 */

/**
 * PALET WARNA REKOMENDASI untuk penanda shift (badge & kalender jadwal), diambil dari
 * palet tema @mestakara/ui. Pengguna juga boleh mengetik kode warnanya sendiri (lib/color.ts).
 * Warna disimpan sebagai HEX, mis. "#1BAA4E".
 */
export const SHIFT_COLOR_PALETTE = [
  { hex: "#1BAA4E", label: "Hijau" },
  { hex: "#5EC384", label: "Hijau Muda" },
  { hex: "#2F6B57", label: "Hijau Hutan" },
  { hex: "#7FA898", label: "Hijau Hutan Muda" },
  { hex: "#5BB3E4", label: "Biru Langit" },
  { hex: "#2B7DAE", label: "Biru" },
  { hex: "#363A96", label: "Biru Tua" },
  { hex: "#8086CB", label: "Biru Lembayung" },
  { hex: "#C9A23A", label: "Emas" },
  { hex: "#F58A2B", label: "Oranye" },
  { hex: "#D93B3B", label: "Merah" },
  { hex: "#7D796E", label: "Abu-abu" },
  { hex: "#C5C0B4", label: "Abu-abu Muda" },
] as const;

/** Nilai bawaan isian shift baru. */
export const SHIFT_DEFAULTS = {
  break_minutes: 0,
  late_tolerance_minutes: 10,
  /** Scan masuk sudah dianggap sah mulai 2 jam sebelum shift dimulai */
  checkin_window_before_minutes: 120,
  /** Scan pulang masih dianggap sah sampai 4 jam setelah shift selesai */
  checkout_window_after_minutes: 240,
};

const MINUTES_PER_DAY = 24 * 60;

/** Apakah teks jam berbentuk "HH:MM" yang benar (00:00–23:59)? */
export function isValidTime(text: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text);
}

/** "07:30" -> 450 (menit sejak tengah malam). */
export function timeToMinutes(text: string): number {
  const [hours, minutes] = text.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Apakah shift selesai keesokan harinya? Cth. 22:00–06:00 -> true. */
export function crossesMidnight(startTime: string, endTime: string): boolean {
  return timeToMinutes(endTime) <= timeToMinutes(startTime);
}

/**
 * Lama shift dalam menit (termasuk istirahat).
 *   07:00–12:00 -> 300;  22:00–06:00 -> 480 (lintas tengah malam)
 */
export function shiftDurationMinutes(startTime: string, endTime: string): number {
  const difference = timeToMinutes(endTime) - timeToMinutes(startTime);
  return difference > 0 ? difference : difference + MINUTES_PER_DAY;
}

/** "07:00", "12:00" -> "07.00–12.00";  lintas tengah malam -> "22.00–06.00 (+1)". */
export function formatShiftTime(startTime: string, endTime: string): string {
  const text = `${startTime.replace(":", ".")}–${endTime.replace(":", ".")}`;
  return crossesMidnight(startTime, endTime) ? `${text} (+1)` : text;
}

/** Tulisan pilihan "libur" di editor pola. */
export const DAY_OFF_LABEL = "L (Libur)";

/**
 * Tulisan pilihan shift di editor pola, lengkap dengan jam kerjanya:
 *   Pagi 07:00–12:00   -> "P (07.00–12.00)"
 *   Malam 22:00–06:00  -> "M (22.00–06.00 +1)"   (+1 = selesai keesokan harinya)
 */
export function shiftOptionLabel(shift: { code: string; start_time: string; end_time: string }): string {
  const time = `${shift.start_time.replace(":", ".")}–${shift.end_time.replace(":", ".")}`;
  return `${shift.code} (${time}${crossesMidnight(shift.start_time, shift.end_time) ? " +1" : ""})`;
}

/** 510 -> "8 jam 30 menit";  480 -> "8 jam";  45 -> "45 menit". */
export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} menit`;
  return minutes === 0 ? `${hours} jam` : `${hours} jam ${minutes} menit`;
}
