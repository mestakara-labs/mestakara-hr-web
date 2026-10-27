/**
 * ATURAN PERIODE JADWAL (jadwal resmi satu regu untuk satu bulan), dipakai browser DAN data mock.
 *
 *   Proyeksi ──(Buat Jadwal)──> Draf ──(Terbitkan)──> Terbit ──(Kunci)──> Terkunci
 *   dihitung, tidak disimpan    bisa diubah bebas     ubahan wajib alasan    tidak bisa diubah
 *
 * Jendela jadwal: hanya BULAN BERJALAN dan BULAN DEPAN yang bisa dibuat jadwalnya.
 * Bulan sesudahnya cukup ditampilkan sebagai proyeksi.
 */
import { addDays, MONTH_NAMES, toDateText } from "./date";

export const SCHEDULE_PERIOD_STATUS = {
  draft: "Draf",
  published: "Terbit",
  locked: "Terkunci",
} as const;

/** Banyaknya bulan yang boleh dibuat jadwalnya: bulan berjalan + bulan depan. */
export const SCHEDULE_WINDOW_MONTHS = 2;

/** Sumber satu baris jadwal. */
export const SCHEDULE_SOURCE = {
  /** Dibuat otomatis dari pola & rotasi */
  generator: "Generator",
  /** Diubah manual (berbeda dari hasil pola) */
  manual: "Manual",
} as const;

/** "2026-10-14" -> "2026-10" */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** Bulan sekarang, mis. "2026-10". */
export function currentMonth(today: Date = new Date()): string {
  return monthOf(toDateText(today));
}

/** Geser bulan: ("2026-12", 1) -> "2027-01"; ("2026-01", -1) -> "2025-12". */
export function shiftMonth(month: string, step: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + step, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-11" -> "November 2026" */
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${MONTH_NAMES[monthNumber - 1]} ${year}`;
}

/** Semua tanggal dalam satu bulan: "2026-11" -> ["2026-11-01", ..., "2026-11-30"]. */
export function datesOfMonth(month: string): string[] {
  const first = `${month}-01`;
  const dates: string[] = [];
  for (let date = first; monthOf(date) === month; date = addDays(date, 1)) dates.push(date);
  return dates;
}

/**
 * Posisi bulan terhadap jendela jadwal:
 *   "past"     bulan yang sudah lewat
 *   "window"   bulan berjalan atau bulan depan -> boleh dibuat jadwalnya
 *   "future"   lebih jauh -> hanya proyeksi
 */
export function monthPosition(month: string, today: Date = new Date()): "past" | "window" | "future" {
  const now = currentMonth(today);
  if (month < now) return "past";
  if (month <= shiftMonth(now, SCHEDULE_WINDOW_MONTHS - 1)) return "window";
  return "future";
}

/** Apakah jadwal periode dengan status ini masih boleh diubah? (Draf & Terbit) */
export function isPeriodEditable(status: string): boolean {
  return status === SCHEDULE_PERIOD_STATUS.draft || status === SCHEDULE_PERIOD_STATUS.published;
}

/** Apakah ubahan jadwal wajib disertai alasan? (setelah Terbit, karena karyawan sudah melihatnya) */
export function isChangeReasonRequired(status: string): boolean {
  return status === SCHEDULE_PERIOD_STATUS.published;
}
