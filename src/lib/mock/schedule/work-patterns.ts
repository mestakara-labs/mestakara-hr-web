/**
 * POLA KERJA CONTOH (data awal mock).
 *
 * Singkatan di komentar: P = Pagi, T = Tengah, S = Sore, R = Reguler,
 * P24/S24/M = shift 24 jam, L = libur. Pola contoh 7 hari disusun dengan anggapan hari ke-1 = Senin
 * (regu contoh mulai berlaku hari Senin).
 */
import { SHIFT_IDS } from "./shifts";

/** Slot pola seperti yang DISIMPAN (isi hari di backend = tabel PATTERN_SLOT_DAYS). */
export interface PatternSlotRecord {
  id: string;
  code: string;
  name: string;
  rotates: boolean;
  shift_ids: (string | null)[];
}

/** Pola kerja seperti yang DISIMPAN. Urutan `slots` = urutan putaran. */
export interface WorkPatternRecord {
  id: string;
  name: string;
  cycle_days: number;
  description: string | null;
  slots: PatternSlotRecord[];
}

const { pagi: P, tengah: T, sore: S, pagi24: P24, sore24: S24, malam: M, reguler: R } = SHIFT_IDS;
const L = null;

/** Id pola contoh, supaya regu kerja contoh bisa merujuknya. */
export const PATTERN_IDS = {
  reguler: "pola-reguler-kantor",
  tigaShiftTengah: "pola-tiga-shift-tengah",
  duaShift: "pola-dua-shift",
  duaPuluhEmpatJam: "pola-24-jam",
};

export const mockWorkPatterns: WorkPatternRecord[] = [
  {
    id: PATTERN_IDS.reguler,
    name: "Reguler Kantor",
    cycle_days: 7,
    description: "Senin–Jumat 07.30–16.00, Sabtu–Minggu libur.",
    slots: [{ id: "slot-reguler", code: "K", name: "Kantor", rotates: false, shift_ids: [R, R, R, R, R, L, L] }],
  },
  {
    id: PATTERN_IDS.tigaShiftTengah,
    name: "07–17 Tiga Shift + Tengah (4 orang)",
    cycle_days: 7,
    description:
      "Senin–Jumat setiap shift 1 orang dan 1 orang libur bergantian; Sabtu–Minggu keempatnya masuk (orang ke-4 di shift Pagi).",
    slots: [
      { id: "slot-tst-a", code: "A", name: "Posisi A", rotates: true, shift_ids: [P, P, P, P, L, P, P] },
      { id: "slot-tst-b", code: "B", name: "Posisi B", rotates: true, shift_ids: [T, T, T, L, T, T, T] },
      { id: "slot-tst-c", code: "C", name: "Posisi C", rotates: true, shift_ids: [S, S, L, S, S, S, S] },
      { id: "slot-tst-d", code: "D", name: "Posisi D (pengganti)", rotates: true, shift_ids: [L, L, S, T, P, P, P] },
    ],
  },
  {
    id: PATTERN_IDS.duaShift,
    name: "07–17 Dua Shift (2 orang)",
    cycle_days: 7,
    description: "Senin–Sabtu 07.00–12.00 & 12.00–17.00, Minggu libur.",
    slots: [
      { id: "slot-ds-a", code: "A", name: "Posisi A", rotates: true, shift_ids: [P, P, P, S, S, S, L] },
      { id: "slot-ds-b", code: "B", name: "Posisi B", rotates: true, shift_ids: [S, S, S, P, P, P, L] },
    ],
  },
  {
    id: PATTERN_IDS.duaPuluhEmpatJam,
    name: "24 Jam Tiga Shift (4 orang)",
    cycle_days: 8,
    description: "Setiap orang 2 hari Pagi, 2 hari Sore, 2 hari Malam, lalu 2 hari libur. Setiap hari ketiga shift terisi.",
    slots: [
      { id: "slot-24-a", code: "A", name: "Posisi A", rotates: false, shift_ids: [P24, P24, S24, S24, M, M, L, L] },
      { id: "slot-24-b", code: "B", name: "Posisi B", rotates: false, shift_ids: [L, L, P24, P24, S24, S24, M, M] },
      { id: "slot-24-c", code: "C", name: "Posisi C", rotates: false, shift_ids: [M, M, L, L, P24, P24, S24, S24] },
      { id: "slot-24-d", code: "D", name: "Posisi D", rotates: false, shift_ids: [S24, S24, M, M, L, L, P24, P24] },
    ],
  },
];
