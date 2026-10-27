/**
 * PILIHAN-PILIHAN untuk form yang mengatur jabatan karyawan (karyawan, jabatan,
 * atasan, sub unit, objek). Dipakai form Mutasi & Penempatan dan Atur Atasan.
 */
import type { SelectOption } from "@/components/shared/FormFields";
import type { SearchOption } from "@/components/shared/SearchSelect";
import { getBrmLevel } from "@/features/organisasi/brm-level";
import { canBeSupervisor, DEFINITIVE_STATUS } from "@/lib/assignment-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { EmployeeProfileResource } from "@/types/api/employee";
import type { PositionResource } from "@/types/api/organization";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";

/** Semua data yang dibutuhkan form untuk menyusun pilihan. */
export interface AssignmentFormData {
  employees: EmployeeProfileResource[];
  positions: PositionResource[];
  subUnits: SubUnitResource[];
  placementObjects: PlacementObjectResource[];
  /** Semua penugasan, untuk pilihan atasan dan pengecekan Definitif */
  assignments: AssignmentResource[];
}

/** ("Plt", "Asisten Umum") -> "Plt Asisten Umum". Status Definitif tidak ditulis. */
export function withStatus(status: string, positionTitle: string): string {
  return status === DEFINITIVE_STATUS ? positionTitle : `${status} ${positionTitle}`;
}

/** Karyawan: "Asep Saepudin" + keterangan NIK (atau status karyawan kalau tanpa NIK). */
export function toEmployeeOptions(employees: EmployeeProfileResource[]): SearchOption[] {
  return employees.map((employee) => ({
    value: employee.id,
    label: employee.name,
    hint: employee.nik ? `NIK ${employee.nik}` : employee.employment_status,
  }));
}

/**
 * Jabatan: "Asisten Umum" + keterangan "JAB-015 · BRM-3".
 * Kodenya ikut ditampilkan karena ada jabatan bernama sama di dua wilayah.
 */
export function toPositionOptions(positions: PositionResource[]): SearchOption[] {
  return positions.map((position) => ({
    value: position.id,
    label: position.title,
    hint: `${position.code} · ${getBrmLevel(position.brm_level).label}`,
  }));
}

/** Sub unit: pasangan id–nama untuk SelectField. */
export function toSubUnitOptions(subUnits: SubUnitResource[]): SelectOption[] {
  return subUnits.map((subUnit) => ({ value: subUnit.id, label: subUnit.name }));
}

/** Apakah objek ini tersedia di sub unit tersebut? */
function isObjectAvailableIn(placementObject: PlacementObjectResource, subUnitId: string): boolean {
  return placementObject.sub_units.some((subUnit) => subUnit.id === subUnitId);
}

/**
 * Objek penempatan yang TERSEDIA di sub unit yang dipilih: "Tea Bridge" + keterangan "Wisata Alam".
 * Kosong kalau sub unit belum dipilih.
 */
export function toObjectOptions(placementObjects: PlacementObjectResource[], subUnitId: string): SearchOption[] {
  return placementObjects
    .filter((placementObject) => isObjectAvailableIn(placementObject, subUnitId))
    .map((placementObject) => ({
      value: placementObject.id,
      label: placementObject.name,
      hint: placementObject.category_name,
    }));
}

/**
 * Sub unit diganti -> buang objek yang TIDAK tersedia di sub unit baru, sisanya tetap terpilih.
 * Cth. sub unit Rancabali -> Malabar: [Bungalow, Pondokan] -> [Pondokan]
 */
export function keepObjectsAvailableIn(
  objectIds: string[],
  placementObjects: PlacementObjectResource[],
  subUnitId: string,
): string[] {
  return objectIds.filter((objectId) => {
    const placementObject = placementObjects.find((entry) => entry.id === objectId);
    return placementObject !== undefined && isObjectAvailableIn(placementObject, subUnitId);
  });
}

/** Karyawan + jabatan yang sedang dicarikan atasannya. */
export interface SupervisorTarget {
  /** Level BRM jabatannya. null = jabatan belum dipilih (belum ada calon atasan). */
  brmLevel: number | null;
  /** Karyawannya (tidak bisa menjadi atasan dirinya sendiri) */
  employeeId: string;
  /** Id penugasannya (null kalau penugasannya belum ada, mis. saat mutasi) */
  assignmentId: string | null;
}

/**
 * Calon ATASAN LANGSUNG: penugasan aktif karyawan lain di jabatan dengan level BRM
 * lebih tinggi (lihat canBeSupervisor) — dan kalau `targets` lebih dari satu,
 * calon itu harus cocok untuk SEMUANYA.
 *
 * Diurutkan dari level terdekat, mis. untuk jabatan BRM-4: BRM-3 dulu, lalu BRM-2, lalu BRM-1.
 *
 *   { label: "Asep Saepudin — Plt Asisten Umum", hint: "BRM-3" }
 */
export function toSupervisorOptions(assignments: AssignmentResource[], targets: SupervisorTarget[]): SearchOption[] {
  if (targets.length === 0) return [];

  return assignments
    .filter((assignment) => {
      const candidate = {
        id: assignment.id,
        employee_id: assignment.employee.id,
        brm_level: assignment.position.brm_level,
        is_active: assignment.is_active,
      };

      return targets.every((target) =>
        canBeSupervisor(candidate, target.brmLevel, target.employeeId, target.assignmentId),
      );
    })
    .sort((a, b) => b.position.brm_level - a.position.brm_level)
    .map((assignment) => ({
      value: assignment.id,
      label: `${assignment.employee.name} — ${withStatus(assignment.assignment_status, assignment.position.title)}`,
      hint: getBrmLevel(assignment.position.brm_level).label,
    }));
}

/** Penugasan yang sudah ada -> bahan untuk toSupervisorOptions. */
export function toSupervisorTarget(assignment: AssignmentResource): SupervisorTarget {
  return {
    brmLevel: assignment.position.brm_level,
    employeeId: assignment.employee.id,
    assignmentId: assignment.id,
  };
}

/**
 * Calon PENANDATANGAN dokumen dari unit sendiri: pejabat yang sedang menjabat,
 * urut dari level BRM tertinggi, mis. "Siti Saepudin — Manager" (BRM-1).
 */
export function toSignerOptions(assignments: AssignmentResource[]): SearchOption[] {
  return assignments
    .filter((assignment) => assignment.is_active)
    .sort((a, b) => a.position.brm_level - b.position.brm_level)
    .map((assignment) => ({
      value: assignment.id,
      label: `${assignment.employee.name} — ${withStatus(assignment.assignment_status, assignment.position.title)}`,
      hint: getBrmLevel(assignment.position.brm_level).label,
    }));
}
