/**
 * DATA CONTOH (MOCK) PERIODE JADWAL & JADWAL — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler:
 *   GET/POST   /schedule-periods                 daftar (?group_id=&month=) / buat jadwal (Draf) satu regu satu bulan
 *   GET/DELETE /schedule-periods/{id}            detail (+ semua baris jadwal & shift kosong) / hapus Draf
 *   POST       /schedule-periods/{id}/publish    Draf -> Terbit
 *   POST       /schedule-periods/{id}/lock       Terbit -> Terkunci
 *   PUT        /schedules/{id}                   ubah satu sel (alasan wajib kalau sudah Terbit)
 *   GET        /schedules/{id}/changes           riwayat perubahan satu sel
 */
import {
  datesOfMonth,
  formatMonth,
  isChangeReasonRequired,
  isPeriodEditable,
  monthPosition,
  SCHEDULE_PERIOD_STATUS,
  SCHEDULE_SOURCE,
} from "@/lib/schedule-period-rules";
import type {
  CreateSchedulePeriodPayload,
  ScheduleChangeResource,
  ScheduleEntryResource,
  SchedulePeriodDetailResource,
  SchedulePeriodResource,
  UpdateSchedulePayload,
} from "@/types/api/schedule";

import { failure, success, type MockResult } from "./mock-response";
import { createId, getStore } from "./organization-store";
import {
  buildEntries,
  computeVacancies,
  plannedTimes,
  type ScheduleEntryRecord,
  type SchedulePeriodRecord,
} from "./schedule-generator";
import { countOutdatedCells } from "./schedule-regenerate-mock";
import { getScheduleStore } from "./schedule-store";

// ---------------------------------------------------------------------------
// Periode
// ---------------------------------------------------------------------------

/** Pengganti backend `GET /schedule-periods?group_id=&month=`. Filter boleh dikosongkan. */
export function mockListSchedulePeriods(groupId: string | null, month: string | null): MockResult<SchedulePeriodResource[]> {
  const periods = getScheduleStore()
    .schedulePeriods.filter((item) => (!groupId || item.group_id === groupId) && (!month || item.month === month))
    .sort((a, b) => b.month.localeCompare(a.month));

  return success("Daftar periode jadwal", periods.map(toPeriodResource));
}

/** Pengganti backend `GET /schedule-periods/{id}`. */
export function mockGetSchedulePeriod(id: string): MockResult<SchedulePeriodDetailResource | null> {
  const period = findPeriod(id);
  if (!period) return failure(404, "Periode jadwal tidak ditemukan.");

  return success("Detail periode jadwal", toPeriodDetail(period));
}

/**
 * Pengganti backend `POST /schedule-periods`: BUAT JADWAL (Draf) satu regu untuk satu bulan.
 * Hanya untuk bulan di dalam jendela (bulan berjalan & bulan depan), dan belum pernah dibuat.
 */
export function mockCreateSchedulePeriod(
  payload: CreateSchedulePeriodPayload,
  userName: string,
): MockResult<SchedulePeriodDetailResource | null> {
  const store = getScheduleStore();
  const group = store.workGroups.find((item) => item.id === payload.group_id);
  if (!group) return failure(422, "Isian belum benar.", { group_id: ["Pilih Regu Kerja"] });
  if (!/^\d{4}-\d{2}$/.test(payload.month)) return failure(422, "Isian belum benar.", { month: ["Pilih Bulan"] });

  const position = monthPosition(payload.month);
  if (position !== "window") {
    return failure(
      409,
      position === "past"
        ? `${formatMonth(payload.month)} sudah lewat; jadwalnya tidak bisa dibuat lagi.`
        : `${formatMonth(payload.month)} masih terlalu jauh. Jadwal hanya bisa dibuat untuk bulan berjalan dan bulan depan.`,
    );
  }
  if (store.schedulePeriods.some((item) => item.group_id === group.id && item.month === payload.month)) {
    return failure(409, `Jadwal ${group.name} untuk ${formatMonth(payload.month)} sudah ada.`);
  }

  const pattern = store.workPatterns.find((item) => item.id === group.work_pattern_id);
  if (!pattern) return failure(409, "Pola kerja regu ini tidak ditemukan.");

  const period: SchedulePeriodRecord = {
    id: createId("periode"),
    group_id: group.id,
    month: payload.month,
    status: SCHEDULE_PERIOD_STATUS.draft,
    generated_at: new Date().toISOString(),
    generated_by: userName,
    published_at: null,
    published_by: null,
    locked_at: null,
    locked_by: null,
  };
  const members = store.groupMembers.filter((item) => item.group_id === group.id);
  store.schedulePeriods.push(period);
  store.schedules.push(...buildEntries(period.id, group, pattern, members, store.shifts, datesOfMonth(payload.month), createId));

  return success(`Jadwal ${formatMonth(payload.month)} berhasil dibuat (Draf).`, toPeriodDetail(period), 201);
}

/** Pengganti backend `DELETE /schedule-periods/{id}`. Hanya Draf; semua barisnya ikut dihapus. */
export function mockDeleteSchedulePeriod(id: string): MockResult<null> {
  const store = getScheduleStore();
  const period = findPeriod(id);
  if (!period) return failure(404, "Periode jadwal tidak ditemukan.");
  if (period.status !== SCHEDULE_PERIOD_STATUS.draft) {
    return failure(409, "Hanya jadwal berstatus Draf yang bisa dihapus.");
  }

  const entryIds = new Set(store.schedules.filter((item) => item.period_id === id).map((item) => item.id));
  store.schedules = store.schedules.filter((item) => item.period_id !== id);
  store.scheduleChanges = store.scheduleChanges.filter((item) => !entryIds.has(item.schedule_id));
  store.schedulePeriods = store.schedulePeriods.filter((item) => item.id !== id);

  return success("Draf jadwal berhasil dihapus.", null);
}

/** Pengganti backend `POST /schedule-periods/{id}/publish`: Draf -> Terbit. */
export function mockPublishSchedulePeriod(id: string, userName: string): MockResult<SchedulePeriodDetailResource | null> {
  const period = findPeriod(id);
  if (!period) return failure(404, "Periode jadwal tidak ditemukan.");
  if (period.status !== SCHEDULE_PERIOD_STATUS.draft) return failure(409, "Hanya jadwal Draf yang bisa diterbitkan.");

  period.status = SCHEDULE_PERIOD_STATUS.published;
  period.published_at = new Date().toISOString();
  period.published_by = userName;

  return success("Jadwal berhasil diterbitkan.", toPeriodDetail(period));
}

/** Pengganti backend `POST /schedule-periods/{id}/lock`: Terbit -> Terkunci (setelah rekap ditutup). */
export function mockLockSchedulePeriod(id: string, userName: string): MockResult<SchedulePeriodDetailResource | null> {
  const period = findPeriod(id);
  if (!period) return failure(404, "Periode jadwal tidak ditemukan.");
  if (period.status !== SCHEDULE_PERIOD_STATUS.published) return failure(409, "Hanya jadwal Terbit yang bisa dikunci.");

  period.status = SCHEDULE_PERIOD_STATUS.locked;
  period.locked_at = new Date().toISOString();
  period.locked_by = userName;

  return success("Jadwal berhasil dikunci.", toPeriodDetail(period));
}

// ---------------------------------------------------------------------------
// Satu sel jadwal
// ---------------------------------------------------------------------------

/**
 * Pengganti backend `PUT /schedules/{id}`: ubah shift satu sel ("" = libur).
 *   - periode Terkunci tidak bisa diubah
 *   - periode Terbit wajib disertai alasan
 *   - setiap ubahan dicatat di riwayat; sel yang kembali sama dengan pola menjadi "Generator" lagi
 */
export function mockUpdateSchedule(
  id: string,
  payload: UpdateSchedulePayload,
  userName: string,
): MockResult<ScheduleEntryResource | null> {
  const store = getScheduleStore();
  const entry = store.schedules.find((item) => item.id === id);
  if (!entry) return failure(404, "Jadwal tidak ditemukan.");

  const period = findPeriod(entry.period_id);
  if (!period || !isPeriodEditable(period.status)) {
    return failure(409, "Jadwal periode ini sudah dikunci dan tidak bisa diubah.");
  }

  const newShiftId = payload.shift_id || null;
  const shift = store.shifts.find((item) => item.id === newShiftId);
  const reason = (payload.reason ?? "").trim();
  const errors: Record<string, string[]> = {};
  if (newShiftId && !shift) errors.shift_id = ["Shift tidak ditemukan"];
  if (isChangeReasonRequired(period.status) && !reason) {
    errors.reason = ["Alasan wajib diisi karena jadwal sudah diterbitkan"];
  }
  if (Object.keys(errors).length > 0) return failure(422, "Isian belum benar.", errors);
  if (newShiftId === entry.shift_id) return failure(422, "Isian belum benar.", { shift_id: ["Pilih shift yang berbeda"] });

  store.scheduleChanges.push({
    id: createId("ubah-jadwal"),
    schedule_id: entry.id,
    old_shift_id: entry.shift_id,
    new_shift_id: newShiftId,
    reason: reason || null,
    changed_by: userName,
    changed_at: new Date().toISOString(),
  });

  Object.assign(entry, {
    shift_id: newShiftId,
    ...plannedTimes(entry.work_date, shift),
    source: newShiftId === entry.generated_shift_id ? SCHEDULE_SOURCE.generator : SCHEDULE_SOURCE.manual,
  });

  return success("Jadwal berhasil diubah.", toEntryResource(entry));
}

/** Pengganti backend `GET /schedules/{id}/changes`. Terbaru di atas. */
export function mockListScheduleChanges(id: string): MockResult<ScheduleChangeResource[] | null> {
  const store = getScheduleStore();
  if (!store.schedules.some((item) => item.id === id)) return failure(404, "Jadwal tidak ditemukan.");

  const changes = store.scheduleChanges
    .filter((item) => item.schedule_id === id)
    .sort((a, b) => b.changed_at.localeCompare(a.changed_at))
    .map((item) => ({
      id: item.id,
      old_shift_id: item.old_shift_id,
      new_shift_id: item.new_shift_id,
      reason: item.reason,
      changed_by: item.changed_by,
      changed_at: item.changed_at,
    }));

  return success("Riwayat perubahan jadwal", changes);
}

// ---------------------------------------------------------------------------
// Alat bantu: record -> resource
// ---------------------------------------------------------------------------

function findPeriod(id: string): SchedulePeriodRecord | undefined {
  return getScheduleStore().schedulePeriods.find((item) => item.id === id);
}

function entriesOf(periodId: string): ScheduleEntryRecord[] {
  return getScheduleStore().schedules.filter((item) => item.period_id === periodId);
}

/** Shift kosong satu periode (lihat computeVacancies). */
function vacanciesOf(period: SchedulePeriodRecord) {
  const { workGroups, workPatterns } = getScheduleStore();
  const group = workGroups.find((item) => item.id === period.group_id);
  const pattern = workPatterns.find((item) => item.id === group?.work_pattern_id);
  if (!group || !pattern) return [];

  return computeVacancies(group, pattern, entriesOf(period.id), datesOfMonth(period.month));
}

function toPeriodResource(period: SchedulePeriodRecord): SchedulePeriodResource {
  const group = getScheduleStore().workGroups.find((item) => item.id === period.group_id);

  return {
    id: period.id,
    group: { id: period.group_id, name: group?.name ?? "-" },
    month: period.month,
    status: period.status,
    generated_at: period.generated_at,
    generated_by: period.generated_by,
    published_at: period.published_at,
    published_by: period.published_by,
    locked_at: period.locked_at,
    locked_by: period.locked_by,
    manual_count: entriesOf(period.id).filter((item) => item.source === SCHEDULE_SOURCE.manual).length,
    vacancy_days: new Set(vacanciesOf(period).map((item) => item.date)).size,
    outdated_count: countOutdatedCells(period),
  };
}

function toPeriodDetail(period: SchedulePeriodRecord): SchedulePeriodDetailResource {
  return {
    ...toPeriodResource(period),
    dates: datesOfMonth(period.month),
    entries: entriesOf(period.id).map(toEntryResource),
    vacancies: vacanciesOf(period),
  };
}

function toEntryResource(entry: ScheduleEntryRecord): ScheduleEntryResource {
  const employee = getStore().employees.find((item) => item.id === entry.employee_id);

  return {
    id: entry.id,
    employee: { id: entry.employee_id, name: employee?.name ?? "-" },
    member_id: entry.member_id,
    work_date: entry.work_date,
    shift_id: entry.shift_id,
    planned_start: entry.planned_start,
    planned_end: entry.planned_end,
    slot_code: entry.slot_code,
    generated_shift_id: entry.generated_shift_id,
    source: entry.source,
    change_count: getScheduleStore().scheduleChanges.filter((item) => item.schedule_id === entry.id).length,
  };
}
