/**
 * USULAN PENAMBAHAN siap dikirim ke browser: id-id diganti nama karyawan, jabatan,
 * sub unit, objek, atasan, dan alamat file dokumennya.
 */
import { DOCUMENT_SCOPE } from "@/lib/activation-rules";
import { findMissingEmployeeFields } from "@/lib/employee-rules";
import type {
  ActivationItemResource,
  ActivationResource,
  PlacementPlanResource,
} from "@/types/api/employee-activation";

import type { ActivationItemRecord, ActivationRecord } from "./organization/activations";
import { getEmployeeActiveStatus, getStore, toObjectNames, toSupervisorList } from "./organization-store";
import { hasStoredDocument, toDocumentResource } from "./status-document-mock";

/** Alamat file dokumen usulan: kolektif (tanpa item) atau per orang. */
export function activationFileUrl(activationId: string, itemId: string | null): string {
  const query = itemId ? `?item=${encodeURIComponent(itemId)}` : "";
  return `/api/employee-activations/${activationId}/files${query}`;
}

export function toActivationResource(activation: ActivationRecord): ActivationResource {
  const isCollective = activation.document_scope === DOCUMENT_SCOPE.collective;
  const missingDocumentCount = isCollective
    ? hasStoredDocument(activation)
      ? 0
      : activation.items.length
    : activation.items.filter((item) => !hasStoredDocument(item)).length;

  return {
    id: activation.id,
    status: activation.status,
    document_scope: activation.document_scope,
    document: isCollective ? toDocumentResource(activation, activationFileUrl(activation.id, null)) : null,
    notes: activation.notes,
    items: activation.items.map((item) => toItemResource(activation, item)),
    missing_document_count: missingDocumentCount,
    created_at: activation.created_at,
    created_by: activation.created_by,
    activated_at: activation.activated_at,
    cancelled_at: activation.cancelled_at,
    cancelled_by: activation.cancelled_by,
    cancel_reason: activation.cancel_reason,
  };
}

function toItemResource(activation: ActivationRecord, item: ActivationItemRecord): ActivationItemResource {
  const employee = getStore().employees.find((entry) => entry.id === item.employee_id);
  const isPerPerson = activation.document_scope === DOCUMENT_SCOPE.perPerson;

  return {
    id: item.id,
    employee: {
      id: item.employee_id,
      name: employee?.name ?? "-",
      nik: employee?.nik ?? null,
      photo_url: employee?.photo_url ?? null,
      employment_status: employee?.employment_status ?? "-",
      active_status: getEmployeeActiveStatus(item.employee_id),
      missing_fields: employee ? findMissingEmployeeFields(employee) : [],
    },
    type: item.type,
    effective_date: item.effective_date,
    origin_unit: item.origin_unit,
    document: isPerPerson ? toDocumentResource(item, activationFileUrl(activation.id, item.id)) : null,
    placement: toPlacementPlan(item),
    new_assignment_id: item.new_assignment_id,
    notes: item.notes,
  };
}

/** Rencana penempatan -> bentuk API. null kalau karyawan ini belum ditempatkan. */
function toPlacementPlan(item: ActivationItemRecord): PlacementPlanResource | null {
  if (!item.position_id) return null;

  const { positions, subUnits } = getStore();
  const position = positions.find((entry) => entry.id === item.position_id);

  return {
    position_id: item.position_id,
    position_title: position?.title ?? "-",
    brm_level: position?.brm_level ?? 0,
    job_grade: position?.job_grade ?? null,
    assignment_status: item.assignment_status ?? "",
    sub_unit_id: item.sub_unit_id ?? "",
    sub_unit_name: subUnits.find((entry) => entry.id === item.sub_unit_id)?.name ?? "-",
    placement_object_ids: item.placement_object_ids,
    placement_object_names: toObjectNames(item.placement_object_ids),
    supervisors: toSupervisorList(item.supervisor_assignment_ids),
    end_date: item.assignment_end_date,
  };
}
