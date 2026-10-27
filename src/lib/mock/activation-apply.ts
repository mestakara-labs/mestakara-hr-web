/**
 * USULAN PENAMBAHAN BERLAKU / DIBATALKAN (data mock).
 *
 *   Berlaku    : setiap karyawan yang punya rencana penempatan dibuatkan PENUGASAN JABATAN
 *                mulai TMT-nya. Status karyawan menjadi Aktif pada TMT (dihitung, lihat
 *                getEmployeeActiveStatus).
 *   Dibatalkan : penugasan yang dibuat usulan ini dihapus lagi; karyawan kembali Belum Aktif
 *                (atau Nonaktif, untuk yang kembali bekerja).
 *
 * Akun login (aktif/nonaktif) belum ada di data mock; di backend ikut diaktifkan kembali.
 */
import { ACTIVATION_STATUS, DOCUMENT_SCOPE } from "@/lib/activation-rules";
import { TRANSFER_STATUS } from "@/lib/transfer-rules";

import type { ActivationRecord } from "./organization/activations";
import { createId, getStore } from "./organization-store";

/** Usulan BERLAKU: buat penugasan dari rencana penempatan. */
export function applyActivation(activation: ActivationRecord) {
  const store = getStore();
  const isCollective = activation.document_scope === DOCUMENT_SCOPE.collective;

  for (const item of activation.items) {
    if (!item.position_id || !item.sub_unit_id || !item.assignment_status) continue;

    // Dokumen dasar penugasan = dokumen kolektif, atau dokumen per orang karyawan ini.
    const document = isCollective ? activation : item;
    const assignmentId = createId("penugasan");

    store.assignments.push({
      id: assignmentId,
      employee_id: item.employee_id,
      position_id: item.position_id,
      sub_unit_id: item.sub_unit_id,
      placement_object_ids: [...item.placement_object_ids],
      assignment_status: item.assignment_status,
      supervisor_assignment_ids: [...item.supervisor_assignment_ids],
      start_date: item.effective_date,
      end_date: item.assignment_end_date,
      decree_type: document.document_type,
      decree_number: document.document_number,
      decree_date: document.document_date,
      decree_file: document.document_file,
      decree_file_data: document.document_file_data,
      notes: `${item.type} (Penambahan Karyawan)`,
      transfer_id: null,
    });
    item.new_assignment_id = assignmentId;
  }

  activation.status = ACTIVATION_STATUS.effective;
  activation.activated_at = new Date().toISOString();
}

/**
 * Usulan Berlaku DIBATALKAN: penugasan yang dibuatnya dihapus.
 * Ditolak (hasilnya pesan alasannya) kalau penugasan itu sudah dipakai di tempat lain:
 *   - karyawan sudah dimutasi lagi dari penugasan itu, atau
 *   - ada karyawan lain yang beratasan penugasan itu.
 * Hasilnya null kalau berhasil.
 */
export function revertActivation(activation: ActivationRecord): string | null {
  const store = getStore();
  const createdIds = activation.items.flatMap((item) => (item.new_assignment_id ? [item.new_assignment_id] : []));
  const nameOf = (employeeId: string) => store.employees.find((item) => item.id === employeeId)?.name ?? "-";

  const laterTransfer = store.transfers.find(
    (transfer) =>
      transfer.status !== TRANSFER_STATUS.cancelled &&
      transfer.items.some((item) => item.from_assignment_id && createdIds.includes(item.from_assignment_id)),
  );
  if (laterTransfer) {
    return `Karyawan di usulan ini sudah dimutasi lewat usulan ${laterTransfer.decree_number ?? "lain (Draf)"}. Batalkan usulan itu terlebih dahulu.`;
  }

  const subordinate = store.assignments.find(
    (assignment) =>
      !createdIds.includes(assignment.id) &&
      assignment.supervisor_assignment_ids.some((id) => createdIds.includes(id)),
  );
  if (subordinate) {
    return `${nameOf(subordinate.employee_id)} beratasan karyawan dari usulan ini. Ubah atasannya lewat "Ubah Atasan" terlebih dahulu.`;
  }

  store.assignments = store.assignments.filter((item) => !createdIds.includes(item.id));
  store.supervisorChanges = store.supervisorChanges.filter((change) => !createdIds.includes(change.assignment_id));
  for (const item of activation.items) item.new_assignment_id = null;

  return null;
}
