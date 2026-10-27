"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { DEFINITIVE_STATUS } from "@/lib/assignment-rules";
import { isTransferEditable } from "@/lib/transfer-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { EmployeeProfileResource } from "@/types/api/employee";
import type { PositionResource } from "@/types/api/organization";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";
import type { TransferResource } from "@/types/api/transfer";

import { MutasiWizard } from "./MutasiWizard";

interface MutasiWizardPageProps {
  /** Id usulan yang diubah. Kosongkan untuk usulan baru. */
  transferId?: string;
  /** Jenis mutasi bawaan, mis. "Penempatan Awal" (dari tawaran setelah menambah karyawan) */
  presetType?: string;
  /** Karyawan yang langsung tercentang */
  presetEmployeeId?: string;
}

/**
 * Halaman tambah / ubah usulan mutasi.
 * Ambil dulu semua data untuk pilihan di wizard, lalu tampilkan wizard-nya.
 */
export function MutasiWizardPage({ transferId, presetType, presetEmployeeId }: MutasiWizardPageProps) {
  const employeesRequest = useApiGet<EmployeeProfileResource[]>("/api/employees");
  const assignmentsRequest = useApiGet<AssignmentResource[]>("/api/position-assignments");
  const positionsRequest = useApiGet<PositionResource[]>("/api/positions");
  const subUnitsRequest = useApiGet<SubUnitResource[]>("/api/sub-units");
  const objectsRequest = useApiGet<PlacementObjectResource[]>("/api/placement-objects");
  const transfersRequest = useApiGet<TransferResource[]>("/api/transfers");

  const requests = [employeesRequest, assignmentsRequest, positionsRequest, subUnitsRequest, objectsRequest, transfersRequest];

  if (requests.some((request) => request.loading)) {
    return <PageLoading label="Memuat data mutasi & penempatan..." />;
  }

  const employees = employeesRequest.data;
  const assignments = assignmentsRequest.data;
  const positions = positionsRequest.data;
  const subUnits = subUnitsRequest.data;
  const placementObjects = objectsRequest.data;
  const transfers = transfersRequest.data;

  if (!employees || !assignments || !positions || !subUnits || !placementObjects || !transfers) {
    const error = requests.find((request) => request.error)?.error;
    return <PageError message={error ?? "Data gagal dimuat."} />;
  }

  const data = { employees, assignments, positions, subUnits, placementObjects, transfers };

  // Penandatangan bawaan: Manager (BRM-1) Definitif yang sedang menjabat.
  const manager =
    assignments.find(
      (item) => item.is_active && item.position.brm_level === 1 && item.assignment_status === DEFINITIVE_STATUS,
    ) ?? assignments.find((item) => item.is_active && item.position.brm_level === 1);
  const preset = { type: presetType, employeeId: presetEmployeeId, signerAssignmentId: manager?.id ?? "" };

  // Mode tambah
  if (transferId === undefined) {
    return <MutasiWizard data={data} preset={preset} />;
  }

  // Mode ubah: hanya usulan Draf & Menunggu Dokumen
  const transfer = transfers.find((item) => item.id === transferId);
  if (!transfer) return <PageError message="Usulan mutasi tidak ditemukan." />;
  if (!isTransferEditable(transfer.status)) {
    return <PageError message={`Usulan berstatus ${transfer.status} tidak bisa diubah.`} />;
  }

  return <MutasiWizard transfer={transfer} data={data} preset={preset} />;
}
