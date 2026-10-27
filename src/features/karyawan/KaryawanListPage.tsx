"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";

import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { EMPLOYEE_ACTIVE_STATUS, EMPLOYEE_ACTIVE_STATUSES } from "@/lib/activation-rules";
import { apiDelete } from "@/lib/http-client";
import { currentPeriod, firstYearOf, periodReferenceDate, toPeriodParam, type DataPeriod } from "@/lib/period-rules";
import type { EmployeeProfileResource } from "@/types/api/employee";

import {
  EMPTY_RETIREMENT_FILTER,
  filterByRetirement,
  retirementYearOptions,
  type RetirementFilterValue,
} from "./employee-retirement";
import { ExportKaryawanButton } from "./ExportKaryawanButton";
import { KaryawanStats } from "./KaryawanStats";
import { KaryawanTable } from "./KaryawanTable";
import { PeriodFilter } from "./PeriodFilter";
import { RetirementFilter } from "./RetirementFilter";

/**
 * Halaman Data Karyawan.
 *
 * Alurnya:
 *   1. Pilih "Periode Data" (bawaan bulan berjalan), lalu ambil semua karyawan pada periode itu dari
 *      /api/employees?period=YYYY-MM. Status, jabatan, dan masa kerja dihitung server pada TANGGAL ACUAN
 *      periode (akhir bulan; bulan berjalan = hari ini). Usia & pensiun dihitung di sini dengan tanggal yang sama.
 *   2. Tampilkan kartu statistik (dari karyawan AKTIF saja)
 *   3. Filter "Status Kepegawaian" (bawaan Aktif) lalu "Pensiun pada periode" menyaring karyawan lebih dulu
 *   4. Tampilkan KaryawanTable dari hasil filter itu (cari, filter, urut, dan halaman diurus DataTable)
 *   5. Hapus DRAF karyawan (Belum Aktif) lewat dialog konfirmasi, lalu muat ulang datanya
 *   6. "Ekspor Excel" mengunduh file Excel dari backend, ikut "Periode Data" & "Status Kepegawaian"
 */
export function KaryawanListPage() {
  const [period, setPeriod] = useState<DataPeriod>(() => currentPeriod());
  /** Tanggal acuan periode, "YYYY-MM-DD" (mis. "2026-09-30") */
  const referenceDate = periodReferenceDate(period);

  const { data: employees, loading, refreshing, error, reload } = useApiGet<EmployeeProfileResource[]>(
    `/api/employees?period=${toPeriodParam(period)}`,
  );
  const [retirementFilter, setRetirementFilter] = useState<RetirementFilterValue>(EMPTY_RETIREMENT_FILTER);
  /** Status kepegawaian yang ditampilkan; "" = semua */
  const [activeStatus, setActiveStatus] = useState<string>(EMPLOYEE_ACTIVE_STATUS.active);

  const activeEmployees = (employees ?? []).filter((employee) => employee.active_status === EMPLOYEE_ACTIVE_STATUS.active);
  const byStatus = (employees ?? []).filter((employee) => !activeStatus || employee.active_status === activeStatus);
  const shownEmployees = filterByRetirement(byStatus, retirementFilter);

  const hapus = useDeleteConfirm<EmployeeProfileResource>({
    onDelete: async (employee) => {
      await apiDelete(`/api/employees/${employee.id}`);
    },
    onSuccess: reload,
    successMessage: (employee) => `Karyawan "${employee.name}" berhasil dihapus`,
  });

  return (
    <>
      <PageHeader
        title="Data Karyawan"
        description="Data biografi seluruh karyawan Unit Agrowisata beserta statistiknya."
        action={
          <Button asChild>
            <Link href="/dashboard/penambahan/create">
              <UserPlus />
              Tambah Karyawan
            </Link>
          </Button>
        }
      />

      {loading && <PageLoading label="Memuat data karyawan..." />}
      {error && <PageError message={error} />}

      {employees && (
        <>
          <KaryawanStats employees={activeEmployees} referenceDate={referenceDate} />

          <Card>
            <CardContent className="flex flex-col gap-5">
              <PeriodFilter
                value={period}
                onChange={setPeriod}
                // Tahun paling awal = tahun Tanggal Masuk karyawan paling lama
                firstYear={firstYearOf(employees.map((employee) => employee.hire_date))}
                loading={refreshing}
                action={<ExportKaryawanButton period={period} activeStatus={activeStatus} />}
              />
              <label className="flex flex-wrap items-center gap-2 typo-body-s text-fg-secondary">
                Status Kepegawaian
                <NativeSelect
                  aria-label="Status kepegawaian"
                  value={activeStatus}
                  onChange={(event) => setActiveStatus(event.target.value)}
                  className="w-48"
                >
                  {EMPLOYEE_ACTIVE_STATUSES.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {status}
                    </NativeSelectOption>
                  ))}
                  <NativeSelectOption value="">Semua</NativeSelectOption>
                </NativeSelect>
                <span className="text-fg-tertiary">
                  Belum Aktif = draf dari Penambahan Karyawan yang belum berlaku.
                </span>
              </label>
              <RetirementFilter
                value={retirementFilter}
                onChange={setRetirementFilter}
                yearOptions={retirementYearOptions(employees)}
                resultCount={shownEmployees.length}
              />
              <KaryawanTable employees={shownEmployees} referenceDate={referenceDate} onDelete={hapus.ask} />
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDeleteDialog
        open={hapus.target !== null}
        title={`Hapus karyawan "${hapus.target?.name}"?`}
        description="Hanya draf karyawan (Belum Aktif) yang belum pernah aktif yang bisa dihapus. Karyawan lain dinonaktifkan."
        deleting={hapus.deleting}
        onConfirm={hapus.confirm}
        onCancel={hapus.cancel}
      />
    </>
  );
}
