/**
 * Hitungan untuk kartu statistik di halaman Jabatan Karyawan.
 *
 * Yang dihitung hanya penugasan AKTIF (yang masih berjalan), kecuali `ended`.
 */
import type { StatItem } from "@/components/shared/StatBarList";
import { ASSIGNMENT_STATUSES } from "@/lib/assignment-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { PositionResource } from "@/types/api/organization";
import type { SubUnitResource } from "@/types/api/sub-unit";

export interface AssignmentStats {
  /** Penugasan yang masih berjalan */
  active: number;
  /** Riwayat penugasan yang sudah selesai */
  ended: number;
  /** Karyawan yang punya minimal satu penugasan aktif */
  placedEmployees: number;
  /** Karyawan tanpa penugasan aktif */
  unplacedEmployees: number;
  /** Jabatan yang belum dipegang siapa pun */
  vacantPositions: number;
  /** Jumlah penugasan aktif per status jabatan (Definitif, Plt, ...) */
  statuses: StatItem[];
  /** Jumlah penugasan aktif per sub unit, urut sesuai master Sub Unit */
  subUnits: StatItem[];
}

interface CalculateOptions {
  assignments: AssignmentResource[];
  /** Jumlah SEMUA karyawan */
  employeeCount: number;
  positions: PositionResource[];
  subUnits: SubUnitResource[];
}

/** Hitung semua angka statistik penugasan sekaligus. */
export function calculateAssignmentStats({
  assignments,
  employeeCount,
  positions,
  subUnits,
}: CalculateOptions): AssignmentStats {
  const active = assignments.filter((assignment) => assignment.is_active);
  // Satu karyawan bisa punya beberapa penugasan aktif, jadi dihitung sekali saja (Set).
  const placedEmployeeIds = new Set(active.map((assignment) => assignment.employee.id));

  return {
    active: active.length,
    ended: assignments.length - active.length,
    placedEmployees: placedEmployeeIds.size,
    unplacedEmployees: Math.max(employeeCount - placedEmployeeIds.size, 0),
    vacantPositions: positions.filter((position) => position.employees.length === 0).length,

    statuses: ASSIGNMENT_STATUSES.map((status) => ({
      label: status,
      count: active.filter((assignment) => assignment.assignment_status === status).length,
    })),

    subUnits: subUnits.map((subUnit) => ({
      label: subUnit.name,
      count: active.filter((assignment) => assignment.sub_unit.id === subUnit.id).length,
    })),
  };
}
