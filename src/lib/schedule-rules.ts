/**
 * ATURAN ROTASI & JADWAL — inti pembuatan jadwal kerja. Dipakai browser DAN data mock.
 * Semua fungsi di sini MURNI: hanya menghitung dari data yang diberikan.
 *
 * Istilah:
 *   regu     : punya mode rotasi (Tetap / Bergilir), rotasi tiap N hari, dan Tanggal Mulai Berlaku Jadwal (anchor_date)
 *   pola     : tabel slot × hari siklus (lihat work-pattern-rules.ts)
 *   anggota  : karyawan di regu, dengan slot awal (slot saat bergabung) dan masa aktif
 *
 * Rumus satu anggota pada satu tanggal (lihat slotOnDate & dayIndexOnDate):
 *
 *   selisih_hari      = tanggal − anchor_date
 *   putaran_sekarang  = floor(selisih_hari / rotate_every_days)
 *   putaran_bergabung = floor((start_date − anchor_date) / rotate_every_days)
 *   langkah_maju      = putaran_sekarang − putaran_bergabung
 *   index_slot        = (posisi slot awal + langkah_maju) mod jumlah slot bergilir
 *   day_index         = (selisih_hari mod cycle_days) + 1
 *   shift             = pola[slot][day_index]
 */
import { daysBetween } from "./date";

export const ROTATION_MODE = {
  /** Anggota selalu di slot awalnya */
  fixed: "Tetap",
  /** Anggota maju ke slot berikutnya setiap rotate_every_days */
  rotating: "Bergilir",
} as const;

export const ROTATION_MODES = Object.values(ROTATION_MODE) as string[];

/** Batas "rotasi tiap N hari". */
export const MAX_ROTATE_EVERY_DAYS = 56;

// ---------------------------------------------------------------------------
// Bentuk data minimal yang dibutuhkan rumus (cocok untuk data mock maupun resource API)
// ---------------------------------------------------------------------------

export interface RotationSettings {
  rotation_mode: string;
  rotate_every_days: number;
  /** Tanggal hari ke-1 siklus dan putaran ke-0 regu, "YYYY-MM-DD" */
  anchor_date: string;
}

export interface RotationSlot {
  id: string;
  code: string;
  rotates: boolean;
  /** Shift per hari siklus (null = libur) */
  shift_ids: (string | null)[];
}

export interface RotationPattern {
  cycle_days: number;
  /** Urutan = urutan putaran */
  slots: RotationSlot[];
}

export interface RotationMember {
  id: string;
  employee_id: string;
  /** Slot saat anggota BERGABUNG (pada start_date) */
  start_slot_id: string;
  start_date: string;
  /** null = masih aktif tanpa batas */
  end_date: string | null;
}

/** Sisa bagi yang selalu positif: mod(-1, 4) = 3 (bukan -1 seperti operator %). */
function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/** Apakah anggota aktif di regu pada tanggal ini? */
export function isMemberActiveOn(member: RotationMember, date: string): boolean {
  return member.start_date <= date && (member.end_date === null || date <= member.end_date);
}

/** Hari ke berapa dalam siklus pola pada tanggal ini (1..cycle_days). Sama untuk semua anggota regu. */
export function dayIndexOnDate(rotation: RotationSettings, pattern: RotationPattern, date: string): number {
  const selisihHari = daysBetween(rotation.anchor_date, date);
  return mod(selisihHari, pattern.cycle_days) + 1;
}

/**
 * Slot yang dipegang anggota pada tanggal ini. null = anggota tidak aktif pada tanggal itu.
 *
 *   - mode Tetap, atau slot awalnya tidak ikut bergilir -> selalu slot awal
 *   - mode Bergilir -> maju sebanyak `langkah_maju` di antara slot yang ikut bergilir
 */
export function slotOnDate(
  rotation: RotationSettings,
  pattern: RotationPattern,
  member: RotationMember,
  date: string,
): RotationSlot | null {
  if (!isMemberActiveOn(member, date)) return null;

  const startSlot = pattern.slots.find((slot) => slot.id === member.start_slot_id);
  if (!startSlot) return null;
  if (rotation.rotation_mode !== ROTATION_MODE.rotating || !startSlot.rotates) return startSlot;

  const rotatingSlots = pattern.slots.filter((slot) => slot.rotates);
  const every = rotation.rotate_every_days;

  const selisihHari = daysBetween(rotation.anchor_date, date);
  const putaranSekarang = Math.floor(selisihHari / every);
  const putaranBergabung = Math.floor(daysBetween(rotation.anchor_date, member.start_date) / every);
  const langkahMaju = putaranSekarang - putaranBergabung;

  const indexSlotAwal = rotatingSlots.indexOf(startSlot);
  const indexSlot = mod(indexSlotAwal + langkahMaju, rotatingSlots.length);

  return rotatingSlots[indexSlot];
}

/** Shift satu anggota pada tanggal ini. null = tidak aktif; shift_id null = libur. */
export function shiftOnDate(
  rotation: RotationSettings,
  pattern: RotationPattern,
  member: RotationMember,
  date: string,
): { slot: RotationSlot; dayIndex: number; shiftId: string | null } | null {
  const slot = slotOnDate(rotation, pattern, member, date);
  if (!slot) return null;

  const dayIndex = dayIndexOnDate(rotation, pattern, date);
  return { slot, dayIndex, shiftId: slot.shift_ids[dayIndex - 1] ?? null };
}

/** Slot yang KOSONG (tidak dipegang anggota aktif mana pun) pada tanggal ini, beserta shiftnya hari itu. */
export function findVacancies(
  rotation: RotationSettings,
  pattern: RotationPattern,
  members: RotationMember[],
  date: string,
): { slot: RotationSlot; shiftId: string | null }[] {
  const occupiedIds = new Set(
    members.map((member) => slotOnDate(rotation, pattern, member, date)?.id).filter((id) => id !== undefined),
  );
  const dayIndex = dayIndexOnDate(rotation, pattern, date);

  return pattern.slots
    .filter((slot) => !occupiedIds.has(slot.id))
    .map((slot) => ({ slot, shiftId: slot.shift_ids[dayIndex - 1] ?? null }));
}

/** Saran slot awal untuk anggota yang bergabung pada tanggal ini: slot kosong pertama, atau null. */
export function suggestStartSlot(
  rotation: RotationSettings,
  pattern: RotationPattern,
  members: RotationMember[],
  date: string,
): RotationSlot | null {
  return findVacancies(rotation, pattern, members, date)[0]?.slot ?? null;
}

/**
 * Apakah slot ini hanya boleh dipegang SATU orang? Ya untuk slot yang ikut bergilir di regu Bergilir
 * (kalau dua orang, keduanya bergerak bersama dan ada slot lain yang kosong).
 * Slot tetap / regu Tetap boleh dipegang beberapa orang (mis. pola Reguler Kantor).
 */
export function isSingleHolderSlot(rotation: RotationSettings, slot: RotationSlot): boolean {
  return rotation.rotation_mode === ROTATION_MODE.rotating && slot.rotates;
}
