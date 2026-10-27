/**
 * DATA CONTOH (MOCK) REGU KERJA & ANGGOTANYA — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/work-groups/**:
 *
 *   GET/POST          /work-groups                          daftar / tambah regu (+ anggota baru)
 *   GET/PUT/DELETE    /work-groups/{id}                     detail / ubah regu (+ anggota baru) / hapus regu
 *   GET               /work-groups/{id}/members             anggota (aktif & riwayat)
 *   PUT               /work-groups/{id}/members/{memberId}  akhiri keanggotaan (end_date)
 *   GET               /work-groups/{id}/projection          proyeksi jadwal + slot kosong (tidak disimpan)
 */
import { addDays, daysBetween } from "@/lib/date";
import {
  findVacancies,
  isSingleHolderSlot,
  MAX_ROTATE_EVERY_DAYS,
  ROTATION_MODE,
  ROTATION_MODES,
  shiftOnDate,
  slotOnDate,
} from "@/lib/schedule-rules";
import type {
  EndMemberPayload,
  GroupMemberResource,
  ProjectionResource,
  WorkGroupPayload,
  WorkGroupResource,
} from "@/types/api/work-group";

import { failure, success, type MockResult } from "./mock-response";
import { createId, getStore } from "./organization-store";
import type { GroupMemberRecord, WorkGroupRecord } from "./schedule/work-groups";
import { getScheduleStore, todayText, toWorkGroupResource } from "./schedule-store";

type Errors = Record<string, string[]>;

/** Proyeksi paling panjang yang boleh diminta sekaligus. */
const MAX_PROJECTION_DAYS = 62;

// ---------------------------------------------------------------------------
// Regu
// ---------------------------------------------------------------------------

/** Pengganti backend `GET /work-groups`. */
export function mockListWorkGroups(): MockResult<WorkGroupResource[]> {
  return success("Daftar regu kerja", getScheduleStore().workGroups.map(toWorkGroupResource));
}

/** Pengganti backend `GET /work-groups/{id}`. */
export function mockGetWorkGroup(id: string): MockResult<WorkGroupResource | null> {
  const group = findGroup(id);
  if (!group) return failure(404, "Regu kerja tidak ditemukan.");

  return success("Detail regu kerja", toWorkGroupResource(group));
}

/** Pengganti backend `POST /work-groups`. Regu dan anggota barunya (boleh kosong) disimpan sekaligus. */
export function mockCreateWorkGroup(payload: WorkGroupPayload): MockResult<WorkGroupResource | null> {
  const errors = { ...validateGroup(payload, null), ...validateNewMembers(payload, null) };
  if (Object.keys(errors).length > 0) return failure(422, "Isian regu kerja belum benar.", errors);

  const group: WorkGroupRecord = { id: createId("regu"), ...cleanGroup(payload) };
  getScheduleStore().workGroups.push(group);
  addMembers(group.id, payload);

  return success(`Regu kerja berhasil ditambahkan${memberCountText(payload)}.`, toWorkGroupResource(group), 201);
}

/** Pengganti backend `PUT /work-groups/{id}`. Anggota lama tidak diubah; anggota baru ditambahkan. */
export function mockUpdateWorkGroup(id: string, payload: WorkGroupPayload): MockResult<WorkGroupResource | null> {
  const group = findGroup(id);
  if (!group) return failure(404, "Regu kerja tidak ditemukan.");

  const errors = { ...validateGroup(payload, group), ...validateNewMembers(payload, group.id) };
  if (Object.keys(errors).length > 0) return failure(422, "Isian regu kerja belum benar.", errors);

  Object.assign(group, cleanGroup(payload));
  addMembers(group.id, payload);

  return success(`Regu kerja berhasil diperbarui${memberCountText(payload)}.`, toWorkGroupResource(group));
}

/** Pengganti backend `DELETE /work-groups/{id}`. Regu yang pernah punya anggota tidak boleh dihapus (riwayat). */
export function mockDeleteWorkGroup(id: string): MockResult<null> {
  const store = getScheduleStore();
  const group = findGroup(id);
  if (!group) return failure(404, "Regu kerja tidak ditemukan.");

  const memberCount = store.groupMembers.filter((item) => item.group_id === id).length;
  if (memberCount > 0) {
    return failure(409, `Regu "${group.name}" sudah punya ${memberCount} riwayat anggota, jadi tidak bisa dihapus.`);
  }

  store.workGroups = store.workGroups.filter((item) => item.id !== id);

  return success("Regu kerja berhasil dihapus.", null);
}

// ---------------------------------------------------------------------------
// Anggota
// ---------------------------------------------------------------------------

/** Pengganti backend `GET /work-groups/{id}/members`. */
export function mockListGroupMembers(groupId: string): MockResult<GroupMemberResource[] | null> {
  const group = findGroup(groupId);
  if (!group) return failure(404, "Regu kerja tidak ditemukan.");

  return success("Anggota regu kerja", toWorkGroupResource(group).members);
}

/** Pengganti backend `PUT /work-groups/{id}/members/{memberId}`: akhiri keanggotaan pada end_date. */
export function mockEndGroupMember(
  groupId: string,
  memberId: string,
  payload: EndMemberPayload,
): MockResult<WorkGroupResource | null> {
  const group = findGroup(groupId);
  if (!group) return failure(404, "Regu kerja tidak ditemukan.");

  const member = getScheduleStore().groupMembers.find((item) => item.id === memberId && item.group_id === groupId);
  if (!member) return failure(404, "Anggota tidak ditemukan.");

  if (!isDate(payload.end_date)) return failure(422, "Isian belum benar.", { end_date: ["Pilih Tanggal Terakhir"] });
  if (payload.end_date < member.start_date) {
    return failure(422, "Isian belum benar.", { end_date: ["Tanggal Terakhir tidak boleh sebelum tanggal bergabung"] });
  }

  member.end_date = payload.end_date;

  return success("Keanggotaan berhasil diakhiri.", toWorkGroupResource(group));
}

// ---------------------------------------------------------------------------
// Proyeksi
// ---------------------------------------------------------------------------

/**
 * Pengganti backend `GET /work-groups/{id}/projection?from=&to=`.
 * Jadwal DIHITUNG dari rumus rotasi (tidak disimpan), beserta slot kosong yang punya shift.
 */
export function mockProjectWorkGroup(groupId: string, from: string, to: string): MockResult<ProjectionResource | null> {
  const group = findGroup(groupId);
  if (!group) return failure(404, "Regu kerja tidak ditemukan.");
  if (!isDate(from) || !isDate(to) || to < from) return failure(422, "Rentang tanggal belum benar.");
  if (daysBetween(from, to) >= MAX_PROJECTION_DAYS) {
    return failure(422, `Rentang proyeksi maksimal ${MAX_PROJECTION_DAYS} hari.`);
  }

  const pattern = getScheduleStore().workPatterns.find((item) => item.id === group.work_pattern_id);
  if (!pattern) return failure(409, "Pola kerja regu ini tidak ditemukan.");

  const dates = Array.from({ length: daysBetween(from, to) + 1 }, (_, index) => addDays(from, index));
  const members = membersOf(group.id).filter((member) => member.start_date <= to && (member.end_date ?? to) >= from);
  const { employees } = getStore();

  return success("Proyeksi jadwal regu", {
    from,
    to,
    dates,
    rows: members.map((member) => ({
      member_id: member.id,
      employee: { id: member.employee_id, name: employees.find((item) => item.id === member.employee_id)?.name ?? "-" },
      cells: dates.map((date) => {
        const result = shiftOnDate(group, pattern, member, date);
        return { date, slot_code: result?.slot.code ?? null, shift_id: result?.shiftId ?? null };
      }),
    })),
    // Sebelum Tanggal Mulai Berlaku Jadwal, regu belum berjalan -> tidak ada shift kosong.
    vacancies: dates.filter((date) => date >= group.anchor_date).flatMap((date) =>
      findVacancies(group, pattern, members, date)
        .filter((vacancy) => vacancy.shiftId !== null)
        .map((vacancy) => ({ date, slot_code: vacancy.slot.code, shift_id: vacancy.shiftId as string })),
    ),
  });
}

// ---------------------------------------------------------------------------
// Alat bantu & pemeriksaan
// ---------------------------------------------------------------------------

function findGroup(id: string): WorkGroupRecord | undefined {
  return getScheduleStore().workGroups.find((item) => item.id === id);
}

function membersOf(groupId: string): GroupMemberRecord[] {
  return getScheduleStore().groupMembers.filter((item) => item.group_id === groupId);
}

function isDate(text: unknown): text is string {
  return typeof text === "string" && /^\d{4}-\d{2}-\d{2}$/.test(text);
}

function cleanGroup(payload: WorkGroupPayload): Omit<WorkGroupRecord, "id"> {
  return {
    name: payload.name.trim(),
    sub_unit_id: payload.sub_unit_id,
    placement_object_id: payload.placement_object_id || null,
    work_pattern_id: payload.work_pattern_id,
    leader_employee_id: payload.leader_employee_id || null,
    rotation_mode: payload.rotation_mode,
    rotate_every_days: payload.rotation_mode === ROTATION_MODE.rotating ? Number(payload.rotate_every_days) : 7,
    anchor_date: payload.anchor_date,
    description: payload.description.trim() || null,
  };
}

/** Periksa isian regu. `current` = regu yang sedang diubah (null saat tambah baru). */
function validateGroup(payload: WorkGroupPayload, current: WorkGroupRecord | null): Errors {
  const errors: Errors = {};
  const { employees, placementObjects, subUnits } = getStore();
  const { workGroups, workPatterns } = getScheduleStore();
  const name = payload.name.trim();

  if (!name) errors.name = ["Nama Regu wajib diisi"];
  else if (workGroups.some((item) => item.id !== current?.id && item.name.toLowerCase() === name.toLowerCase())) {
    errors.name = [`Regu "${name}" sudah ada`];
  }

  if (!subUnits.some((item) => item.id === payload.sub_unit_id)) errors.sub_unit_id = ["Pilih Sub Unit"];
  if (payload.placement_object_id) {
    const placementObject = placementObjects.find((item) => item.id === payload.placement_object_id);
    if (!placementObject) errors.placement_object_id = ["Objek penempatan tidak ditemukan"];
    else if (!placementObject.sub_unit_ids.includes(payload.sub_unit_id)) {
      errors.placement_object_id = [`Objek "${placementObject.name}" tidak tersedia di sub unit yang dipilih`];
    }
  }

  const pattern = workPatterns.find((item) => item.id === payload.work_pattern_id);
  if (!pattern) errors.work_pattern_id = ["Pilih Pola Kerja"];
  else if (current && current.work_pattern_id !== pattern.id) {
    const activeCount = membersOf(current.id).filter((item) => item.end_date === null || item.end_date >= todayText()).length;
    if (activeCount > 0) {
      errors.work_pattern_id = [
        `Pola tidak bisa diganti selama masih ada ${activeCount} anggota aktif. Akhiri keanggotaan mereka dulu, lalu tambahkan lagi dengan slot pola baru.`,
      ];
    }
  }

  if (payload.leader_employee_id && !employees.some((item) => item.id === payload.leader_employee_id)) {
    errors.leader_employee_id = ["Ketua regu tidak ditemukan"];
  }

  if (!ROTATION_MODES.includes(payload.rotation_mode)) errors.rotation_mode = ["Pilih Mode Rotasi"];
  else if (payload.rotation_mode === ROTATION_MODE.rotating) {
    const every = Number(payload.rotate_every_days);
    if (!Number.isInteger(every) || every < 1 || every > MAX_ROTATE_EVERY_DAYS) {
      errors.rotate_every_days = [`Rotasi harus tiap 1–${MAX_ROTATE_EVERY_DAYS} hari`];
    }
  }

  // Hari apa pun boleh: tanggal ini menjadi hari ke-1 pola.
  if (!isDate(payload.anchor_date)) errors.anchor_date = ["Pilih Tanggal Mulai Berlaku Jadwal"];
  else if (current) {
    const firstStart = membersOf(current.id)
      .map((item) => item.start_date)
      .sort()[0];
    if (firstStart && payload.anchor_date > firstStart) {
      errors.anchor_date = [`Tanggal Mulai Berlaku Jadwal tidak boleh setelah anggota pertama bergabung (${firstStart})`];
    }
  }

  return errors;
}

/** Simpan anggota baru dari isian wizard. */
function addMembers(groupId: string, payload: WorkGroupPayload) {
  for (const member of payload.members) {
    getScheduleStore().groupMembers.push({
      id: createId("anggota"),
      group_id: groupId,
      employee_id: member.employee_id,
      start_slot_id: member.start_slot_id,
      start_date: payload.members_start_date,
      end_date: null,
    });
  }
}

/** ", dengan 3 anggota baru" atau "" kalau tidak ada anggota baru. */
function memberCountText(payload: WorkGroupPayload): string {
  return payload.members.length > 0 ? `, dengan ${payload.members.length} anggota baru` : "";
}

/**
 * Periksa anggota baru. `groupId` = regu yang diubah (null saat tambah regu baru).
 * Pesan error per anggota memakai nama isian "members.<urutan>.<isian>".
 *   - tanggal bergabung >= Tanggal Mulai Berlaku Jadwal
 *   - karyawan tidak dipilih dua kali, dan tidak sedang aktif di regu mana pun
 *   - slot milik pola regu; slot bergilir di regu Bergilir hanya boleh dipegang satu orang
 *     (dibandingkan dengan anggota lama DAN anggota baru lain)
 */
function validateNewMembers(payload: WorkGroupPayload, groupId: string | null): Errors {
  const errors: Errors = {};
  if (payload.members.length === 0) return errors;

  const { employees } = getStore();
  const { groupMembers, workGroups, workPatterns } = getScheduleStore();
  const pattern = workPatterns.find((item) => item.id === payload.work_pattern_id);
  const rotation = cleanGroup(payload);
  const startDate = payload.members_start_date;

  if (!isDate(startDate)) return { members_start_date: ["Pilih Tanggal Bergabung"] };
  if (isDate(payload.anchor_date) && startDate < payload.anchor_date) {
    errors.members_start_date = ["Tanggal Bergabung tidak boleh sebelum Tanggal Mulai Berlaku Jadwal"];
  }

  // Anggota lama regu ini (untuk dicek siapa yang memegang slot pada tanggal bergabung).
  const oldMembers = groupId ? membersOf(groupId) : [];
  // Slot bergilir yang sudah diambil anggota baru sebelumnya di daftar ini: id slot -> nama.
  const takenByNew = new Map<string, string>();

  payload.members.forEach((member, index) => {
    const employee = employees.find((item) => item.id === member.employee_id);
    if (!employee) {
      errors[`members.${index}.employee_id`] = ["Karyawan tidak ditemukan"];
      return;
    }
    if (payload.members.findIndex((item) => item.employee_id === member.employee_id) !== index) {
      errors[`members.${index}.employee_id`] = [`${employee.name} dipilih lebih dari sekali`];
      return;
    }
    const overlap = groupMembers.find(
      (item) => item.employee_id === employee.id && (item.end_date === null || item.end_date >= startDate),
    );
    if (overlap) {
      const groupName = workGroups.find((item) => item.id === overlap.group_id)?.name ?? "regu lain";
      errors[`members.${index}.employee_id`] = [
        `${employee.name} masih aktif di regu "${groupName}". Akhiri keanggotaannya dulu.`,
      ];
    }

    if (!pattern) return;
    const slot = pattern.slots.find((item) => item.id === member.start_slot_id);
    if (!slot) {
      errors[`members.${index}.start_slot_id`] = [`Pilih Slot untuk ${employee.name}`];
      return;
    }
    if (!isSingleHolderSlot(rotation, slot)) return;

    const oldHolder = oldMembers.find((item) => slotOnDate(rotation, pattern, item, startDate)?.id === slot.id);
    const holderName =
      takenByNew.get(slot.id) ?? (oldHolder && employees.find((item) => item.id === oldHolder.employee_id)?.name);
    if (holderName) {
      errors[`members.${index}.start_slot_id`] = [
        `Slot ${slot.code} sudah dipegang ${holderName}. Slot bergilir hanya boleh satu orang.`,
      ];
    } else {
      takenByNew.set(slot.id, employee.name);
    }
  });

  return errors;
}
