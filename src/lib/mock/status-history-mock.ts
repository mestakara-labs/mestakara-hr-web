/**
 * Pengganti backend `GET /employees/{id}/status-history`: RIWAYAT STATUS KEPEGAWAIAN satu karyawan,
 * yaitu setiap kali diaktifkan (usulan Penambahan) atau dinonaktifkan (usulan Penonaktifan).
 * Usulan Draf tidak ikut; usulan Dibatalkan ikut (dengan statusnya). Terbaru di atas.
 */
import { ACTIVATION_STATUS, DOCUMENT_SCOPE } from "@/lib/activation-rules";
import type { EmployeeStatusEvent } from "@/types/api/employee-activation";

import { activationFileUrl } from "./activation-resource";
import { failure, success, type MockResult } from "./mock-response";
import type { StoredDocument } from "./organization/activations";
import { getStore } from "./organization-store";
import { toDocumentResource } from "./status-document-mock";
import { terminationFileUrl } from "./termination-resource";

/** Bagian usulan yang dibutuhkan riwayat (Penambahan & Penonaktifan bentuknya sama). */
interface Usulan extends StoredDocument {
  id: string;
  status: string;
  document_scope: string;
}

/** Dokumen dasar satu karyawan: kolektif milik usulan, atau per orang milik itemnya. */
function documentOf(usulan: Usulan, item: StoredDocument & { id: string }, fileUrl: typeof activationFileUrl) {
  return usulan.document_scope === DOCUMENT_SCOPE.collective
    ? toDocumentResource(usulan, fileUrl(usulan.id, null))
    : toDocumentResource(item, fileUrl(usulan.id, item.id));
}

export function mockGetEmployeeStatusHistory(employeeId: string): MockResult<EmployeeStatusEvent[] | null> {
  const { activations, employees, terminations } = getStore();
  if (!employees.some((item) => item.id === employeeId)) return failure(404, "Karyawan tidak ditemukan.");

  const isShown = (usulan: Usulan) => usulan.status !== ACTIVATION_STATUS.draft;

  const added = activations.filter(isShown).flatMap((activation) =>
    activation.items
      .filter((item) => item.employee_id === employeeId)
      .map(
        (item): EmployeeStatusEvent => ({
          kind: "Penambahan",
          type: item.type,
          effective_date: item.effective_date,
          status: activation.status,
          source_id: activation.id,
          source_url: `/dashboard/penambahan/${activation.id}`,
          description: item.origin_unit ? `Unit asal: ${item.origin_unit}` : item.notes,
          document: documentOf(activation, item, activationFileUrl),
        }),
      ),
  );

  const removed = terminations.filter(isShown).flatMap((termination) =>
    termination.items
      .filter((item) => item.employee_id === employeeId)
      .map(
        (item): EmployeeStatusEvent => ({
          kind: "Penonaktifan",
          type: item.type,
          effective_date: item.effective_date,
          status: termination.status,
          source_id: termination.id,
          source_url: `/dashboard/penonaktifan/${termination.id}`,
          description: item.destination_unit ? `Unit tujuan: ${item.destination_unit}` : (item.reason ?? item.notes),
          document: documentOf(termination, item, terminationFileUrl),
        }),
      ),
  );

  const events = [...added, ...removed].sort((a, b) => b.effective_date.localeCompare(a.effective_date));
  return success("Riwayat status kepegawaian", events);
}
