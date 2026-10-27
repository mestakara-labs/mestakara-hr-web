"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { isActivationEditable } from "@/lib/activation-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { EmployeeProfileResource } from "@/types/api/employee";
import type { ActivationResource } from "@/types/api/employee-activation";
import type { PositionResource } from "@/types/api/organization";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";

import { PenambahanWizard } from "./PenambahanWizard";

interface PenambahanWizardPageProps {
  /** Id usulan Draf yang dilanjutkan. Kosongkan untuk usulan baru. */
  activationId?: string;
  /** Langkah yang dibuka pertama kali (?langkah=) */
  initialStep: number;
}

/**
 * Halaman tambah / lanjutkan usulan Penambahan Karyawan.
 * Ambil dulu semua data pilihan (karyawan, jabatan, sub unit, objek, penugasan, usulan), lalu tampilkan wizard.
 */
export function PenambahanWizardPage({ activationId, initialStep }: PenambahanWizardPageProps) {
  const employees = useApiGet<EmployeeProfileResource[]>("/api/employees");
  const assignments = useApiGet<AssignmentResource[]>("/api/position-assignments");
  const positions = useApiGet<PositionResource[]>("/api/positions");
  const subUnits = useApiGet<SubUnitResource[]>("/api/sub-units");
  const placementObjects = useApiGet<PlacementObjectResource[]>("/api/placement-objects");
  const activations = useApiGet<ActivationResource[]>("/api/employee-activations");
  const requests = [employees, assignments, positions, subUnits, placementObjects, activations];

  if (requests.some((request) => request.loading)) return <PageLoading label="Memuat data penambahan karyawan..." />;
  if (
    !employees.data ||
    !assignments.data ||
    !positions.data ||
    !subUnits.data ||
    !placementObjects.data ||
    !activations.data
  ) {
    return <PageError message={requests.find((request) => request.error)?.error ?? "Data gagal dimuat."} />;
  }

  const data = {
    employees: employees.data,
    assignments: assignments.data,
    positions: positions.data,
    subUnits: subUnits.data,
    placementObjects: placementObjects.data,
    activations: activations.data,
  };

  if (activationId === undefined) return <PenambahanWizard data={data} initialStep={1} />;

  const activation = activations.data.find((item) => item.id === activationId);
  if (!activation) return <PageError message="Usulan penambahan tidak ditemukan." />;
  if (!isActivationEditable(activation.status)) {
    return <PageError message={`Usulan berstatus ${activation.status} tidak bisa diubah.`} />;
  }

  return <PenambahanWizard activation={activation} data={data} initialStep={initialStep} />;
}
