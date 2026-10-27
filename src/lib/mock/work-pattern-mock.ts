/**
 * DATA CONTOH (MOCK) POLA KERJA — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/work-patterns/**. Satu pola dikirim
 * utuh beserta slot dan isi harinya (lihat WorkPatternPayload).
 */
import { MAX_CYCLE_DAYS, MIN_CYCLE_DAYS } from "@/lib/work-pattern-rules";
import type { WorkPatternPayload, WorkPatternResource } from "@/types/api/work-pattern";

import { failure, success, type MockResult } from "./mock-response";
import { createId } from "./organization-store";
import type { PatternSlotRecord, WorkPatternRecord } from "./schedule/work-patterns";
import { countGroupsUsingPattern, getScheduleStore, toWorkPatternResource } from "./schedule-store";

/** Pengganti backend `GET /work-patterns`. */
export function mockListWorkPatterns(): MockResult<WorkPatternResource[]> {
  return success("Daftar pola kerja", getScheduleStore().workPatterns.map(toWorkPatternResource));
}

/** Pengganti backend `GET /work-patterns/{id}`. */
export function mockGetWorkPattern(id: string): MockResult<WorkPatternResource | null> {
  const pattern = findPattern(id);
  if (!pattern) return failure(404, "Pola kerja tidak ditemukan.");

  return success("Detail pola kerja", toWorkPatternResource(pattern));
}

/** Pengganti backend `POST /work-patterns`. */
export function mockCreateWorkPattern(payload: WorkPatternPayload): MockResult<WorkPatternResource | null> {
  const errors = validatePattern(payload, null);
  if (errors) return failure(422, "Isian pola kerja belum benar.", errors);

  const pattern: WorkPatternRecord = { id: createId("pola"), ...cleanPayload(payload, []) };
  getScheduleStore().workPatterns.push(pattern);

  return success("Pola kerja berhasil ditambahkan.", toWorkPatternResource(pattern), 201);
}

/** Pengganti backend `PUT /work-patterns/{id}`. Slot lama (id sama) dipertahankan id-nya. */
export function mockUpdateWorkPattern(id: string, payload: WorkPatternPayload): MockResult<WorkPatternResource | null> {
  const pattern = findPattern(id);
  if (!pattern) return failure(404, "Pola kerja tidak ditemukan.");

  const errors = validatePattern(payload, id);
  if (errors) return failure(422, "Isian pola kerja belum benar.", errors);

  Object.assign(pattern, cleanPayload(payload, pattern.slots));

  return success("Pola kerja berhasil diperbarui.", toWorkPatternResource(pattern));
}

/** Pengganti backend `DELETE /work-patterns/{id}`. Pola yang dipakai regu kerja tidak boleh dihapus. */
export function mockDeleteWorkPattern(id: string): MockResult<null> {
  const store = getScheduleStore();
  const pattern = findPattern(id);
  if (!pattern) return failure(404, "Pola kerja tidak ditemukan.");

  const groupCount = countGroupsUsingPattern(id);
  if (groupCount > 0) {
    return failure(409, `Pola "${pattern.name}" masih dipakai ${groupCount} regu kerja. Ganti pola regu tersebut terlebih dahulu.`);
  }

  store.workPatterns = store.workPatterns.filter((item) => item.id !== id);

  return success("Pola kerja berhasil dihapus.", null);
}

// ---------------------------------------------------------------------------
// Alat bantu
// ---------------------------------------------------------------------------

function findPattern(id: string): WorkPatternRecord | undefined {
  return getScheduleStore().workPatterns.find((item) => item.id === id);
}

/** Isian form -> bentuk yang disimpan. Slot baru ("baru-...") diberi id tetap. */
function cleanPayload(payload: WorkPatternPayload, previousSlots: PatternSlotRecord[]): Omit<WorkPatternRecord, "id"> {
  return {
    name: payload.name.trim(),
    cycle_days: Number(payload.cycle_days),
    description: payload.description.trim() || null,
    slots: payload.slots.map((slot) => ({
      id: previousSlots.some((old) => old.id === slot.id) ? slot.id : createId("slot"),
      code: slot.code.trim().toUpperCase(),
      name: slot.name.trim() || `Posisi ${slot.code.trim().toUpperCase()}`,
      rotates: Boolean(slot.rotates),
      shift_ids: slot.shift_ids.map((shiftId) => shiftId || null),
    })),
  };
}

/**
 * Periksa isian pola. Error per slot memakai nama isian "slots.<index>.<isian>",
 * mis. "slots.1.code" = kode slot kedua.
 */
function validatePattern(payload: WorkPatternPayload, currentId: string | null): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};
  const { shifts, workPatterns } = getScheduleStore();
  const name = payload.name.trim();
  const cycleDays = Number(payload.cycle_days);

  if (!name) errors.name = ["Nama Pola wajib diisi"];
  else if (workPatterns.some((item) => item.id !== currentId && item.name.toLowerCase() === name.toLowerCase())) {
    errors.name = [`Pola "${name}" sudah ada`];
  }

  if (!Number.isInteger(cycleDays) || cycleDays < MIN_CYCLE_DAYS || cycleDays > MAX_CYCLE_DAYS) {
    errors.cycle_days = [`Panjang Siklus harus ${MIN_CYCLE_DAYS}–${MAX_CYCLE_DAYS} hari`];
  }

  if (!Array.isArray(payload.slots) || payload.slots.length === 0) {
    errors.slots = ["Tambahkan minimal satu slot"];
    return errors;
  }

  const codes = payload.slots.map((slot) => slot.code.trim().toUpperCase());
  payload.slots.forEach((slot, index) => {
    const code = codes[index];
    if (!code) errors[`slots.${index}.code`] = ["Kode slot wajib diisi"];
    else if (codes.indexOf(code) !== index) errors[`slots.${index}.code`] = [`Kode "${code}" dipakai lebih dari sekali`];

    if (!Array.isArray(slot.shift_ids) || slot.shift_ids.length !== cycleDays) {
      errors[`slots.${index}.shift_ids`] = ["Isi shift harus sepanjang siklus"];
    } else if (slot.shift_ids.some((shiftId) => shiftId && !shifts.some((shift) => shift.id === shiftId))) {
      errors[`slots.${index}.shift_ids`] = ["Ada shift yang tidak ditemukan"];
    } else if (slot.shift_ids.every((shiftId) => !shiftId)) {
      errors[`slots.${index}.shift_ids`] = ["Slot ini libur setiap hari; isi minimal satu hari kerja"];
    }
  });

  return Object.keys(errors).length > 0 ? errors : null;
}
