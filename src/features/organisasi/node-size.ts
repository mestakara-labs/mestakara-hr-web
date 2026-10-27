/**
 * Ukuran kotak di bagan. Dipakai oleh PENATA POSISI (build-org-chart.ts) dan oleh
 * TAMPILAN kotak (OrgCardNode.tsx, EmployeeCard.tsx), supaya ukurannya sama persis.
 */

/** Lebar kotak (px). */
export const NODE_WIDTH = 288;
/** Tinggi bagian judul jabatan (px). */
export const NODE_HEADER_HEIGHT = 60;
/** Tinggi satu baris pegawai (px). */
export const EMPLOYEE_ROW_HEIGHT = 56;

/** Tinggi kotak: judul jabatan + satu baris per pegawai di dalamnya. */
export function getNodeHeight(employeeCount: number): number {
  return NODE_HEADER_HEIGHT + Math.max(employeeCount, 1) * EMPLOYEE_ROW_HEIGHT;
}
