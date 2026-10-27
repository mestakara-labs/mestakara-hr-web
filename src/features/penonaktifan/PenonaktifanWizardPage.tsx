"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { isTerminationEditable } from "@/lib/termination-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { EmployeeProfileResource } from "@/types/api/employee";
import type { ActivationResource } from "@/types/api/employee-activation";
import type { TerminationResource } from "@/types/api/employee-termination";

import { PenonaktifanWizard } from "./PenonaktifanWizard";

/**
 * Halaman tambah / lanjutkan usulan Penonaktifan Karyawan.
 * Ambil dulu data pilihan (karyawan, penugasan, usulan penonaktifan & penambahan), lalu tampilkan wizard.
 * `terminationId` kosong = usulan baru.
 */
export function PenonaktifanWizardPage({ terminationId }: { terminationId?: string }) {
  const employees = useApiGet<EmployeeProfileResource[]>("/api/employees");
  const assignments = useApiGet<AssignmentResource[]>("/api/position-assignments");
  const terminations = useApiGet<TerminationResource[]>("/api/employee-terminations");
  const activations = useApiGet<ActivationResource[]>("/api/employee-activations");
  const requests = [employees, assignments, terminations, activations];

  if (requests.some((request) => request.loading)) return <PageLoading label="Memuat data penonaktifan karyawan..." />;
  if (!employees.data || !assignments.data || !terminations.data || !activations.data) {
    return <PageError message={requests.find((request) => request.error)?.error ?? "Data gagal dimuat."} />;
  }

  const data = {
    employees: employees.data,
    assignments: assignments.data,
    terminations: terminations.data,
    activations: activations.data,
  };

  if (terminationId === undefined) return <PenonaktifanWizard data={data} />;

  const termination = terminations.data.find((item) => item.id === terminationId);
  if (!termination) return <PageError message="Usulan penonaktifan tidak ditemukan." />;
  if (!isTerminationEditable(termination.status)) {
    return <PageError message={`Usulan berstatus ${termination.status} tidak bisa diubah.`} />;
  }

  return <PenonaktifanWizard termination={termination} data={data} />;
}
