/**
 * DATA CONTOH (MOCK) BUAT ULANG JADWAL — pengganti backend selama AUTH_MOCK=true.
 *
 *   POST /schedule-periods/{id}/regenerate/preview   hitung perubahannya saja (tidak disimpan)
 *   POST /schedule-periods/{id}/regenerate           terapkan perubahannya
 *
 * Dipakai setelah anggota regu keluar/masuk, pola diubah, dsb. Aturannya:
 *   - hanya tanggal >= from_date di bulan periode itu yang disentuh
 *   - periode Terkunci tidak bisa dibuat ulang
 *   - sel yang diubah manual dipertahankan kalau keep_manual = true (dilaporkan sebagai "bentrok"
 *     kalau berbeda dengan pola baru)
 *   - periode Terbit wajib disertai alasan; setiap sel yang shift-nya berubah dicatat di riwayat
 */
import {
  datesOfMonth,
  isChangeReasonRequired,
  isPeriodEditable,
  SCHEDULE_PERIOD_STATUS,
  SCHEDULE_SOURCE,
} from "@/lib/schedule-period-rules";
import { shiftOnDate } from "@/lib/schedule-rules";
import type {
  RegenerateChange,
  RegeneratePayload,
  RegeneratePreviewResource,
} from "@/types/api/schedule";

import { failure, success, type MockResult } from "./mock-response";
import { createId, getStore } from "./organization-store";
import { plannedTimes, type ScheduleEntryRecord, type SchedulePeriodRecord } from "./schedule-generator";
import { getScheduleStore } from "./schedule-store";

/** Satu langkah rencana buat ulang. */
type PlanStep =
  | { kind: "add"; memberId: string; employeeId: string; date: string; shiftId: string | null; slotCode: string }
  | { kind: "remove"; entry: ScheduleEntryRecord }
  | { kind: "change"; entry: ScheduleEntryRecord; shiftId: string | null; slotCode: string }
  | { kind: "conflict"; entry: ScheduleEntryRecord; shiftId: string | null }
  | { kind: "same" };

/** Pengganti backend `POST /schedule-periods/{id}/regenerate/preview`. */
export function mockPreviewRegenerate(id: string, payload: RegeneratePayload): MockResult<RegeneratePreviewResource | null> {
  const checked = checkRequest(id, payload, false);
  if ("error" in checked) return checked.error;

  return success("Pratinjau buat ulang jadwal", toPreview(payload.from_date, planSteps(checked.period, payload)));
}

/** Pengganti backend `POST /schedule-periods/{id}/regenerate`. Browser memuat ulang detailnya sendiri. */
export function mockRegenerate(id: string, payload: RegeneratePayload, userName: string): MockResult<null> {
  const checked = checkRequest(id, payload, true);
  if ("error" in checked) return checked.error;

  const store = getScheduleStore();
  const { period } = checked;
  const recordChanges = period.status === SCHEDULE_PERIOD_STATUS.published;
  const reason = `Dibuat ulang dari pola${payload.reason.trim() ? `: ${payload.reason.trim()}` : ""}`;
  const shiftOf = (shiftId: string | null) => store.shifts.find((item) => item.id === shiftId);

  for (const step of planSteps(period, payload)) {
    if (step.kind === "add") {
      store.schedules.push({
        id: createId("jadwal"),
        period_id: period.id,
        member_id: step.memberId,
        employee_id: step.employeeId,
        work_date: step.date,
        shift_id: step.shiftId,
        ...plannedTimes(step.date, shiftOf(step.shiftId)),
        slot_code: step.slotCode,
        generated_shift_id: step.shiftId,
        source: SCHEDULE_SOURCE.generator,
      });
    } else if (step.kind === "remove") {
      store.schedules = store.schedules.filter((item) => item.id !== step.entry.id);
    } else if (step.kind === "change") {
      if (recordChanges && step.entry.shift_id !== step.shiftId) {
        store.scheduleChanges.push({
          id: createId("ubah-jadwal"),
          schedule_id: step.entry.id,
          old_shift_id: step.entry.shift_id,
          new_shift_id: step.shiftId,
          reason,
          changed_by: userName,
          changed_at: new Date().toISOString(),
        });
      }
      Object.assign(step.entry, {
        shift_id: step.shiftId,
        ...plannedTimes(step.entry.work_date, shiftOf(step.shiftId)),
        slot_code: step.slotCode,
        generated_shift_id: step.shiftId,
        source: SCHEDULE_SOURCE.generator,
      });
    } else if (step.kind === "conflict") {
      // Ubahan manual dipertahankan; hanya catatan "shift menurut pola" yang diperbarui.
      step.entry.generated_shift_id = step.shiftId;
    }
  }

  return success("Jadwal berhasil dibuat ulang dari pola.", null);
}

/**
 * Berapa sel jadwal yang TIDAK sesuai lagi dengan pola & anggota regu terbaru
 * (baris yang perlu ditambah, dihapus, atau diubah; ubahan manual tidak dihitung).
 * Dipakai untuk peringatan "jadwal perlu dibuat ulang".
 */
export function countOutdatedCells(period: SchedulePeriodRecord): number {
  if (!isPeriodEditable(period.status)) return 0;
  const steps = planSteps(period, { from_date: `${period.month}-01`, keep_manual: true, reason: "" });
  return steps.filter((step) => step.kind === "add" || step.kind === "remove" || step.kind === "change").length;
}

// ---------------------------------------------------------------------------
// Alat bantu
// ---------------------------------------------------------------------------

/** Periksa permintaan: periode ada, masih bisa diubah, tanggal di dalam bulannya, alasan (kalau Terbit). */
function checkRequest(
  id: string,
  payload: RegeneratePayload,
  isApply: boolean,
): { period: SchedulePeriodRecord } | { error: MockResult<null> } {
  const period = getScheduleStore().schedulePeriods.find((item) => item.id === id);
  if (!period) return { error: failure(404, "Periode jadwal tidak ditemukan.") };
  if (!isPeriodEditable(period.status)) return { error: failure(409, "Jadwal yang sudah dikunci tidak bisa dibuat ulang.") };

  const errors: Record<string, string[]> = {};
  if (!datesOfMonth(period.month).includes(payload.from_date)) {
    errors.from_date = ["Pilih tanggal di dalam bulan jadwal ini"];
  }
  if (isApply && isChangeReasonRequired(period.status) && !payload.reason.trim()) {
    errors.reason = ["Alasan wajib diisi karena jadwal sudah diterbitkan"];
  }
  if (Object.keys(errors).length > 0) return { error: failure(422, "Isian belum benar.", errors) };

  return { period };
}

/**
 * Bandingkan jadwal tersimpan dengan hasil rumus rotasi untuk setiap anggota × tanggal >= from_date.
 *   - anggota aktif, belum ada baris         -> add
 *   - ada baris, anggota sudah tidak aktif    -> remove
 *   - baris manual & keep_manual, beda pola   -> conflict (dipertahankan)
 *   - baris berbeda shift/slot dengan pola    -> change
 */
function planSteps(period: SchedulePeriodRecord, payload: RegeneratePayload): PlanStep[] {
  const store = getScheduleStore();
  const group = store.workGroups.find((item) => item.id === period.group_id);
  const pattern = store.workPatterns.find((item) => item.id === group?.work_pattern_id);
  if (!group || !pattern) return [];

  const dates = datesOfMonth(period.month).filter((date) => date >= payload.from_date);
  const members = store.groupMembers.filter((item) => item.group_id === group.id);
  const entries = store.schedules.filter((item) => item.period_id === period.id && item.work_date >= payload.from_date);
  const steps: PlanStep[] = [];

  for (const member of members) {
    for (const date of dates) {
      const expected = shiftOnDate(group, pattern, member, date);
      const entry = entries.find((item) => item.member_id === member.id && item.work_date === date);

      if (!expected) {
        if (entry) steps.push({ kind: "remove", entry });
        continue;
      }
      if (!entry) {
        steps.push({
          kind: "add",
          memberId: member.id,
          employeeId: member.employee_id,
          date,
          shiftId: expected.shiftId,
          slotCode: expected.slot.code,
        });
        continue;
      }
      if (entry.source === SCHEDULE_SOURCE.manual && payload.keep_manual) {
        steps.push(entry.shift_id === expected.shiftId ? { kind: "same" } : { kind: "conflict", entry, shiftId: expected.shiftId });
        continue;
      }
      const isSame =
        entry.shift_id === expected.shiftId && entry.slot_code === expected.slot.code && entry.source === SCHEDULE_SOURCE.generator;
      steps.push(isSame ? { kind: "same" } : { kind: "change", entry, shiftId: expected.shiftId, slotCode: expected.slot.code });
    }
  }

  // Baris milik anggota yang sudah tidak ada di regu sama sekali.
  for (const entry of entries) {
    if (!members.some((member) => member.id === entry.member_id)) steps.push({ kind: "remove", entry });
  }

  return steps;
}

/** Rencana -> ringkasan pratinjau. */
function toPreview(fromDate: string, steps: PlanStep[]): RegeneratePreviewResource {
  const { employees } = getStore();
  const nameOf = (employeeId: string) => employees.find((item) => item.id === employeeId)?.name ?? "-";
  const preview: RegeneratePreviewResource = {
    from_date: fromDate,
    added: [],
    removed: [],
    changed: [],
    conflicts: [],
    unchanged_count: 0,
  };

  for (const step of steps) {
    if (step.kind === "same") {
      preview.unchanged_count++;
      continue;
    }
    const change: RegenerateChange =
      step.kind === "add"
        ? { employee_name: nameOf(step.employeeId), date: step.date, old_shift_id: null, new_shift_id: step.shiftId }
        : {
            employee_name: nameOf(step.entry.employee_id),
            date: step.entry.work_date,
            old_shift_id: step.entry.shift_id,
            new_shift_id: step.kind === "remove" ? null : step.shiftId,
          };
    if (step.kind === "add") preview.added.push(change);
    else if (step.kind === "remove") preview.removed.push(change);
    else if (step.kind === "change") preview.changed.push(change);
    else preview.conflicts.push(change);
  }

  return preview;
}
