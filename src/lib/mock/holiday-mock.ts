/**
 * DATA CONTOH (MOCK) MASTER HARI LIBUR — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/holidays/**. Setiap fungsi
 * mengembalikan `{ status, body }` (lihat mock-response.ts).
 */
import { HOLIDAY_TYPE_OPTIONS } from "@/lib/holiday-rules";
import type { HolidayPayload, HolidayResource } from "@/types/api/holiday";

import { failure, success, type MockResult } from "./mock-response";
import { createId } from "./organization-store";
import type { HolidayRecord } from "./schedule/holidays";
import { getScheduleStore, toHolidayResource } from "./schedule-store";

/** Pengganti backend `GET /holidays`. Urut dari tanggal paling awal. */
export function mockListHolidays(): MockResult<HolidayResource[]> {
  const holidays = [...getScheduleStore().holidays].sort((a, b) => a.date.localeCompare(b.date));
  return success("Daftar hari libur", holidays.map(toHolidayResource));
}

/** Pengganti backend `GET /holidays/{id}`. */
export function mockGetHoliday(id: string): MockResult<HolidayResource | null> {
  const holiday = findHoliday(id);
  if (!holiday) return failure(404, "Hari libur tidak ditemukan.");

  return success("Detail hari libur", toHolidayResource(holiday));
}

/** Pengganti backend `POST /holidays`. */
export function mockCreateHoliday(payload: HolidayPayload): MockResult<HolidayResource | null> {
  const errors = validateHoliday(payload, null);
  if (errors) return failure(422, "Isian hari libur belum benar.", errors);

  const holiday: HolidayRecord = { id: createId("libur"), ...cleanPayload(payload) };
  getScheduleStore().holidays.push(holiday);

  return success("Hari libur berhasil ditambahkan.", toHolidayResource(holiday), 201);
}

/** Pengganti backend `PUT /holidays/{id}`. */
export function mockUpdateHoliday(id: string, payload: HolidayPayload): MockResult<HolidayResource | null> {
  const holiday = findHoliday(id);
  if (!holiday) return failure(404, "Hari libur tidak ditemukan.");

  const errors = validateHoliday(payload, id);
  if (errors) return failure(422, "Isian hari libur belum benar.", errors);

  Object.assign(holiday, cleanPayload(payload));

  return success("Hari libur berhasil diperbarui.", toHolidayResource(holiday));
}

/** Pengganti backend `DELETE /holidays/{id}`. Hari libur hanya penanda, jadi selalu boleh dihapus. */
export function mockDeleteHoliday(id: string): MockResult<null> {
  const store = getScheduleStore();
  if (!findHoliday(id)) return failure(404, "Hari libur tidak ditemukan.");

  store.holidays = store.holidays.filter((item) => item.id !== id);

  return success("Hari libur berhasil dihapus.", null);
}

// ---------------------------------------------------------------------------
// Alat bantu
// ---------------------------------------------------------------------------

function findHoliday(id: string): HolidayRecord | undefined {
  return getScheduleStore().holidays.find((item) => item.id === id);
}

function cleanPayload(payload: HolidayPayload): Omit<HolidayRecord, "id"> {
  return {
    date: payload.date,
    name: payload.name.trim(),
    type: payload.type,
    description: payload.description.trim() || null,
  };
}

/** Periksa isian hari libur. Satu tanggal hanya boleh punya satu hari libur. */
function validateHoliday(payload: HolidayPayload, currentId: string | null): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};

  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    errors.date = ["Pilih Tanggal"];
  } else {
    const sameDate = getScheduleStore().holidays.find((item) => item.id !== currentId && item.date === payload.date);
    if (sameDate) errors.date = [`Tanggal ini sudah tercatat sebagai "${sameDate.name}"`];
  }

  if (!payload.name.trim()) errors.name = ["Nama Hari Libur wajib diisi"];
  if (!HOLIDAY_TYPE_OPTIONS.includes(payload.type)) errors.type = ["Pilih Jenis"];

  return Object.keys(errors).length > 0 ? errors : null;
}
