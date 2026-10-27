/**
 * LOGIKA INTI MUTASI & PENEMPATAN (data mock):
 *
 *   planSupervisorChanges()  hitung perubahan atasan OTOMATIS (perkiraan & penerapan)
 *   applyTransfer()          usulan BERLAKU: penugasan baru dibuat, lama diakhiri, atasan dialihkan
 *   revertTransfer()         usulan Berlaku DIBATALKAN: semua perubahan di atas dikembalikan
 *
 * ATURAN PENGALIHAN ATASAN OTOMATIS
 *   Kalau pemegang jabatan X diakhiri penugasannya oleh usulan ini, bawahannya dialihkan:
 *     a. ke pemegang BARU jabatan X, kalau di usulan yang SAMA ada karyawan yang ditempatkan di X;
 *     b. kalau tidak ada, ke ATASAN dari pemegang lama (naik satu tingkat), mis. BRM-4 -> BRM-2.
 *   Pengalihan (b) dicatat dengan "jabatan yang kosong", supaya nanti saat jabatan X terisi lagi,
 *   bawahannya bisa DIKEMBALIKAN ke pemegang baru (pilihan "Kembalikan bawahan").
 */
import { getAssignmentPeriod } from "@/lib/assignment-rules";
import { dayBefore, TRANSFER_STATUS } from "@/lib/transfer-rules";

import type { AssignmentRecord } from "./organization/assignments";
import type { TransferItemRecord, TransferRecord } from "./organization/transfers";
import { createId, getStore } from "./organization-store";
import { recordSupervisorChange } from "./supervisor-mock";

// ---------------------------------------------------------------------------
// Rujukan atasan
// ---------------------------------------------------------------------------

/**
 * Di dalam rencana, atasan bisa berupa penugasan yang SUDAH ADA (id penugasan biasa),
 * atau penugasan BARU dari usulan ini yang belum dibuat — ditulis "baru:<id item>".
 */
const NEW_PREFIX = "baru:";

/** Rujukan ke penugasan baru dari item usulan, mis. "baru:item-1". */
export function newRef(itemId: string): string {
  return `${NEW_PREFIX}${itemId}`;
}

/** "baru:item-1" -> "item-1". null kalau rujukannya penugasan yang sudah ada. */
export function itemIdOfRef(ref: string): string | null {
  return ref.startsWith(NEW_PREFIX) ? ref.slice(NEW_PREFIX.length) : null;
}

// ---------------------------------------------------------------------------
// Rencana perubahan atasan
// ---------------------------------------------------------------------------

/** Bagian item yang dibutuhkan untuk menghitung rencana. */
export type PlanItem = Pick<TransferItemRecord, "id" | "from_assignment_id" | "position_id" | "restore_subordinates">;

/** Satu perubahan atasan otomatis yang direncanakan. */
export interface PlannedChange {
  /** Penugasan bawahan yang atasannya berubah */
  assignmentId: string;
  /** Atasan barunya (rujukan, lihat newRef) */
  toRefs: string[];
  reason: string;
  /** Diisi kalau bawahan dialihkan ke atas karena jabatan atasannya kosong */
  vacatedPositionId: string | null;
}

export interface SupervisorPlan {
  changes: PlannedChange[];
  /** Jumlah bawahan yang BISA dikembalikan ke pemegang baru, per jabatan tujuan */
  restorableCounts: Record<string, number>;
  /** Ganti atasan yang ikut diakhiri usulan ini dengan penggantinya (untuk atasan penugasan baru). */
  resolve: (supervisorIds: string[]) => string[];
}

/** Buang yang kembar, mis. ["a", "b", "a"] -> ["a", "b"]. */
function unique(values: string[]): string[] {
  return [...new Set(values)];
}

/** ["a", "b"] dan ["b", "a"] dianggap sama. */
export function isSameList(first: string[], second: string[]): boolean {
  return first.length === second.length && first.every((item) => second.includes(item));
}

/** Penugasan yang belum selesai (sedang berjalan, atau akan datang). */
function isCurrent(assignment: AssignmentRecord): boolean {
  return getAssignmentPeriod(assignment) !== "Selesai";
}

/**
 * Hitung perubahan atasan otomatis untuk sekumpulan item usulan, TANPA mengubah data.
 * Dipakai untuk perkiraan (sebelum berlaku) dan saat usulan diterapkan.
 */
export function planSupervisorChanges(items: PlanItem[]): SupervisorPlan {
  const { assignments, supervisorChanges } = getStore();
  const endedIds = new Set(items.flatMap((item) => (item.from_assignment_id ? [item.from_assignment_id] : [])));

  const positionOf = (assignmentId: string) => assignments.find((item) => item.id === assignmentId)?.position_id;
  /** Pemegang BARU sebuah jabatan dari usulan ini (sebagai rujukan "baru:..."). */
  const newHoldersOf = (positionId: string | undefined) =>
    items.filter((item) => item.position_id === positionId).map((item) => newRef(item.id));

  /** Pengganti atasan yang diakhiri: pemegang baru jabatannya, atau naik ke atasannya. */
  function replacementOf(endedId: string, visited: Set<string>): string[] {
    if (visited.has(endedId)) return [];
    visited.add(endedId);

    const ended = assignments.find((item) => item.id === endedId);
    if (!ended) return [];

    const newHolders = newHoldersOf(ended.position_id);
    if (newHolders.length > 0) return newHolders;

    return ended.supervisor_assignment_ids.flatMap((id) => (endedIds.has(id) ? replacementOf(id, visited) : [id]));
  }

  function resolve(supervisorIds: string[]): string[] {
    return unique(supervisorIds.flatMap((id) => (endedIds.has(id) ? replacementOf(id, new Set()) : [id])));
  }

  const changes: PlannedChange[] = [];

  // Langkah 1: bawahan dari penugasan yang diakhiri usulan ini.
  for (const assignment of assignments) {
    if (!isCurrent(assignment) || endedIds.has(assignment.id)) continue;

    const endedSupervisorIds = assignment.supervisor_assignment_ids.filter((id) => endedIds.has(id));
    if (endedSupervisorIds.length === 0) continue;

    const vacantId = endedSupervisorIds.find((id) => newHoldersOf(positionOf(id)).length === 0);

    changes.push({
      assignmentId: assignment.id,
      toRefs: resolve(assignment.supervisor_assignment_ids),
      reason: vacantId
        ? "Atasan dimutasi dan jabatannya kosong, dialihkan ke atasan berikutnya"
        : "Atasan dimutasi, dialihkan ke pemegang baru jabatan tersebut",
      vacatedPositionId: vacantId ? (positionOf(vacantId) ?? null) : null,
    });
  }

  // Langkah 2: bawahan yang dulu dialihkan ke atas, dikembalikan ke pemegang baru.
  const changedIds = new Set(changes.map((change) => change.assignmentId));
  const restorableCounts: Record<string, number> = {};

  for (const positionId of unique(items.map((item) => item.position_id))) {
    const candidates = assignments.filter((assignment) => {
      if (!isCurrent(assignment) || endedIds.has(assignment.id) || changedIds.has(assignment.id)) return false;

      // Perubahan atasan TERAKHIR karyawan ini harus "dialihkan ke atas karena jabatan ini kosong",
      // dan atasannya belum diubah lagi sejak itu.
      const lastChange = supervisorChanges
        .filter((change) => change.assignment_id === assignment.id)
        .sort((a, b) => b.changed_at.localeCompare(a.changed_at))[0];

      return (
        lastChange?.vacated_position_id === positionId &&
        isSameList(lastChange.to_ids, assignment.supervisor_assignment_ids)
      );
    });

    restorableCounts[positionId] = candidates.length;

    const isRequested = items.some((item) => item.position_id === positionId && item.restore_subordinates);
    if (!isRequested) continue;

    for (const candidate of candidates) {
      changes.push({
        assignmentId: candidate.id,
        toRefs: newHoldersOf(positionId),
        reason: "Dikembalikan ke pemegang baru jabatan atasannya",
        vacatedPositionId: null,
      });
      changedIds.add(candidate.id);
    }
  }

  return { changes, restorableCounts, resolve };
}

// ---------------------------------------------------------------------------
// Penerapan & pembatalan
// ---------------------------------------------------------------------------

/**
 * Usulan BERLAKU. Urutannya:
 *   1. Hitung rencana pengalihan atasan (dari data SEBELUM diubah)
 *   2. Buat penugasan baru untuk setiap karyawan (berlaku mulai TMT)
 *   3. Akhiri penugasan lama (TMT Selesai = sehari sebelum TMT baru)
 *   4. Alihkan atasan bawahan (tercatat di riwayat atasan)
 */
export function applyTransfer(transfer: TransferRecord, changedBy: string): void {
  const store = getStore();
  const effectiveDate = transfer.effective_date ?? "";
  const source = `Mutasi ${transfer.decree_number ?? ""}`.trim();

  // 1. Rencana
  const plan = planSupervisorChanges(transfer.items);

  // 2. Penugasan baru. Id-nya dibuat dulu, supaya rujukan "baru:..." bisa diganti id sungguhan.
  const newIdOfItem = new Map(transfer.items.map((item) => [item.id, createId("penugasan")]));
  const toRealId = (ref: string) => {
    const itemId = itemIdOfRef(ref);
    return itemId ? (newIdOfItem.get(itemId) ?? ref) : ref;
  };

  for (const item of transfer.items) {
    const newId = newIdOfItem.get(item.id) ?? createId("penugasan");

    store.assignments.push({
      id: newId,
      employee_id: item.employee_id,
      position_id: item.position_id,
      sub_unit_id: item.sub_unit_id,
      placement_object_ids: [...item.placement_object_ids],
      assignment_status: item.assignment_status,
      supervisor_assignment_ids: plan.resolve(item.supervisor_assignment_ids).map(toRealId),
      start_date: effectiveDate,
      end_date: item.end_date,
      decree_type: "SK",
      decree_number: transfer.decree_number,
      decree_date: transfer.decree_date,
      // Petikan SK karyawan ini (kalau sudah diunggah) menggantikan SK kolektif.
      decree_file: item.excerpt_file ?? transfer.signed_file,
      decree_file_data: item.excerpt_file ? item.excerpt_file_data : transfer.signed_file_data,
      notes: item.notes,
      transfer_id: transfer.id,
    });

    item.new_assignment_id = newId;
  }

  // 3. Penugasan lama diakhiri.
  const ended: { assignment_id: string; previous_end_date: string | null }[] = [];

  for (const item of transfer.items) {
    const oldAssignment = store.assignments.find((assignment) => assignment.id === item.from_assignment_id);
    if (!oldAssignment) continue;

    ended.push({ assignment_id: oldAssignment.id, previous_end_date: oldAssignment.end_date });
    oldAssignment.end_date = dayBefore(effectiveDate);
  }

  // 4. Atasan bawahan dialihkan.
  const supervisorChangeIds = plan.changes.flatMap((change) => {
    const assignment = store.assignments.find((item) => item.id === change.assignmentId);
    if (!assignment) return [];

    return [
      recordSupervisorChange(assignment, change.toRefs.map(toRealId), {
        changedBy,
        source,
        notes: change.reason,
        transferId: transfer.id,
        vacatedPositionId: change.vacatedPositionId ?? undefined,
      }),
    ];
  });

  transfer.applied = { ended, supervisor_change_ids: supervisorChangeIds };
  transfer.status = TRANSFER_STATUS.effective;
  transfer.activated_at = new Date().toISOString();
}

/**
 * Usulan Berlaku DIBATALKAN: semua perubahannya dikembalikan.
 *   1. Atasan bawahan dikembalikan (tercatat di riwayat atasan)
 *   2. Penugasan lama diaktifkan lagi
 *   3. Penugasan baru dihapus
 *
 * Ditolak (hasilnya pesan alasannya) kalau:
 *   - karyawan di usulan ini sudah dimutasi lagi lewat usulan lain,
 *   - atasan yang diubah usulan ini sudah diubah lagi oleh usulan lain yang lebih baru, atau
 *   - ada karyawan lain yang SEKARANG beratasan penugasan baru dari usulan ini,
 *     tapi bukan karena usulan ini (mis. lewat "Ubah Atasan").
 * Hasilnya null kalau berhasil.
 */
export function revertTransfer(transfer: TransferRecord, changedBy: string, reason: string): string | null {
  const store = getStore();
  const applied = transfer.applied;
  if (!applied) return null;

  const createdIds = transfer.items.flatMap((item) => (item.new_assignment_id ? [item.new_assignment_id] : []));
  const nameOf = (employeeId: string) => store.employees.find((item) => item.id === employeeId)?.name ?? "-";

  // Pemeriksaan 1: sudah dimutasi lagi?
  const laterTransfer = store.transfers.find(
    (other) =>
      other.id !== transfer.id &&
      other.status !== TRANSFER_STATUS.cancelled &&
      other.items.some((item) => item.from_assignment_id && createdIds.includes(item.from_assignment_id)),
  );
  if (laterTransfer) {
    return `Karyawan di usulan ini sudah dimutasi lagi lewat usulan ${laterTransfer.decree_number ?? "lain (Draf)"}. Batalkan usulan itu terlebih dahulu.`;
  }

  // Pemeriksaan 2: atasan yang diubah usulan ini sudah diubah lagi oleh usulan LAIN yang lebih baru?
  const ourChanges = store.supervisorChanges.filter((change) => applied.supervisor_change_ids.includes(change.id));
  const laterChange = store.supervisorChanges.find((change) =>
    ourChanges.some(
      (ours) =>
        change.assignment_id === ours.assignment_id &&
        change.changed_at > ours.changed_at &&
        change.transfer_id !== null &&
        change.transfer_id !== transfer.id,
    ),
  );
  const laterChangeTransfer = store.transfers.find(
    (other) => other.id === laterChange?.transfer_id && other.status !== TRANSFER_STATUS.cancelled,
  );
  if (laterChangeTransfer) {
    return `Atasan beberapa karyawan sudah diubah lagi oleh usulan ${laterChangeTransfer.decree_number ?? "lain"}. Batalkan usulan itu terlebih dahulu.`;
  }

  // Pemeriksaan 3: ada yang beratasan penugasan baru, bukan karena usulan ini?
  const blocking = store.assignments.find((assignment) => {
    if (createdIds.includes(assignment.id)) return false;
    if (!assignment.supervisor_assignment_ids.some((id) => createdIds.includes(id))) return false;

    const ourChange = ourChanges.find((change) => change.assignment_id === assignment.id);
    return !ourChange || !isSameList(ourChange.to_ids, assignment.supervisor_assignment_ids);
  });
  if (blocking) {
    return `${nameOf(blocking.employee_id)} sekarang beratasan karyawan dari usulan ini. Ubah atasannya lewat "Ubah Atasan" terlebih dahulu.`;
  }

  const source = `Pembatalan Mutasi ${transfer.decree_number ?? ""}`.trim();

  // 1. Atasan dikembalikan (dari perubahan terakhir ke yang pertama).
  for (const change of [...ourChanges].reverse()) {
    const assignment = store.assignments.find((item) => item.id === change.assignment_id);
    if (!assignment || createdIds.includes(assignment.id)) continue;
    // Kalau atasannya sudah diubah lagi setelah itu, perubahan yang lebih baru dibiarkan.
    if (!isSameList(assignment.supervisor_assignment_ids, change.to_ids)) continue;

    recordSupervisorChange(assignment, change.from_ids, { changedBy, source, notes: reason, transferId: transfer.id });
  }

  // 2. Penugasan lama aktif lagi.
  for (const ended of applied.ended) {
    const assignment = store.assignments.find((item) => item.id === ended.assignment_id);
    if (assignment) assignment.end_date = ended.previous_end_date;
  }

  // 3. Penugasan baru (beserta riwayat atasannya) dihapus.
  store.assignments = store.assignments.filter((item) => !createdIds.includes(item.id));
  store.supervisorChanges = store.supervisorChanges.filter((change) => !createdIds.includes(change.assignment_id));
  for (const item of transfer.items) item.new_assignment_id = null;

  transfer.applied = null;
  return null;
}
