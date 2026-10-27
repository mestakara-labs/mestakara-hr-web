"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { EmployeeProfileResource } from "@/types/api/employee";

import { KaryawanForm } from "./KaryawanForm";

/** Halaman edit karyawan: ambil dulu data karyawannya, lalu tampilkan form yang sudah terisi. */
export function KaryawanEditPage({ id }: { id: string }) {
  const { data: employee, loading, error } = useApiGet<EmployeeProfileResource>(`/api/employees/${id}`);

  if (loading) return <PageLoading label="Memuat data karyawan..." />;
  if (error || !employee) return <PageError message={error ?? "Karyawan tidak ditemukan."} />;

  return <KaryawanForm employee={employee} />;
}
