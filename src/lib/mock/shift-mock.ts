/**
 * DATA CONTOH (MOCK) MASTER SHIFT — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/shifts/**. Setiap fungsi
 * mengembalikan `{ status, body }` (lihat mock-response.ts).
 */
import { isHexColor } from "@/lib/color";
import { isValidTime, shiftDurationMinutes, timeToMinutes } from "@/lib/shift-rules";
import type { ShiftPayload, ShiftResource } from "@/types/api/shift";

import { failure, success, type MockResult } from "./mock-response";
import { createId } from "./organization-store";
import type { ShiftRecord } from "./schedule/shifts";
import { countPatternsUsingShift, getScheduleStore, toShiftResource } from "./schedule-store";

/** Pengganti backend `GET /shifts`. Urut dari jam mulai paling pagi. */
export function mockListShifts(): MockResult<ShiftResource[]> {
  const shifts = [...getScheduleStore().shifts].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
  );
  return success("Daftar shift", shifts.map(toShiftResource));
}

/** Pengganti backend `GET /shifts/{id}`. */
export function mockGetShift(id: string): MockResult<ShiftResource | null> {
  const shift = findShift(id);
  if (!shift) return failure(404, "Shift tidak ditemukan.");

  return success("Detail shift", toShiftResource(shift));
}

/** Pengganti backend `POST /shifts`. */
export function mockCreateShift(payload: ShiftPayload): MockResult<ShiftResource | null> {
  const errors = validateShift(payload, null);
  if (errors) return failure(422, "Isian shift belum benar.", errors);

  const shift: ShiftRecord = { id: createId("shift"), ...cleanPayload(payload) };
  getScheduleStore().shifts.push(shift);

  return success("Shift berhasil ditambahkan.", toShiftResource(shift), 201);
}

/** Pengganti backend `PUT /shifts/{id}`. */
export function mockUpdateShift(id: string, payload: ShiftPayload): MockResult<ShiftResource | null> {
  const shift = findShift(id);
  if (!shift) return failure(404, "Shift tidak ditemukan.");

  const errors = validateShift(payload, id);
  if (errors) return failure(422, "Isian shift belum benar.", errors);

  Object.assign(shift, cleanPayload(payload));

  return success("Shift berhasil diperbarui.", toShiftResource(shift));
}

/** Pengganti backend `DELETE /shifts/{id}`. Shift yang masih dipakai pola kerja tidak boleh dihapus. */
export function mockDeleteShift(id: string): MockResult<null> {
  const store = getScheduleStore();
  const shift = findShift(id);
  if (!shift) return failure(404, "Shift tidak ditemukan.");

  const patternCount = countPatternsUsingShift(id);
  if (patternCount > 0) {
    return failure(
      409,
      `Shift "${shift.name}" masih dipakai di ${patternCount} pola kerja. Ganti shift di pola tersebut terlebih dahulu.`,
    );
  }

  store.shifts = store.shifts.filter((item) => item.id !== id);

  return success("Shift berhasil dihapus.", null);
}

// ---------------------------------------------------------------------------
// Alat bantu
// ---------------------------------------------------------------------------

function findShift(id: string): ShiftRecord | undefined {
  return getScheduleStore().shifts.find((item) => item.id === id);
}

/** Isian form -> bentuk yang disimpan (teks dirapikan, keterangan kosong jadi null). */
function cleanPayload(payload: ShiftPayload): Omit<ShiftRecord, "id"> {
  return {
    code: payload.code.trim().toUpperCase(),
    name: payload.name.trim(),
    start_time: payload.start_time,
    end_time: payload.end_time,
    break_minutes: Number(payload.break_minutes),
    late_tolerance_minutes: Number(payload.late_tolerance_minutes),
    checkin_window_before_minutes: Number(payload.checkin_window_before_minutes),
    checkout_window_after_minutes: Number(payload.checkout_window_after_minutes),
    color: payload.color,
    description: payload.description.trim() || null,
  };
}

/** Bilangan bulat dari 0 sampai `max`? */
function isMinutes(value: unknown, max: number): boolean {
  return Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= max;
}

/**
 * Periksa isian shift. Hasilnya pesan error per isian, atau null kalau semua benar.
 * `currentId` = id shift yang sedang diubah (null saat tambah baru).
 */
function validateShift(payload: ShiftPayload, currentId: string | null): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};
  const others = getScheduleStore().shifts.filter((item) => item.id !== currentId);
  const code = payload.code.trim().toUpperCase();
  const name = payload.name.trim();

  if (!code) errors.code = ["Kode Shift wajib diisi"];
  else if (code.length > 4) errors.code = ["Kode Shift maksimal 4 karakter"];
  // Kode BOLEH sama dengan shift lain (dibedakan lewat warna & nama); nama tetap unik.

  if (!name) errors.name = ["Nama Shift wajib diisi"];
  else if (others.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
    errors.name = [`Shift "${name}" sudah ada`];
  }

  if (!isValidTime(payload.start_time)) errors.start_time = ["Isi Jam Mulai dengan benar (JJ:MM)"];
  if (!isValidTime(payload.end_time)) errors.end_time = ["Isi Jam Selesai dengan benar (JJ:MM)"];
  else if (payload.end_time === payload.start_time) errors.end_time = ["Jam Selesai tidak boleh sama dengan Jam Mulai"];

  if (!isMinutes(payload.break_minutes, 240)) errors.break_minutes = ["Istirahat harus 0–240 menit"];
  else if (
    isValidTime(payload.start_time) &&
    isValidTime(payload.end_time) &&
    Number(payload.break_minutes) >= shiftDurationMinutes(payload.start_time, payload.end_time)
  ) {
    errors.break_minutes = ["Istirahat harus lebih singkat dari lama shift"];
  }
  if (!isMinutes(payload.late_tolerance_minutes, 120)) errors.late_tolerance_minutes = ["Toleransi harus 0–120 menit"];
  if (!isMinutes(payload.checkin_window_before_minutes, 720)) {
    errors.checkin_window_before_minutes = ["Batas scan masuk harus 0–720 menit"];
  }
  if (!isMinutes(payload.checkout_window_after_minutes, 720)) {
    errors.checkout_window_after_minutes = ["Batas scan pulang harus 0–720 menit"];
  }

  if (!isHexColor(payload.color)) errors.color = ["Pilih Warna atau isi kode warna yang benar"];

  return Object.keys(errors).length > 0 ? errors : null;
}
