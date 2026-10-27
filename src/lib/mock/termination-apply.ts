/**
 * LOGIKA INTI PENONAKTIFAN KARYAWAN (data mock):
 *
 *   planTermination()      hitung DAMPAK per karyawan, tanpa mengubah data (Pratinjau Dampak)
 *   applyTermination()     usulan BERLAKU: dampaknya diterapkan
 *   revertTermination()    usulan Berlaku DIBATALKAN: semua perubahan dikembalikan
 *
 * DAMPAK satu karyawan (TMT nonaktif = hari pertama tidak aktif):
 *   1. Jabatan yang masih berjalan diakhiri: TMT Selesai = sehari sebelum TMT nonaktif
 *   2. Keanggotaan regu kerja diakhiri: tanggal terakhir = sehari sebelum TMT nonaktif
 *   3. Bawahannya otomatis dialihkan ke ATASAN karyawan itu (naik satu tingkat),
 *      memakai aturan yang sama dengan Mutasi (planSupervisorChanges)
 *
 * Di mock, dampaknya langsung diterapkan saat usulan Berlaku (tanggalnya sudah benar);
 * di backend nanti, job harian menerapkannya pada TMT. Akun login (dinonaktifkan /
 * diaktifkan kembali) belum ada di data mock.
 */
import { getAssignmentPeriod } from "@/lib/assignment-rules";
import { ACTIVATION_STATUS } from "@/lib/activation-rules";
import { dayBefore } from "@/lib/transfer-rules";
import type { TerminationImpact } from "@/types/api/employee-termination";

import type { TerminationItemRecord, TerminationRecord } from "./organization/terminations";
import { getStore, toSupervisorList } from "./organization-store";
import { getScheduleStore } from "./schedule-store";
import { recordSupervisorChange } from "./supervisor-mock";
import { isSameList, planSupervisorChanges, type PlannedChange } from "./transfer-plan";

/** Bagian item yang dibutuhkan untuk menghitung dampak. */
export type TerminationPlanItem = Pick<TerminationItemRecord, "id" | "employee_id" | "effective_date">;

/** Rencana dampak semua karyawan di usulan. */
interface TerminationPlan {
  /** Penugasan yang diakhiri, per id item */
  assignmentIds: Map<string, string[]>;
  /** Keanggotaan regu yang diakhiri, per id item */
  memberIds: Map<string, string[]>;
  /** Bawahan yang dialihkan (semua item sekaligus) */
  supervisorChanges: PlannedChange[];
}

/** Penugasan karyawan yang masih berjalan (atau akan datang) pada TMT nonaktif. */
function assignmentsToEnd(item: TerminationPlanItem): string[] {
  return getStore()
    .assignments.filter(
      (assignment) =>
        assignment.employee_id === item.employee_id &&
        getAssignmentPeriod(assignment) !== "Selesai" &&
        (assignment.end_date === null || assignment.end_date >= item.effective_date),
    )
    .map((assignment) => assignment.id);
}

/** Keanggotaan regu karyawan yang masih berjalan pada TMT nonaktif. */
function membershipsToEnd(item: TerminationPlanItem): string[] {
  return getScheduleStore()
    .groupMembers.filter(
      (member) => member.employee_id === item.employee_id && (member.end_date === null || member.end_date >= item.effective_date),
    )
    .map((member) => member.id);
}

/** Hitung dampak penonaktifan, TANPA mengubah data. Item tanpa TMT dilewati. */
export function planTermination(items: TerminationPlanItem[]): TerminationPlan {
  const withDate = items.filter((item) => item.effective_date);
  const assignmentIds = new Map(withDate.map((item) => [item.id, assignmentsToEnd(item)]));
  const memberIds = new Map(withDate.map((item) => [item.id, membershipsToEnd(item)]));

  // Pengalihan atasan: penugasan yang diakhiri TIDAK punya pemegang baru, jadi bawahannya
  // naik ke atasan karyawan itu (position_id kosong = tidak ada yang menggantikan).
  const planItems = [...assignmentIds.entries()].flatMap(([itemId, ids]) =>
    ids.map((id) => ({ id: `${itemId}:${id}`, from_assignment_id: id, position_id: "", restore_subordinates: false })),
  );
  const supervisorChanges = planSupervisorChanges(planItems).changes.map((change) => ({
    ...change,
    reason: "Atasan dinonaktifkan, dialihkan ke atasan berikutnya",
  }));

  return { assignmentIds, memberIds, supervisorChanges };
}

/** Rencana dampak -> bentuk API per item (untuk Pratinjau Dampak & usulan Draf). */
export function toPlannedImpacts(items: TerminationPlanItem[]): Record<string, TerminationImpact> {
  const plan = planTermination(items);
  const { assignments } = getStore();

  return Object.fromEntries(
    items.map((item) => {
      const endedIds = plan.assignmentIds.get(item.id) ?? [];
      const endDate = item.effective_date ? dayBefore(item.effective_date) : "";
      const subordinates = plan.supervisorChanges.filter((change) => {
        const assignment = assignments.find((entry) => entry.id === change.assignmentId);
        return assignment?.supervisor_assignment_ids.some((id) => endedIds.includes(id));
      });

      return [
        item.id,
        toImpact(
          endedIds.map((id) => ({ id, endDate })),
          (plan.memberIds.get(item.id) ?? []).map((id) => ({ id, endDate })),
          subordinates.map((change) => ({ assignmentId: change.assignmentId, from: currentSupervisors(change), to: change.toRefs })),
        ),
      ];
    }),
  );
}

function currentSupervisors(change: PlannedChange): string[] {
  return getStore().assignments.find((entry) => entry.id === change.assignmentId)?.supervisor_assignment_ids ?? [];
}

/** Dampak yang SUDAH diterapkan satu item usulan Berlaku. */
export function toAppliedImpact(termination: TerminationRecord, item: TerminationItemRecord): TerminationImpact {
  const { assignments, supervisorChanges } = getStore();
  const { groupMembers } = getScheduleStore();
  const endedIds = item.ended_assignments.map((entry) => entry.id);

  const subordinates = supervisorChanges
    .filter((change) => termination.supervisor_change_ids.includes(change.id) && change.from_ids.some((id) => endedIds.includes(id)))
    .map((change) => ({ assignmentId: change.assignment_id, from: change.from_ids, to: change.to_ids }));

  return toImpact(
    item.ended_assignments.map((entry) => ({ id: entry.id, endDate: assignments.find((a) => a.id === entry.id)?.end_date ?? "" })),
    item.ended_memberships.map((entry) => ({ id: entry.id, endDate: groupMembers.find((m) => m.id === entry.id)?.end_date ?? "" })),
    subordinates,
  );
}

/** Id-id dampak -> nama jabatan, sub unit, regu, dan bawahan. */
function toImpact(
  ended: { id: string; endDate: string }[],
  memberships: { id: string; endDate: string }[],
  subordinates: { assignmentId: string; from: string[]; to: string[] }[],
): TerminationImpact {
  const { assignments, employees, positions, subUnits } = getStore();
  const { groupMembers, workGroups } = getScheduleStore();
  const positionTitle = (assignmentId: string) => {
    const assignment = assignments.find((entry) => entry.id === assignmentId);
    return positions.find((entry) => entry.id === assignment?.position_id)?.title ?? "-";
  };

  return {
    ended_assignments: ended.map(({ id, endDate }) => {
      const assignment = assignments.find((entry) => entry.id === id);
      return {
        assignment_id: id,
        position_title: positionTitle(id),
        assignment_status: assignment?.assignment_status ?? "-",
        sub_unit_name: subUnits.find((entry) => entry.id === assignment?.sub_unit_id)?.name ?? "-",
        end_date: endDate,
      };
    }),
    subordinates: subordinates.map(({ assignmentId, from, to }) => {
      const assignment = assignments.find((entry) => entry.id === assignmentId);
      return {
        assignment_id: assignmentId,
        employee_name: employees.find((entry) => entry.id === assignment?.employee_id)?.name ?? "-",
        position_title: positionTitle(assignmentId),
        from: toSupervisorList(from),
        to: toSupervisorList(to),
      };
    }),
    memberships: memberships.map(({ id, endDate }) => {
      const member = groupMembers.find((entry) => entry.id === id);
      return {
        member_id: id,
        group_id: member?.group_id ?? "",
        group_name: workGroups.find((entry) => entry.id === member?.group_id)?.name ?? "-",
        end_date: endDate,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Penerapan & pembatalan
// ---------------------------------------------------------------------------

/**
 * Usulan BERLAKU. Urutannya:
 *   1. Hitung rencana (dari data SEBELUM diubah)
 *   2. Alihkan atasan bawahan (tercatat di riwayat atasan, sumber "Penonaktifan ...")
 *   3. Akhiri jabatan & keanggotaan regu (nilai lamanya disimpan untuk pembatalan)
 */
export function applyTermination(termination: TerminationRecord, changedBy: string): void {
  const store = getStore();
  const { groupMembers } = getScheduleStore();
  const plan = planTermination(termination.items);
  const source = `Penonaktifan ${termination.document_number ?? ""}`.trim();

  termination.supervisor_change_ids = plan.supervisorChanges.flatMap((change) => {
    const assignment = store.assignments.find((item) => item.id === change.assignmentId);
    if (!assignment) return [];
    return [recordSupervisorChange(assignment, change.toRefs, { changedBy, source, notes: change.reason, terminationId: termination.id })];
  });

  for (const item of termination.items) {
    const endDate = dayBefore(item.effective_date);

    item.ended_assignments = (plan.assignmentIds.get(item.id) ?? []).flatMap((id) => {
      const assignment = store.assignments.find((entry) => entry.id === id);
      if (!assignment) return [];
      const ended = { id, previous_end_date: assignment.end_date };
      assignment.end_date = endDate;
      return [ended];
    });

    item.ended_memberships = (plan.memberIds.get(item.id) ?? []).flatMap((id) => {
      const member = groupMembers.find((entry) => entry.id === id);
      if (!member) return [];
      const ended = { id, previous_end_date: member.end_date };
      // Anggota yang baru akan bergabung setelah TMT: tanggal terakhirnya sebelum tanggal bergabung
      // (keanggotaannya tidak pernah berjalan).
      member.end_date = endDate;
      return [ended];
    });
  }

  termination.status = ACTIVATION_STATUS.effective;
  termination.activated_at = new Date().toISOString();
}

/**
 * Usulan Berlaku DIBATALKAN: semua perubahannya dikembalikan.
 *   1. Atasan bawahan dikembalikan (kecuali yang sudah diubah lagi setelahnya)
 *   2. Jabatan & keanggotaan regu kembali ke TMT selesai sebelumnya
 *
 * Ditolak (hasilnya pesan alasannya) kalau karyawannya sudah DIAKTIFKAN KEMBALI lewat
 * usulan Penambahan (batalkan usulan itu dulu). Hasilnya null kalau berhasil.
 */
export function revertTermination(termination: TerminationRecord, changedBy: string, reason: string): string | null {
  const store = getStore();
  const { groupMembers } = getScheduleStore();
  const employeeIds = termination.items.map((item) => item.employee_id);
  const activatedAt = termination.activated_at ?? "";

  const reactivation = store.activations.find(
    (activation) =>
      activation.status === ACTIVATION_STATUS.effective &&
      (activation.activated_at ?? "") > activatedAt &&
      activation.items.some((item) => employeeIds.includes(item.employee_id)),
  );
  if (reactivation) {
    return "Karyawan di usulan ini sudah diaktifkan kembali lewat usulan Penambahan. Batalkan usulan penambahan itu terlebih dahulu.";
  }

  const source = `Pembatalan Penonaktifan ${termination.document_number ?? ""}`.trim();
  const ourChanges = store.supervisorChanges.filter((change) => termination.supervisor_change_ids.includes(change.id));
  for (const change of [...ourChanges].reverse()) {
    const assignment = store.assignments.find((item) => item.id === change.assignment_id);
    // Kalau atasannya sudah diubah lagi setelah itu, perubahan yang lebih baru dibiarkan.
    if (!assignment || !isSameList(assignment.supervisor_assignment_ids, change.to_ids)) continue;
    recordSupervisorChange(assignment, change.from_ids, { changedBy, source, notes: reason, terminationId: termination.id });
  }

  for (const item of termination.items) {
    for (const ended of item.ended_assignments) {
      const assignment = store.assignments.find((entry) => entry.id === ended.id);
      if (assignment) assignment.end_date = ended.previous_end_date;
    }
    for (const ended of item.ended_memberships) {
      const member = groupMembers.find((entry) => entry.id === ended.id);
      if (member) member.end_date = ended.previous_end_date;
    }
  }

  return null;
}
