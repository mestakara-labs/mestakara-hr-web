"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";
import type { ColumnFiltersState } from "@tanstack/react-table";

import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { FieldNote } from "@/components/shared/FieldNote";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { useDeleteConfirm } from "@/hooks/useDeleteConfirm";
import { EMPLOYEE_ACTIVE_STATUS } from "@/lib/activation-rules";
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
import { KaryawanTable, selectedActiveStatuses } from "./KaryawanTable";
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
 *   3. Filter "Pensiun pada periode" menyaring karyawan lebih dulu
 *   4. Tampilkan KaryawanTable dari hasil filter itu (cari, filter, urut, dan halaman diurus DataTable).
 *      Kolom "Status Kepegawaian" di tabel bawaannya hanya Aktif; ubah lewat ikon corong.
 *   5. Hapus DRAF karyawan (Belum Aktif) lewat dialog konfirmasi, lalu muat ulang datanya
 *   6. "Ekspor Excel" mengunduh file Excel dari backend, ikut "Periode Data" & filter Status Kepegawaian tabel
 *      (tepat satu status dicentang = status itu; selain itu = semua karyawan)
 */
export function KaryawanListPage() {
  const [period, setPeriod] = useState<DataPeriod>(() => currentPeriod());
  /** Tanggal acuan periode, "YYYY-MM-DD" (mis. "2026-09-30") */
  const referenceDate = periodReferenceDate(period);

  const { data: employees, loading, refreshing, error, reload } = useApiGet<EmployeeProfileResource[]>(
    `/api/employees?period=${toPeriodParam(period)}`,
  );
  const [retirementFilter, setRetirementFilter] = useState<RetirementFilterValue>(EMPTY_RETIREMENT_FILTER);
  /** Filter kolom tabel (dikabari KaryawanTable); bawaannya Status Kepegawaian = Aktif */
  const [tableFilters, setTableFilters] = useState<ColumnFiltersState>([]);
  /** Status kepegawaian yang dicentang di tabel; [] = semua */
  const activeStatuses = selectedActiveStatuses(tableFilters);
  /** Untuk Ekspor Excel: backend hanya menerima satu status; "" = semua karyawan */
  const exportStatus = activeStatuses.length === 1 ? activeStatuses[0] : "";

  const activeEmployees = (employees ?? []).filter((employee) => employee.active_status === EMPLOYEE_ACTIVE_STATUS.active);
  const shownEmployees = filterByRetirement(employees ?? [], retirementFilter);
  // Jumlah untuk kalimat filter pensiun: ikut status kepegawaian yang dicentang di tabel.
  const retirementCount = shownEmployees.filter(
    (employee) => activeStatuses.length === 0 || activeStatuses.includes(employee.active_status),
  ).length;

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
                action={<ExportKaryawanButton period={period} activeStatus={exportStatus} />}
              />
              <RetirementFilter
                value={retirementFilter}
                onChange={setRetirementFilter}
                yearOptions={retirementYearOptions(employees)}
                resultCount={retirementCount}
              />
              <FieldNote>
                Tabel bawaannya hanya menampilkan karyawan Aktif. Klik ikon corong di kolom Status Kepegawaian untuk
                melihat karyawan Nonaktif atau Belum Aktif (draf dari Penambahan Karyawan yang belum berlaku).
              </FieldNote>
              <KaryawanTable
                employees={shownEmployees}
                referenceDate={referenceDate}
                onDelete={hapus.ask}
                onFiltersChange={setTableFilters}
              />
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
