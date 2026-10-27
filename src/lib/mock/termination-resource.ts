/**
 * USULAN PENONAKTIFAN siap dikirim ke browser: id-id diganti nama karyawan, alamat file
 * dokumennya, dan DAMPAK per karyawan (perkiraan untuk Draf, yang diterapkan untuk Berlaku).
 */
import { ACTIVATION_STATUS, DOCUMENT_SCOPE } from "@/lib/activation-rules";
import type { TerminationImpact, TerminationResource } from "@/types/api/employee-termination";

import type { TerminationRecord } from "./organization/terminations";
import { getEmployeeActiveStatus, getStore } from "./organization-store";
import { hasStoredDocument, toDocumentResource } from "./status-document-mock";
import { toAppliedImpact, toPlannedImpacts } from "./termination-apply";

/** Alamat file dokumen usulan: kolektif (tanpa item) atau per orang. */
export function terminationFileUrl(terminationId: string, itemId: string | null): string {
  const query = itemId ? `?item=${encodeURIComponent(itemId)}` : "";
  return `/api/employee-terminations/${terminationId}/files${query}`;
}

export function toTerminationResource(termination: TerminationRecord): TerminationResource {
  const { employees } = getStore();
  const isCollective = termination.document_scope === DOCUMENT_SCOPE.collective;
  const missingDocumentCount = isCollective
    ? hasStoredDocument(termination)
      ? 0
      : termination.items.length
    : termination.items.filter((item) => !hasStoredDocument(item)).length;

  // Draf: perkiraan dari data sekarang. Dibatalkan: tidak ada dampak.
  const plannedImpacts = termination.status === ACTIVATION_STATUS.draft ? toPlannedImpacts(termination.items) : {};
  const impactOf = (item: TerminationRecord["items"][number]): TerminationImpact | null => {
    if (termination.status === ACTIVATION_STATUS.effective) return toAppliedImpact(termination, item);
    return plannedImpacts[item.id] ?? null;
  };

  return {
    id: termination.id,
    status: termination.status,
    document_scope: termination.document_scope,
    document: isCollective ? toDocumentResource(termination, terminationFileUrl(termination.id, null)) : null,
    notes: termination.notes,
    items: termination.items.map((item) => {
      const employee = employees.find((entry) => entry.id === item.employee_id);
      return {
        id: item.id,
        employee: {
          id: item.employee_id,
          name: employee?.name ?? "-",
          nik: employee?.nik ?? null,
          photo_url: employee?.photo_url ?? null,
          employment_status: employee?.employment_status ?? "-",
          active_status: getEmployeeActiveStatus(item.employee_id),
        },
        type: item.type,
        effective_date: item.effective_date,
        reason: item.reason,
        destination_unit: item.destination_unit,
        document: isCollective ? null : toDocumentResource(item, terminationFileUrl(termination.id, item.id)),
        impact: impactOf(item),
        notes: item.notes,
      };
    }),
    missing_document_count: missingDocumentCount,
    created_at: termination.created_at,
    created_by: termination.created_by,
    activated_at: termination.activated_at,
    cancelled_at: termination.cancelled_at,
    cancelled_by: termination.cancelled_by,
    cancel_reason: termination.cancel_reason,
  };
}
