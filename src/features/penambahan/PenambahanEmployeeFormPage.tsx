"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { KaryawanForm } from "@/features/karyawan/KaryawanForm";
import { useApiGet } from "@/hooks/useApiGet";
import type { EmployeeProfileResource } from "@/types/api/employee";

import { PENAMBAHAN_URL } from "./PenambahanWizard";

interface PenambahanEmployeeFormPageProps {
  /** Usulan penambahan (Draf) tempat karyawan ini berada */
  activationId: string;
  /** Karyawan yang diubah. Kosongkan untuk karyawan baru. */
  employeeId?: string;
}

/**
 * Halaman FORM KARYAWAN yang dibuka dari langkah 1 wizard Penambahan (isiannya banyak, jadi
 * di halaman sendiri). Setelah disimpan (draf atau lengkap) kembali ke wizard, langkah 1.
 * Karyawan baru langsung dimasukkan ke usulan oleh server (activation_id).
 */
export function PenambahanEmployeeFormPage({ activationId, employeeId }: PenambahanEmployeeFormPageProps) {
  const activation = { id: activationId, returnHref: `${PENAMBAHAN_URL}/${activationId}/edit?langkah=1` };

  if (!employeeId) return <KaryawanForm activation={activation} />;
  return <EditEmployee employeeId={employeeId} activation={activation} />;
}

function EditEmployee({
  employeeId,
  activation,
}: {
  employeeId: string;
  activation: { id: string; returnHref: string };
}) {
  const { data: employee, loading, error } = useApiGet<EmployeeProfileResource>(`/api/employees/${employeeId}`);

  if (loading) return <PageLoading label="Memuat data karyawan..." />;
  if (error || !employee) return <PageError message={error ?? "Karyawan tidak ditemukan."} />;

  return <KaryawanForm employee={employee} activation={activation} />;
}
