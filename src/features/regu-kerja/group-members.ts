/**
 * ALAT BANTU ANGGOTA REGU di wizard: siapa memegang slot apa pada tanggal bergabung,
 * slot bentrok, dan "Isi Slot Otomatis". Rumus rotasinya ada di lib/schedule-rules.ts.
 */
import { isSingleHolderSlot, slotOnDate, type RotationSettings } from "@/lib/schedule-rules";
import type { NewMemberPayload, WorkGroupResource } from "@/types/api/work-group";
import type { WorkPatternResource } from "@/types/api/work-pattern";

/** Anggota lama yang memegang sebuah slot pada tanggal bergabung. */
export interface SlotHolder {
  memberId: string;
  slotId: string;
  name: string;
}

/** Isian wizard yang dibutuhkan rumus rotasi (rotasi tiap N hari masih berupa teks). */
interface RotationValues {
  rotation_mode: string;
  rotate_every_days: string;
  anchor_date: string;
  members: NewMemberPayload[];
}

/** Isian wizard -> pengaturan rotasi untuk rumus. */
function toRotation(values: RotationValues): RotationSettings {
  return {
    rotation_mode: values.rotation_mode,
    rotate_every_days: Number(values.rotate_every_days) || 7,
    anchor_date: values.anchor_date,
  };
}

/**
 * Anggota LAMA regu yang masih aktif pada tanggal bergabung, beserta slot yang dipegangnya hari itu.
 * Regu baru / tanggal kosong -> [].
 */
export function oldSlotHolders(
  group: WorkGroupResource | undefined,
  values: RotationValues,
  pattern: WorkPatternResource | undefined,
  date: string,
): SlotHolder[] {
  if (!group || !pattern || !date || !values.anchor_date) return [];

  return group.members.flatMap((member) => {
    const slot = slotOnDate(
      toRotation(values),
      pattern,
      {
        id: member.id,
        employee_id: member.employee.id,
        start_slot_id: member.start_slot.id,
        start_date: member.start_date,
        end_date: member.end_date,
      },
      date,
    );
    return slot ? [{ memberId: member.id, slotId: slot.id, name: member.employee.name }] : [];
  });
}

/**
 * Slot bergilir yang dipegang LEBIH DARI SATU orang (di regu Bergilir hanya boleh satu).
 * Hasilnya [urutan anggota baru, pesan], mis. [2, "Slot A sudah dipegang Agus. ..."].
 * `nameOf` = nama karyawan dari id-nya.
 */
export function singleHolderConflicts(
  values: RotationValues,
  pattern: WorkPatternResource,
  oldHolders: SlotHolder[],
  nameOf: (employeeId: string) => string,
): [number, string][] {
  const rotation = toRotation(values);
  const takenBy = new Map(oldHolders.map((holder) => [holder.slotId, holder.name]));
  const conflicts: [number, string][] = [];

  values.members.forEach((member, index) => {
    const slot = pattern.slots.find((item) => item.id === member.start_slot_id);
    if (!slot || !isSingleHolderSlot(rotation, slot)) return;

    const holderName = takenBy.get(slot.id);
    if (holderName) {
      conflicts.push([index, `Slot ${slot.code} sudah dipegang ${holderName}. Slot bergilir hanya boleh satu orang.`]);
    } else {
      takenBy.set(slot.id, nameOf(member.employee_id));
    }
  });

  return conflicts;
}

/**
 * ISI SLOT OTOMATIS: bagi karyawan terpilih ke slot secara berurutan.
 *   1. utamakan slot yang masih KOSONG (belum dipegang anggota lama / anggota baru sebelumnya)
 *   2. kalau semua slot sudah terisi, slot yang boleh dipegang beberapa orang dipakai bergantian
 *      (slot bergilir di regu Bergilir tidak, karena hanya boleh satu orang)
 *   3. tidak ada yang tersisa -> slot dibiarkan kosong, dipilih manual
 *
 *   Contoh: slot A B C D, anggota lama di A, 3 karyawan baru -> B, C, D
 */
export function autoFillSlots(
  values: RotationValues,
  pattern: WorkPatternResource,
  oldHolders: SlotHolder[],
): NewMemberPayload[] {
  const rotation = toRotation(values);
  const taken = new Set(oldHolders.map((holder) => holder.slotId));
  const sharedSlots = pattern.slots.filter((slot) => !isSingleHolderSlot(rotation, slot));
  let sharedTurn = 0;

  return values.members.map((member) => {
    const emptySlot = pattern.slots.find((slot) => !taken.has(slot.id));
    if (emptySlot) {
      taken.add(emptySlot.id);
      return { ...member, start_slot_id: emptySlot.id };
    }
    if (sharedSlots.length > 0) {
      const slot = sharedSlots[sharedTurn++ % sharedSlots.length];
      return { ...member, start_slot_id: slot.id };
    }
    return { ...member, start_slot_id: "" };
  });
}
