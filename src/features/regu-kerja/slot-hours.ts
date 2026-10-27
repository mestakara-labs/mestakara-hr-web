/**
 * KETERANGAN JAM KERJA SATU SLOT untuk pilihan slot di wizard regu, mis.
 *
 *   slot A: P P P P P L L      -> "P 07.00–12.00 ×5, L ×2"
 *   slot B: S S T T T L P      -> "S 12.00–17.00 ×2, T 10.00–14.00 ×3, P 07.00–12.00 ×1, L ×1"
 *
 * Urutan shift mengikuti kemunculan pertamanya di siklus.
 */
import { formatShiftTime } from "@/lib/shift-rules";
import type { ShiftResource } from "@/types/api/shift";
import type { PatternSlotResource } from "@/types/api/work-pattern";

/** Ringkasan shift satu slot dalam satu siklus. */
export function describeSlotHours(slot: Pick<PatternSlotResource, "shift_ids">, shifts: ShiftResource[]): string {
  // Hitung berapa hari setiap shift muncul (null = libur).
  const counts = new Map<string | null, number>();
  for (const shiftId of slot.shift_ids) counts.set(shiftId, (counts.get(shiftId) ?? 0) + 1);

  const parts = [...counts.entries()]
    .filter(([shiftId]) => shiftId !== null)
    .map(([shiftId, count]) => {
      const shift = shifts.find((item) => item.id === shiftId);
      return shift ? `${shift.code} ${formatShiftTime(shift.start_time, shift.end_time)} ×${count}` : `? ×${count}`;
    });
  const offDays = counts.get(null);
  if (offDays) parts.push(`L ×${offDays}`);

  return parts.join(", ");
}

/** Pilihan slot lengkap dengan jam kerjanya, mis. "A — Posisi A · P 07.00–12.00 ×5, L ×2". */
export function slotOptionsWithHours(slots: PatternSlotResource[], shifts: ShiftResource[]) {
  return slots.map((slot) => ({
    value: slot.id,
    label: `${slot.code} — ${slot.name} · ${describeSlotHours(slot, shifts)}`,
  }));
}
