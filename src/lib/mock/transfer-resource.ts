/**
 * Usulan mutasi (data mock) -> bentuk yang dikirim ke browser (TransferResource).
 * Id-id diganti nama karyawan, jabatan, sub unit, dst., dan perubahan atasan
 * otomatisnya ikut dihitung.
 */
import { TRANSFER_STATUS } from "@/lib/transfer-rules";
import type {
  TransferItemResource,
  TransferPersonRef,
  TransferResource,
  TransferSupervisorChange,
} from "@/types/api/transfer";

import type { TransferItemRecord, TransferRecord } from "./organization/transfers";
import { getStore, toObjectNames, toSupervisorList } from "./organization-store";
import { toSignerResource } from "./status-document-mock";
import { itemIdOfRef, planSupervisorChanges, type PlanItem } from "./transfer-plan";

/** Alamat file mock usulan mutasi (lihat route /api/transfers/{id}/documents). */
export function transferDocumentUrl(transferId: string, query: string): string {
  return `/api/transfers/${transferId}/documents?${query}`;
}

/** Usulan siap dikirim ke browser. */
export function toTransferResource(transfer: TransferRecord): TransferResource {
  return {
    id: transfer.id,
    type: transfer.type,
    status: transfer.status,
    effective_date: transfer.effective_date,
    notes: transfer.notes,
    basis_document_type: transfer.basis_document_type,
    basis_document_number: transfer.basis_document_number,
    basis_document_date: transfer.basis_document_date,
    basis_document_file: transfer.basis_document_file,
    basis_document_file_url: transfer.basis_document_file ? transferDocumentUrl(transfer.id, "type=dasar") : null,
    basis_document_signer: toSignerResource({
      signer_source: transfer.basis_signer_source,
      signer_assignment_id: transfer.basis_signer_assignment_id,
      signer_name: transfer.basis_signer_name,
      signer_position: transfer.basis_signer_position,
    }),
    decree_number: transfer.decree_number,
    decree_date: transfer.decree_date,
    signer: toSignerResource(transfer),
    document_mode: transfer.document_mode,
    signed_file: transfer.signed_file,
    signed_file_url: transfer.signed_file ? transferDocumentUrl(transfer.id, "type=scan") : null,
    items: transfer.items.map((item) => toTransferItemResource(transfer.id, item)),
    supervisor_changes: toTransferSupervisorChanges(transfer),
    created_at: transfer.created_at,
    created_by: transfer.created_by,
    activated_at: transfer.activated_at,
    cancelled_at: transfer.cancelled_at,
    cancelled_by: transfer.cancelled_by,
    cancel_reason: transfer.cancel_reason,
  };
}

/** Satu karyawan di usulan, siap dikirim ke browser. */
function toTransferItemResource(transferId: string, item: TransferItemRecord): TransferItemResource {
  const { assignments, divisions, employees, positions, subUnits } = getStore();

  const employee = employees.find((entry) => entry.id === item.employee_id);
  const position = positions.find((entry) => entry.id === item.position_id);
  const from = assignments.find((entry) => entry.id === item.from_assignment_id);
  const fromPosition = positions.find((entry) => entry.id === from?.position_id);

  const subUnitName = (id: string | null | undefined) => subUnits.find((entry) => entry.id === id)?.name ?? "-";

  return {
    id: item.id,
    employee: {
      id: item.employee_id,
      name: employee?.name ?? "-",
      nik: employee?.nik ?? null,
      photo_url: employee?.photo_url ?? null,
    },
    from: from
      ? {
          assignment_id: from.id,
          position_title: fromPosition?.title ?? "-",
          brm_level: fromPosition?.brm_level ?? 6,
          job_grade: fromPosition?.job_grade ?? null,
          assignment_status: from.assignment_status,
          sub_unit_name: subUnitName(from.sub_unit_id),
          placement_object_names: toObjectNames(from.placement_object_ids),
        }
      : null,
    to: {
      position_id: item.position_id,
      position_title: position?.title ?? "-",
      brm_level: position?.brm_level ?? 6,
      job_grade: position?.job_grade ?? null,
      division_name: divisions.find((entry) => entry.id === position?.division_id)?.name ?? null,
      assignment_status: item.assignment_status,
      sub_unit_id: item.sub_unit_id,
      sub_unit_name: subUnitName(item.sub_unit_id),
      placement_object_ids: item.placement_object_ids,
      placement_object_names: toObjectNames(item.placement_object_ids),
      supervisors: toSupervisorList(item.supervisor_assignment_ids),
      end_date: item.end_date,
    },
    notes: item.notes,
    restore_subordinates: item.restore_subordinates,
    excerpt_file: item.excerpt_file,
    excerpt_file_url: item.excerpt_file
      ? transferDocumentUrl(transferId, `type=scan-petikan&item=${item.id}`)
      : null,
    new_assignment_id: item.new_assignment_id,
  };
}

/**
 * Perubahan atasan otomatis sebuah usulan:
 *   - Berlaku          -> yang benar-benar terjadi (dari riwayat atasan)
 *   - Draf / Menunggu  -> perkiraan (dihitung dari data sekarang)
 *   - Dibatalkan       -> tidak ada
 */
function toTransferSupervisorChanges(transfer: TransferRecord): TransferSupervisorChange[] {
  if (transfer.status === TRANSFER_STATUS.cancelled) return [];

  if (transfer.applied) {
    const { supervisorChanges } = getStore();
    const createdIds = transfer.items.map((item) => item.new_assignment_id);

    return supervisorChanges
      .filter((change) => transfer.applied?.supervisor_change_ids.includes(change.id))
      .map((change) => {
        const toRef = (id: string): TransferPersonRef => ({ ...personOf(id), is_new: createdIds.includes(id) });

        return {
          assignment_id: change.assignment_id,
          ...subordinateOf(change.assignment_id),
          from: change.from_ids.map(toRef),
          to: change.to_ids.map(toRef),
          reason: change.notes ?? "",
        };
      });
  }

  return previewSupervisorChanges(transfer.items).supervisor_changes;
}

/**
 * Perkiraan perubahan atasan untuk sekumpulan item (belum disimpan pun bisa).
 * Dipakai detail usulan yang belum berlaku, dan POST /api/transfers/preview.
 */
export function previewSupervisorChanges(items: (PlanItem & Pick<TransferItemRecord, "employee_id">)[]) {
  const { assignments } = getStore();
  const plan = planSupervisorChanges(items);

  /** Rujukan rencana -> nama & jabatan. "baru:<item>" = penugasan baru dari usulan ini. */
  function refToPerson(ref: string): TransferPersonRef {
    const itemId = itemIdOfRef(ref);
    if (!itemId) return { ...personOf(ref), is_new: false };

    const item = items.find((entry) => entry.id === itemId);
    return { ...nameAndTitle(item?.employee_id, item?.position_id), is_new: true };
  }

  const supervisor_changes: TransferSupervisorChange[] = plan.changes.map((change) => {
    const assignment = assignments.find((item) => item.id === change.assignmentId);

    return {
      assignment_id: change.assignmentId,
      ...subordinateOf(change.assignmentId),
      from: (assignment?.supervisor_assignment_ids ?? []).map((id) => ({ ...personOf(id), is_new: false })),
      to: change.toRefs.map(refToPerson),
      reason: change.reason,
    };
  });

  return { supervisor_changes, restorable_counts: plan.restorableCounts };
}

/** Nama karyawan & judul jabatan, mis. { name: "Rina Saepudin", position_title: "Asisten Umum" }. */
function nameAndTitle(employeeId: string | undefined, positionId: string | undefined) {
  const { employees, positions } = getStore();

  return {
    name: employees.find((item) => item.id === employeeId)?.name ?? "-",
    position_title: positions.find((item) => item.id === positionId)?.title ?? "-",
  };
}

/** Nama karyawan & judul jabatan sebuah penugasan yang sudah ada. */
function personOf(assignmentId: string) {
  const assignment = getStore().assignments.find((item) => item.id === assignmentId);
  return nameAndTitle(assignment?.employee_id, assignment?.position_id);
}

/** Bawahan yang atasannya berubah: { employee_name, position_title }. */
function subordinateOf(assignmentId: string) {
  const { name, position_title } = personOf(assignmentId);
  return { employee_name: name, position_title };
}
