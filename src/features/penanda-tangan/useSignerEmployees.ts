"use client";

import { useApiGet } from "@/hooks/useApiGet";
import { currentPeriod, toPeriodParam } from "@/lib/period-rules";
import type { EmployeeProfileResource } from "@/types/api/employee";

/**
 * Calon penanda tangan dari DAFTAR KARYAWAN: semua karyawan yang aktif sekarang.
 *
 *   const { options, positionOf, loading } = useSignerEmployees();
 *   options      -> pilihan untuk SearchSelect: { value: id, label: nama, hint: "No. Reg · Jabatan" }
 *   positionOf() -> jabatan karyawan untuk ditampilkan (jabatan tidak bisa diubah di pengaturan)
 */
export function useSignerEmployees() {
  const { data: employees, loading } = useApiGet<EmployeeProfileResource[]>(
    `/api/employees?period=${toPeriodParam(currentPeriod())}`,
  );

  const active = (employees ?? []).filter((employee) => employee.active_status === "Aktif");
  const options = active.map((employee) => ({
    value: employee.id,
    label: employee.name,
    hint: [employee.registration_number, employee.position?.title].filter(Boolean).join(" · "),
  }));

  /** Jabatan karyawan, "-" kalau belum ditempatkan atau tidak ditemukan. */
  function positionOf(employeeId: string): string {
    return active.find((employee) => employee.id === employeeId)?.position?.title ?? "-";
  }

  return { options, positionOf, loading };
}
