/**
 * ISIAN FORM POLA KERJA: bentuk datanya, isian awal, slot baru, dan cara mengirimnya.
 * Dipisah dari file tampilan supaya PolaKerjaForm.tsx dan PatternSlotEditor.tsx tetap pendek.
 */
import { requireText } from "@/lib/validation";
import { MAX_CYCLE_DAYS, MIN_CYCLE_DAYS, resizeShiftIds } from "@/lib/work-pattern-rules";
import type { PatternSlotPayload, WorkPatternPayload, WorkPatternResource } from "@/types/api/work-pattern";

/** Isian form. Panjang siklus disimpan sebagai teks selama diketik. */
export interface PolaFormValues {
  name: string;
  cycle_days: string;
  description: string;
  slots: PatternSlotPayload[];
}

const SLOT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DEFAULT_CYCLE_DAYS = 7;

/** Id sementara slot BARU, mis. "baru-1a2b3c4d". Server menggantinya dengan id tetap. */
function newSlotId(): string {
  return `baru-${crypto.randomUUID().slice(0, 8)}`;
}

/** Kode slot berikutnya yang belum dipakai: A, B, C, ... */
export function nextSlotCode(slots: PatternSlotPayload[]): string {
  const used = slots.map((slot) => slot.code.toUpperCase());
  return SLOT_LETTERS.split("").find((letter) => !used.includes(letter)) ?? "";
}

/** Slot baru: libur setiap hari, ikut bergilir. */
export function newSlot(slots: PatternSlotPayload[], cycleDays: number): PatternSlotPayload {
  const code = nextSlotCode(slots);
  return { id: newSlotId(), code, name: `Posisi ${code}`, rotates: true, shift_ids: resizeShiftIds([], cycleDays) };
}

/** Panjang siklus yang sah dari isian teks, atau null kalau belum benar. */
export function parseCycleDays(text: string): number | null {
  const value = Number(text);
  return Number.isInteger(value) && value >= MIN_CYCLE_DAYS && value <= MAX_CYCLE_DAYS ? value : null;
}

/** Isian awal: pola kosong (1 slot, 7 hari) atau data lama untuk edit. */
export function initialValues(pattern?: WorkPatternResource): PolaFormValues {
  if (pattern) {
    return {
      name: pattern.name,
      cycle_days: String(pattern.cycle_days),
      description: pattern.description ?? "",
      slots: pattern.slots.map((slot) => ({ ...slot, shift_ids: [...slot.shift_ids] })),
    };
  }

  return { name: "", cycle_days: String(DEFAULT_CYCLE_DAYS), description: "", slots: [newSlot([], DEFAULT_CYCLE_DAYS)] };
}

/** Pemeriksaan di browser (aturan lengkapnya diperiksa lagi oleh server). */
export function validatePolaForm(form: PolaFormValues) {
  return {
    name: requireText(form.name, "Nama Pola"),
    cycle_days:
      parseCycleDays(form.cycle_days) === null
        ? `Panjang Siklus harus ${MIN_CYCLE_DAYS}–${MAX_CYCLE_DAYS} hari`
        : undefined,
    slots: form.slots.length === 0 ? "Tambahkan minimal satu slot" : undefined,
  };
}

/** Isian form -> data yang dikirim ke /api/work-patterns. */
export function toPayload(form: PolaFormValues): WorkPatternPayload {
  return { ...form, cycle_days: Number(form.cycle_days) };
}
