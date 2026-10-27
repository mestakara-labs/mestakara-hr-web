/**
 * SHIFT CONTOH (data awal mock).
 *
 * Dipakai oleh pola kerja contoh:
 *   - 07–17 tiga shift + tengah : Pagi, Tengah, Sore
 *   - 07–17 dua shift           : Pagi, Sore
 *   - 24 jam tiga shift         : Pagi 24 Jam, Sore 24 Jam, Malam
 *   - kantor                    : Reguler Kantor
 */

/** Shift seperti yang DISIMPAN. Isian yang dihitung (lama shift, dll.) ditambahkan saat dibaca. */
export interface ShiftRecord {
  id: string;
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  late_tolerance_minutes: number;
  checkin_window_before_minutes: number;
  checkout_window_after_minutes: number;
  /** HEX, mis. "#1BAA4E" */
  color: string;
  description: string | null;
}

/** Id shift contoh, supaya pola kerja contoh bisa merujuknya. */
export const SHIFT_IDS = {
  pagi: "shift-pagi",
  tengah: "shift-tengah",
  sore: "shift-sore",
  pagi24: "shift-pagi-24",
  sore24: "shift-sore-24",
  malam: "shift-malam",
  reguler: "shift-reguler",
};

/** Isian yang sama untuk semua shift contoh. */
const COMMON = {
  late_tolerance_minutes: 10,
  checkin_window_before_minutes: 120,
  checkout_window_after_minutes: 240,
  description: null,
};

export const mockShifts: ShiftRecord[] = [
  { ...COMMON, id: SHIFT_IDS.pagi, code: "P", name: "Pagi", start_time: "07:00", end_time: "12:00", break_minutes: 0, color: "#1BAA4E" },
  { ...COMMON, id: SHIFT_IDS.tengah, code: "T", name: "Tengah", start_time: "10:00", end_time: "14:00", break_minutes: 0, color: "#5BB3E4" },
  { ...COMMON, id: SHIFT_IDS.sore, code: "S", name: "Sore", start_time: "12:00", end_time: "17:00", break_minutes: 0, color: "#F58A2B" },
  { ...COMMON, id: SHIFT_IDS.pagi24, code: "P24", name: "Pagi (24 Jam)", start_time: "06:00", end_time: "14:00", break_minutes: 30, color: "#5EC384" },
  { ...COMMON, id: SHIFT_IDS.sore24, code: "S24", name: "Sore (24 Jam)", start_time: "14:00", end_time: "22:00", break_minutes: 30, color: "#C9A23A" },
  {
    ...COMMON,
    id: SHIFT_IDS.malam,
    code: "M",
    name: "Malam (24 Jam)",
    start_time: "22:00",
    end_time: "06:00",
    break_minutes: 30,
    color: "#363A96",
    description: "Selesai keesokan harinya. Absensi dicatat pada tanggal mulai shift.",
  },
  {
    ...COMMON,
    id: SHIFT_IDS.reguler,
    code: "R",
    name: "Reguler Kantor",
    start_time: "07:30",
    end_time: "16:00",
    break_minutes: 60,
    color: "#C5C0B4",
    description: "Jam kerja kantor, Senin–Jumat.",
  },
];
