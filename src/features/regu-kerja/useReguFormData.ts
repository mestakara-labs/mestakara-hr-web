"use client";

import { useApiGet } from "@/hooks/useApiGet";
import type { AssignmentResource } from "@/types/api/assignment";
import type { EmployeeProfileResource } from "@/types/api/employee";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { ShiftResource } from "@/types/api/shift";
import type { SubUnitResource } from "@/types/api/sub-unit";
import type { WorkGroupResource } from "@/types/api/work-group";
import type { WorkPatternResource } from "@/types/api/work-pattern";

/** Data pilihan yang dibutuhkan form regu (tambah, edit, kelola anggota). */
export interface ReguFormData {
  subUnits: SubUnitResource[];
  placementObjects: PlacementObjectResource[];
  patterns: WorkPatternResource[];
  employees: EmployeeProfileResource[];
  shifts: ShiftResource[];
  /** Penugasan jabatan (untuk kolom Jabatan & Sub Unit di tabel karyawan) */
  assignments: AssignmentResource[];
  /** Semua regu (untuk mengecek karyawan yang sudah aktif di regu lain) */
  groups: WorkGroupResource[];
}

/**
 * Ambil semua data pilihan form regu sekaligus.
 *   loading = masih ada yang dimuat;  error = pesan kalau ada yang gagal;  data = null selama belum lengkap
 */
export function useReguFormData(): { data: ReguFormData | null; loading: boolean; error: string | null } {
  const subUnits = useApiGet<SubUnitResource[]>("/api/sub-units");
  const placementObjects = useApiGet<PlacementObjectResource[]>("/api/placement-objects");
  const patterns = useApiGet<WorkPatternResource[]>("/api/work-patterns");
  const employees = useApiGet<EmployeeProfileResource[]>("/api/employees");
  const shifts = useApiGet<ShiftResource[]>("/api/shifts");
  const assignments = useApiGet<AssignmentResource[]>("/api/position-assignments");
  const groups = useApiGet<WorkGroupResource[]>("/api/work-groups");
  const requests = [subUnits, placementObjects, patterns, employees, shifts, assignments, groups];

  const loading = requests.some((request) => request.loading);
  const error = requests.find((request) => request.error)?.error ?? null;
  const data =
    subUnits.data &&
    placementObjects.data &&
    patterns.data &&
    employees.data &&
    shifts.data &&
    assignments.data &&
    groups.data
      ? {
          subUnits: subUnits.data,
          placementObjects: placementObjects.data,
          patterns: patterns.data,
          employees: employees.data,
          shifts: shifts.data,
          assignments: assignments.data,
          groups: groups.data,
        }
      : null;

  return { data, loading, error };
}
