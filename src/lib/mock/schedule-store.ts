/**
 * TEMPAT PENYIMPANAN DATA MOCK SHIFT & JADWAL di memori server:
 * shift, hari libur, pola kerja, regu kerja & anggotanya, periode jadwal, jadwal, dan riwayat perubahannya.
 *
 * Dipisah dari organization-store.ts supaya masing-masing file tetap pendek.
 * Data karyawan, sub unit, dan objek tetap dibaca dari organization-store.ts
 * (di sini hanya disimpan id-nya).
 *
 * Catatan: datanya kembali ke isi awal setiap kali server Next di-restart.
 */
import { toDateText } from "@/lib/date";
import { datesOfMonth, SCHEDULE_PERIOD_STATUS } from "@/lib/schedule-period-rules";
import { isMemberActiveOn, slotOnDate } from "@/lib/schedule-rules";
import { crossesMidnight, shiftDurationMinutes } from "@/lib/shift-rules";
import type { HolidayResource } from "@/types/api/holiday";
import type { ShiftResource } from "@/types/api/shift";
import type { GroupMemberResource, WorkGroupResource } from "@/types/api/work-group";
import type { WorkPatternResource } from "@/types/api/work-pattern";

import { mockHolidays, type HolidayRecord } from "./schedule/holidays";
import { mockShifts, type ShiftRecord } from "./schedule/shifts";
import {
  mockGroupMembers,
  mockWorkGroups,
  type GroupMemberRecord,
  type WorkGroupRecord,
} from "./schedule/work-groups";
import { mockWorkPatterns, type WorkPatternRecord } from "./schedule/work-patterns";
import { createId, getStore } from "./organization-store";
import {
  buildEntries,
  type ScheduleChangeRecord,
  type ScheduleEntryRecord,
  type SchedulePeriodRecord,
} from "./schedule-generator";

/**
 * Versi BENTUK data mock jadwal. Naikkan angka ini setiap kali bentuk data diubah
 * (atau untuk membersihkan data uji), supaya data lama dibuang dan diisi ulang otomatis.
 */
const SCHEDULE_STORE_VERSION = 14;

interface ScheduleStore {
  version: number;
  shifts: ShiftRecord[];
  holidays: HolidayRecord[];
  workPatterns: WorkPatternRecord[];
  workGroups: WorkGroupRecord[];
  groupMembers: GroupMemberRecord[];
  schedulePeriods: SchedulePeriodRecord[];
  schedules: ScheduleEntryRecord[];
  scheduleChanges: ScheduleChangeRecord[];
}

/** Disimpan di `globalThis` supaya sama untuk semua route handler (lihat organization-store.ts). */
const globalForMock = globalThis as typeof globalThis & {
  mockScheduleStore?: ScheduleStore;
};

/** Ambil tempat penyimpanan. Diisi data awal saat pertama kali dipanggil, atau saat versinya berubah. */
export function getScheduleStore(): ScheduleStore {
  const currentStore = globalForMock.mockScheduleStore;
  if (currentStore && currentStore.version === SCHEDULE_STORE_VERSION) return currentStore;

  const freshStore: ScheduleStore = {
    version: SCHEDULE_STORE_VERSION,
    shifts: structuredClone(mockShifts),
    holidays: structuredClone(mockHolidays),
    workPatterns: structuredClone(mockWorkPatterns),
    workGroups: structuredClone(mockWorkGroups),
    groupMembers: structuredClone(mockGroupMembers),
    schedulePeriods: [],
    schedules: [],
    scheduleChanges: [],
  };
  addSeedSchedules(freshStore);
  globalForMock.mockScheduleStore = freshStore;

  return freshStore;
}

/**
 * Jadwal contoh untuk setiap regu: Oktober 2026 sudah TERBIT, November 2026 masih DRAF.
 * Dibuat dengan generator yang sama seperti tombol "Buat Jadwal".
 */
function addSeedSchedules(store: ScheduleStore) {
  const seeds = [
    { month: "2026-10", status: SCHEDULE_PERIOD_STATUS.published, published_at: "2026-09-25T03:00:00.000Z" },
    { month: "2026-11", status: SCHEDULE_PERIOD_STATUS.draft, published_at: null },
  ];

  for (const group of store.workGroups) {
    const pattern = store.workPatterns.find((item) => item.id === group.work_pattern_id);
    if (!pattern) continue;
    const members = store.groupMembers.filter((item) => item.group_id === group.id);

    for (const seed of seeds) {
      const period: SchedulePeriodRecord = {
        id: `periode-${group.id}-${seed.month}`,
        group_id: group.id,
        month: seed.month,
        status: seed.status,
        generated_at: "2026-09-20T02:00:00.000Z",
        generated_by: "Sistem (otomatis)",
        published_at: seed.published_at,
        published_by: seed.published_at ? "Admin SDM" : null,
        locked_at: null,
        locked_by: null,
      };
      store.schedulePeriods.push(period);
      store.schedules.push(
        ...buildEntries(period.id, group, pattern, members, store.shifts, datesOfMonth(seed.month), createId),
      );
    }
  }
}

/** Shift siap dikirim ke browser: ditambah lama shift, jam kerja bersih, dan jumlah pola pemakainya. */
export function toShiftResource(shift: ShiftRecord): ShiftResource {
  const duration = shiftDurationMinutes(shift.start_time, shift.end_time);

  return {
    ...shift,
    crosses_midnight: crossesMidnight(shift.start_time, shift.end_time),
    duration_minutes: duration,
    work_minutes: duration - shift.break_minutes,
    pattern_count: countPatternsUsingShift(shift.id),
  };
}

/** Hari libur siap dikirim ke browser. */
export function toHolidayResource(holiday: HolidayRecord): HolidayResource {
  return { ...holiday };
}

/** Pola kerja siap dikirim ke browser: ditambah jumlah regu pemakainya. */
export function toWorkPatternResource(pattern: WorkPatternRecord): WorkPatternResource {
  return { ...structuredClone(pattern), group_count: countGroupsUsingPattern(pattern.id) };
}

/** Berapa pola kerja yang memakai shift ini (di slot mana pun, hari mana pun). */
export function countPatternsUsingShift(shiftId: string): number {
  return getScheduleStore().workPatterns.filter((pattern) =>
    pattern.slots.some((slot) => slot.shift_ids.includes(shiftId)),
  ).length;
}

/** Berapa regu kerja yang memakai pola ini. */
export function countGroupsUsingPattern(patternId: string): number {
  return getScheduleStore().workGroups.filter((group) => group.work_pattern_id === patternId).length;
}

/** Tanggal hari ini "YYYY-MM-DD" (waktu setempat server). */
export function todayText(): string {
  return toDateText(new Date());
}

/**
 * Regu siap dikirim ke browser: id diganti nama (sub unit, objek, pola, ketua, karyawan),
 * anggota aktif di atas, dan slot setiap anggota HARI INI ikut dihitung.
 */
export function toWorkGroupResource(group: WorkGroupRecord): WorkGroupResource {
  const { employees, placementObjects, subUnits } = getStore();
  const { groupMembers, workPatterns } = getScheduleStore();
  const pattern = workPatterns.find((item) => item.id === group.work_pattern_id);
  const leader = employees.find((item) => item.id === group.leader_employee_id);
  const placementObject = placementObjects.find((item) => item.id === group.placement_object_id);
  const today = todayText();

  const members = groupMembers
    .filter((item) => item.group_id === group.id)
    .map((item): GroupMemberResource => {
      const employee = employees.find((entry) => entry.id === item.employee_id);
      const startSlot = pattern?.slots.find((slot) => slot.id === item.start_slot_id);

      return {
        id: item.id,
        employee: {
          id: item.employee_id,
          name: employee?.name ?? "-",
          nik: employee?.nik ?? null,
          photo_url: employee?.photo_url ?? null,
        },
        start_slot: { id: item.start_slot_id, code: startSlot?.code ?? "?", name: startSlot?.name ?? "-" },
        start_date: item.start_date,
        end_date: item.end_date,
        is_active: isMemberActiveOn(item, today),
        period: isMemberActiveOn(item, today) ? "Aktif" : item.start_date > today ? "Akan Datang" : "Selesai",
        current_slot_code: pattern ? (slotOnDate(group, pattern, item, today)?.code ?? null) : null,
      };
    })
    // Aktif & akan datang di atas (belum selesai); lalu yang terbaru bergabung.
    .sort(
      (a, b) =>
        Number(b.period !== "Selesai") - Number(a.period !== "Selesai") || b.start_date.localeCompare(a.start_date),
    );

  return {
    id: group.id,
    name: group.name,
    sub_unit: { id: group.sub_unit_id, name: subUnits.find((item) => item.id === group.sub_unit_id)?.name ?? "-" },
    placement_object: placementObject ? { id: placementObject.id, name: placementObject.name } : null,
    work_pattern: { id: group.work_pattern_id, name: pattern?.name ?? "-", cycle_days: pattern?.cycle_days ?? 7 },
    leader: leader ? { employee_id: leader.id, name: leader.name } : null,
    rotation_mode: group.rotation_mode,
    rotate_every_days: group.rotate_every_days,
    anchor_date: group.anchor_date,
    description: group.description,
    members,
    active_member_count: members.filter((item) => item.period !== "Selesai").length,
    slot_count: pattern?.slots.length ?? 0,
  };
}
