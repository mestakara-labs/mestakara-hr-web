/**
 * DATA CONTOH (MOCK) ATUR ATASAN — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler:
 *   - POST /api/position-assignments/supervisors              (ubah atasan, satu atau banyak sekaligus)
 *   - GET  /api/position-assignments/{id}/supervisor-history  (riwayat atasan satu penugasan)
 *
 * Mengubah atasan TIDAK butuh SK, tapi setiap perubahan dicatat di riwayat atasan.
 * Aturan calon atasan sama dengan di browser (lihat canBeSupervisor di assignment-rules.ts).
 */
import { canBeSupervisor, isAssignmentActive, needsSupervisor } from "@/lib/assignment-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { SupervisorChangePayload, SupervisorChangeResource } from "@/types/api/supervisor-change";

import { failure, success, type MockResult } from "./mock-response";
import type { AssignmentRecord } from "./organization/assignments";
import { createId, getStore, toAssignmentResource, toSupervisorChangeResource } from "./organization-store";

/** Asal perubahan untuk perubahan lewat tombol "Ubah Atasan". */
const MANUAL_SOURCE = "Manual";

/**
 * Pengganti backend `POST /position-assignments/supervisors`.
 * Penugasan yang atasannya memang sudah sama dilewati (tidak dicatat di riwayat).
 *
 * @param changedBy  nama pengguna yang sedang login
 */
export function mockChangeSupervisors(
  payload: SupervisorChangePayload,
  changedBy: string,
): MockResult<AssignmentResource[] | null> {
  const errors = validateSupervisorChange(payload);
  if (errors) return failure(422, "Isian atasan belum benar.", errors);

  const { assignments } = getStore();
  const targets = assignments.filter((item) => payload.assignment_ids.includes(item.id));
  const changed = targets.filter((target) => !isSameList(target.supervisor_assignment_ids, payload.supervisor_assignment_ids));

  if (changed.length === 0) {
    return failure(422, "Isian atasan belum benar.", {
      supervisor_assignment_ids: ["Atasan yang dipilih sama dengan atasan sekarang"],
    });
  }

  for (const target of changed) {
    recordSupervisorChange(target, payload.supervisor_assignment_ids, {
      changedBy,
      source: MANUAL_SOURCE,
      notes: payload.notes.trim() || null,
    });
  }

  return success(`Atasan ${changed.length} karyawan berhasil diubah.`, changed.map(toAssignmentResource));
}

/** Pengganti backend `GET /position-assignments/{id}/supervisor-history`. Terbaru di atas. */
export function mockGetSupervisorHistory(assignmentId: string): MockResult<SupervisorChangeResource[] | null> {
  const { assignments, supervisorChanges } = getStore();
  if (!assignments.some((item) => item.id === assignmentId)) return failure(404, "Penugasan jabatan tidak ditemukan.");

  const history = supervisorChanges
    .filter((change) => change.assignment_id === assignmentId)
    .sort((a, b) => b.changed_at.localeCompare(a.changed_at));

  return success("Riwayat atasan", history.map(toSupervisorChangeResource));
}

/**
 * Ganti atasan sebuah penugasan SEKALIGUS mencatatnya di riwayat atasan.
 * Dipakai "Ubah Atasan" dan mutasi (pengalihan bawahan otomatis). Hasilnya id catatan riwayatnya.
 */
export function recordSupervisorChange(
  assignment: AssignmentRecord,
  newSupervisorIds: string[],
  info: {
    changedBy: string;
    source: string;
    notes: string | null;
    /** Usulan mutasi penyebabnya (kosongkan untuk perubahan manual) */
    transferId?: string;
    /** Usulan penonaktifan penyebabnya */
    terminationId?: string;
    /** Jabatan atasan yang kosong, kalau bawahan dialihkan ke atas (lihat SupervisorChangeRecord) */
    vacatedPositionId?: string;
  },
): string {
  const id = createId("riwayat-atasan");

  getStore().supervisorChanges.push({
    id,
    assignment_id: assignment.id,
    from_ids: [...assignment.supervisor_assignment_ids],
    to_ids: [...newSupervisorIds],
    changed_at: new Date().toISOString(),
    changed_by: info.changedBy,
    source: info.source,
    notes: info.notes,
    transfer_id: info.transferId ?? null,
    termination_id: info.terminationId ?? null,
    vacated_position_id: info.vacatedPositionId ?? null,
  });

  assignment.supervisor_assignment_ids = [...newSupervisorIds];

  return id;
}

/** ["a", "b"] dan ["b", "a"] dianggap sama. */
function isSameList(first: string[], second: string[]): boolean {
  return first.length === second.length && first.every((item) => second.includes(item));
}

/**
 * Periksa isian Ubah Atasan. Hasilnya pesan error per isian, atau null kalau semua benar.
 *   - Penugasan yang diubah: minimal satu, semuanya ada dan masih AKTIF.
 *   - Atasan baru: wajib kalau salah satu jabatannya BRM-2 ke bawah, dan setiap atasan
 *     harus memenuhi syarat untuk SEMUA penugasan yang dipilih.
 */
function validateSupervisorChange(payload: SupervisorChangePayload): Record<string, string[]> | null {
  const { assignments, positions } = getStore();
  const brmLevelOf = (assignment: AssignmentRecord) =>
    positions.find((item) => item.id === assignment.position_id)?.brm_level ?? null;

  const targets = assignments.filter((item) => payload.assignment_ids.includes(item.id));
  if (payload.assignment_ids.length === 0) {
    return { assignment_ids: ["Pilih minimal satu karyawan"] };
  }
  if (targets.length !== payload.assignment_ids.length) {
    return { assignment_ids: ["Penugasan jabatan tidak ditemukan"] };
  }
  if (targets.some((target) => !isAssignmentActive(target))) {
    return { assignment_ids: ["Atasan hanya bisa diubah untuk penugasan yang masih aktif"] };
  }

  if (payload.supervisor_assignment_ids.length === 0) {
    const needsOne = targets.some((target) => needsSupervisor(brmLevelOf(target)));
    return needsOne ? { supervisor_assignment_ids: ["Pilih minimal satu Atasan Langsung"] } : null;
  }

  const allValid = payload.supervisor_assignment_ids.every((supervisorId) => {
    const supervisor = assignments.find((item) => item.id === supervisorId);
    if (!supervisor) return false;

    const candidate = {
      id: supervisor.id,
      employee_id: supervisor.employee_id,
      brm_level: brmLevelOf(supervisor) ?? 6,
      is_active: isAssignmentActive(supervisor),
    };

    return targets.every((target) => canBeSupervisor(candidate, brmLevelOf(target), target.employee_id, target.id));
  });

  if (!allValid) {
    return {
      supervisor_assignment_ids: [
        "Atasan Langsung harus penugasan aktif karyawan lain dengan level BRM lebih tinggi dari semua karyawan yang dipilih",
      ],
    };
  }

  return null;
}
