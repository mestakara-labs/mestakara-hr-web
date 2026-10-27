/**
 * ISIAN FORM REGU KERJA: bentuk datanya, isian awal, pemeriksaan, dan cara mengirimnya.
 * Dipakai tiga halaman:
 *   - Tambah Regu    (wizard): Data Regu -> Anggota & Slot
 *   - Edit Regu              : Data Regu saja
 *   - Kelola Anggota         : Anggota & Slot saja
 */
import { toObjectOptions } from "@/features/jabatan-karyawan/assignment-options";
import { MAX_ROTATE_EVERY_DAYS, ROTATION_MODE } from "@/lib/schedule-rules";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import { requireSelection, requireText } from "@/lib/validation";
import type { NewMemberPayload, WorkGroupPayload, WorkGroupResource } from "@/types/api/work-group";
import type { WorkPatternResource } from "@/types/api/work-pattern";

import { singleHolderConflicts, type SlotHolder } from "./group-members";

/** Isian wizard. "Rotasi tiap" disimpan sebagai teks selama diketik. */
export interface ReguFormValues extends Omit<WorkGroupPayload, "rotate_every_days"> {
  rotate_every_days: string;
}

/** Pesan error per isian, mis. { name: "Nama Regu wajib diisi", "members.0.start_slot_id": "Pilih Slot ..." }. */
export type StepErrors = Record<string, string>;

/** Pesan untuk karyawan yang slotnya belum dipilih. */
export const MISSING_SLOT_MESSAGE = "Pilih Slot untuk semua karyawan";

/** Judul langkah wizard, urut dari langkah 1. */
export const REGU_WIZARD_STEPS = ["Data Regu", "Anggota & Slot"];

/**
 * Isian awal: kosong (mode Tetap) untuk regu baru, atau data lama untuk edit.
 * `today` dipakai sebagai tanggal bergabung bawaan anggota baru saat edit.
 */
export function initialValues(group: WorkGroupResource | undefined, today: string): ReguFormValues {
  return {
    name: group?.name ?? "",
    sub_unit_id: group?.sub_unit.id ?? "",
    placement_object_id: group?.placement_object?.id ?? "",
    work_pattern_id: group?.work_pattern.id ?? "",
    leader_employee_id: group?.leader?.employee_id ?? "",
    rotation_mode: group?.rotation_mode ?? ROTATION_MODE.fixed,
    rotate_every_days: String(group?.rotate_every_days ?? 7),
    anchor_date: group?.anchor_date ?? "",
    description: group?.description ?? "",
    members: [],
    // Regu baru: anggota bergabung pada Tanggal Mulai Berlaku (diisi saat dikirim).
    members_start_date: group ? (today < group.anchor_date ? group.anchor_date : today) : "",
  };
}

/**
 * Ubah satu isian Data Regu:
 *   - sub unit diganti -> objek dikosongkan kalau tidak tersedia di sub unit baru
 *   - pola diganti     -> slot anggota baru dikosongkan (slot pola lama tidak berlaku)
 */
export function applyGroupChange(
  previous: ReguFormValues,
  key: keyof ReguFormValues,
  value: string,
  placementObjects: PlacementObjectResource[],
): ReguFormValues {
  const next = { ...previous, [key]: value };
  if (key === "sub_unit_id") {
    const stillAvailable = toObjectOptions(placementObjects, value).some(
      (option) => option.value === previous.placement_object_id,
    );
    if (!stillAvailable) next.placement_object_id = "";
  }
  if (key === "work_pattern_id") {
    next.members = previous.members.map((member) => ({ ...member, start_slot_id: "" }));
  }
  return next;
}

/** Pesan error dari server (422) -> pesan pertama setiap isian. */
export function firstMessages(errors: Record<string, string[]>): StepErrors {
  return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]));
}

/** Data Regu (langkah 1 wizard / halaman Edit Regu). */
export function checkGroupStep(form: ReguFormValues): StepErrors {
  const every = Number(form.rotate_every_days);
  const errors = {
    name: requireText(form.name, "Nama Regu"),
    sub_unit_id: requireSelection(form.sub_unit_id, "Sub Unit"),
    work_pattern_id: requireSelection(form.work_pattern_id, "Pola Kerja"),
    rotation_mode: requireSelection(form.rotation_mode, "Mode Rotasi"),
    rotate_every_days:
      form.rotation_mode === ROTATION_MODE.rotating &&
      (!Number.isInteger(every) || every < 1 || every > MAX_ROTATE_EVERY_DAYS)
        ? `Rotasi harus tiap 1–${MAX_ROTATE_EVERY_DAYS} hari`
        : undefined,
    anchor_date: requireSelection(form.anchor_date, "Tanggal Mulai Berlaku Jadwal"),
  };
  return withoutEmpty(errors);
}

/**
 * Anggota & Slot (langkah 2 wizard / halaman Kelola Anggota), hanya kalau ada karyawan yang dipilih:
 *   - kelola anggota: Tanggal Bergabung wajib & tidak sebelum Tanggal Mulai Berlaku
 *   - setiap karyawan wajib punya slot
 *   - slot bergilir di regu Bergilir hanya boleh satu orang (termasuk anggota lama)
 */
export function checkMembersStep(
  form: ReguFormValues,
  pattern: WorkPatternResource | undefined,
  oldHolders: SlotHolder[],
  isEdit: boolean,
  nameOf: (employeeId: string) => string,
): StepErrors {
  const errors: StepErrors = {};
  if (form.members.length === 0) return errors;

  if (isEdit) {
    if (!form.members_start_date) errors.members_start_date = "Pilih Tanggal Bergabung";
    else if (form.members_start_date < form.anchor_date) {
      errors.members_start_date = "Tanggal Bergabung tidak boleh sebelum Tanggal Mulai Berlaku Jadwal";
    }
  }

  form.members.forEach((member, index) => {
    if (!member.start_slot_id) errors[`members.${index}.start_slot_id`] = MISSING_SLOT_MESSAGE;
  });

  if (pattern) {
    for (const [index, message] of singleHolderConflicts(form, pattern, oldHolders, nameOf)) {
      errors[`members.${index}.start_slot_id`] = message;
    }
  }
  return errors;
}

/** Nama isian -> langkah wizard tempat isian itu berada (untuk membuka langkah yang bermasalah). */
export function stepOfError(fieldName: string): number {
  return fieldName.startsWith("members") ? 2 : 1;
}

/**
 * Isian -> data yang dikirim ke /api/work-groups.
 * Regu baru: anggota bergabung pada Tanggal Mulai Berlaku. Regu lama: pada Tanggal Bergabung yang dipilih.
 */
export function toPayload(form: ReguFormValues, isExistingGroup: boolean): WorkGroupPayload {
  return {
    ...form,
    rotate_every_days: Number(form.rotate_every_days) || 7,
    members_start_date: isExistingGroup ? form.members_start_date : form.anchor_date,
  };
}

/** Anggota baru dengan slot kosong (slotnya dipilih kemudian). */
export function newMember(employeeId: string): NewMemberPayload {
  return { employee_id: employeeId, start_slot_id: "" };
}

/** Buang isian yang tidak punya pesan error. */
function withoutEmpty(errors: Record<string, string | undefined>): StepErrors {
  return Object.fromEntries(Object.entries(errors).filter((entry): entry is [string, string] => Boolean(entry[1])));
}
