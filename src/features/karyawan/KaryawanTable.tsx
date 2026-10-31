"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@mestakara/ui/avatar";
import { Badge } from "@mestakara/ui/badge";
import type { ColumnFiltersState } from "@tanstack/react-table";

import {
  actionsColumn,
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  rowNumberColumn,
  toFilterOptions,
  type ColumnFilterValue,
} from "@/components/shared/data-table";
import { EMPLOYEE_ACTIVE_STATUS, EMPLOYEE_ACTIVE_STATUSES } from "@/lib/activation-rules";
import { formatMonths, formatDate, getAgeInMonths, parseDate } from "@/lib/date";
import {
  EDUCATION_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  GENDER_OPTIONS,
  RETIREMENT_PERIODS,
} from "@/lib/employee-rules";
import { getInitials } from "@/lib/initials";
import type { EmployeeProfileResource } from "@/types/api/employee";

import { EmployeeActiveStatusBadge } from "./EmployeeActiveStatusBadge";
import { getEmployeeRetirement } from "./employee-retirement";
import { RetirementStatusBadge } from "./RetirementStatusBadge";

const col = createDataTableColumnHelper<EmployeeProfileResource>();

/** Alamat halaman detail karyawan, mis. "/dashboard/karyawan/pegawai-0001". */
function detailHref(employee: EmployeeProfileResource): string {
  return `/dashboard/karyawan/${employee.id}`;
}

/** Isi sel kosong, mis. tanggal pensiun karyawan non-Tetap. */
const EMPTY = "-";

/** Label kategori pensiun, urut dari yang paling dekat: ["Sudah Pensiun", "≤ 1 bulan", ...]. */
const PERIOD_LABELS = RETIREMENT_PERIODS.map((period) => period.label);

/** Filter bawaan tabel: hanya karyawan Aktif (bisa diubah lewat ikon corong kolom Status Kepegawaian). */
const ACTIVE_ONLY_FILTER: ColumnFiltersState = [{ id: "active_status", value: { values: [EMPLOYEE_ACTIVE_STATUS.active] } }];

/** Urutan kategori pensiun untuk pengurutan kolom. "-" (non-Tetap) diletakkan paling akhir. */
function periodOrder(period: string): number {
  const index = PERIOD_LABELS.indexOf(period);
  return index === -1 ? PERIOD_LABELS.length : index;
}

/**
 * Kolom-kolom tabel karyawan:
 *
 *   No | Nama (cari, urut, klik = detail) | Email (cari) | NIK (cari, urut) | No. Registrasi (cari)
 *      | Status Kepegawaian (filter, bawaan Aktif) | Status (filter) | Jenis Kelamin (filter)
 *      | Usia "55 tahun 7 bulan" (urut) | Tanggal Pensiun (urut) | Status Pensiun (filter, urut)
 *      | Pendidikan (filter) | Telepon (cari) | WhatsApp (cari) | Aksi (Lihat Detail, Edit, Hapus)
 *
 * Tanggal & Status Pensiun hanya untuk karyawan Tetap; lainnya "-".
 *
 * Jabatan sengaja tidak ditampilkan di sini; data penempatan dikelola terpisah.
 *
 * Usia & pensiun dihitung pada `referenceDate` ("YYYY-MM-DD") = tanggal acuan Periode Data.
 */
function createKaryawanTableConfig(onDelete: (employee: EmployeeProfileResource) => void, referenceDate: string) {
  const today = parseDate(referenceDate);

  return defineTableConfig<EmployeeProfileResource>({
    getRowId: (employee) => employee.id,
    emptyMessage: "Tidak ada karyawan yang cocok dengan pencarian atau filter.",
    defaultColumnFilters: ACTIVE_ONLY_FILTER,
    tableClassName: "min-w-384",
    columns: col.columns([
      rowNumberColumn<EmployeeProfileResource>(),

      // Foto + nama. Nama bisa diklik untuk membuka halaman detail karyawan.
      col.accessor("name", {
        header: "Nama",
        // Kolom dibuat lebar supaya sebagian besar nama tidak turun ke baris berikutnya.
        meta: { search: { placeholder: "Cari nama..." }, width: "min-w-64" },
        cell: ({ row }) => {
          const employee = row.original;

          return (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                {employee.photo_url && <AvatarImage src={employee.photo_url} alt={`Foto ${employee.name}`} />}
                <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
              </Avatar>
              <Link href={detailHref(employee)} className="font-medium text-fg-heading hover:text-fg-brand hover:underline">
                {employee.name}
              </Link>
            </div>
          );
        },
      }),

      col.accessor((employee) => employee.email ?? EMPTY, {
        id: "email",
        header: "Email",
        meta: { search: { placeholder: "Cari email..." }, nowrap: true, cellClassName: "text-fg-secondary" },
      }),

      // Karyawan casual / daily worker boleh tanpa NIK -> ditampilkan "-".
      col.accessor((employee) => employee.nik ?? "-", {
        id: "nik",
        header: "NIK",
        meta: { search: { placeholder: "Cari NIK..." }, nowrap: true, cellClassName: "typo-label-m" },
      }),

      col.accessor((employee) => employee.registration_number ?? "-", {
        id: "registration_number",
        header: "No. Registrasi",
        meta: { search: { placeholder: "Cari no. registrasi..." }, nowrap: true, cellClassName: "typo-label-m" },
      }),

      // Aktif / Belum Aktif / Nonaktif pada tanggal acuan Periode Data. Bawaannya hanya Aktif (lihat ACTIVE_ONLY_FILTER).
      col.accessor("active_status", {
        header: "Status Kepegawaian",
        meta: { filter: { options: toFilterOptions(EMPLOYEE_ACTIVE_STATUSES) }, nowrap: true },
        cell: ({ getValue }) => <EmployeeActiveStatusBadge status={getValue()} />,
      }),

      col.accessor("employment_status", {
        header: "Status",
        meta: { filter: { options: toFilterOptions(EMPLOYMENT_STATUS_OPTIONS) }, nowrap: true },
        // "Karyawan PKWT" -> "PKWT", supaya kolomnya tidak terlalu lebar
        cell: ({ getValue }) => <Badge variant="neutral" dot={false}>{getValue().replace("Karyawan ", "")}</Badge>,
      }),

      col.accessor("gender", {
        header: "Jenis Kelamin",
        meta: { filter: { options: toFilterOptions(GENDER_OPTIONS) }, nowrap: true },
      }),

      // Accessor mengembalikan JUMLAH BULAN usia supaya urutannya benar; tampilannya "55 tahun 7 bulan".
      // Draf karyawan tanpa tanggal lahir -> -1 (diurutkan paling awal), tampil "-".
      col.accessor((employee) => (employee.birth_date ? getAgeInMonths(employee.birth_date, today) : -1), {
        id: "age",
        header: "Usia",
        meta: { nowrap: true },
        cell: ({ getValue }) => (getValue() < 0 ? "-" : formatMonths(getValue())),
      }),

      // Accessor mengembalikan "YYYY-MM-DD" supaya urutannya benar; non-Tetap & belum ditempatkan "-" (diurutkan paling awal).
      col.accessor((employee) => getEmployeeRetirement(employee, today)?.date ?? EMPTY, {
        id: "retirementDate",
        header: "Tanggal Pensiun",
        meta: { nowrap: true },
        cell: ({ row }) => {
          const retirement = getEmployeeRetirement(row.original, today);
          if (!retirement) return <span className="text-fg-tertiary">{EMPTY}</span>;

          return (
            <>
              <p className="text-fg-primary">{formatDate(retirement.date)}</p>
              <p className="typo-body-s text-fg-tertiary">usia pensiun {retirement.age} tahun</p>
            </>
          );
        },
      }),

      // Accessor mengembalikan kategori (untuk filter). Urutannya dari yang paling dekat pensiun, "-" paling akhir.
      col.accessor((employee) => getEmployeeRetirement(employee, today)?.period ?? EMPTY, {
        id: "retirementPeriod",
        header: "Status Pensiun",
        sortFn: (rowA, rowB) =>
          periodOrder(rowA.getValue("retirementPeriod")) - periodOrder(rowB.getValue("retirementPeriod")),
        meta: { filter: { options: toFilterOptions([...PERIOD_LABELS, EMPTY]) }, nowrap: true },
        cell: ({ getValue }) =>
          getValue() === EMPTY ? <span className="text-fg-tertiary">{EMPTY}</span> : <RetirementStatusBadge period={getValue()} />,
      }),

      col.accessor("education", {
        header: "Pendidikan",
        meta: { filter: { options: toFilterOptions(EDUCATION_OPTIONS) }, nowrap: true },
      }),

      col.accessor("phone", {
        header: "Telepon",
        enableSorting: false,
        meta: { search: { placeholder: "Cari telepon..." }, nowrap: true, cellClassName: "text-fg-secondary" },
      }),

      // WhatsApp kosong = sama dengan nomor telepon, jadi yang tampil nomor telepon.
      col.accessor((employee) => employee.whatsapp ?? employee.phone, {
        id: "whatsapp",
        header: "WhatsApp",
        enableSorting: false,
        meta: { search: { placeholder: "Cari WhatsApp..." }, nowrap: true, cellClassName: "text-fg-secondary" },
      }),

      actionsColumn<EmployeeProfileResource>({
        label: (employee) => `Aksi untuk ${employee.name}`,
        viewHref: detailHref,
        editHref: (employee) => `/dashboard/karyawan/${employee.id}/edit`,
        onDelete,
      }),
    ]),
  });
}

interface KaryawanTableProps {
  employees: EmployeeProfileResource[];
  /** Tanggal acuan Periode Data, "YYYY-MM-DD" */
  referenceDate: string;
  onDelete: (employee: EmployeeProfileResource) => void;
  /** Filter kolom berubah (dipakai halaman untuk Ekspor Excel & kalimat filter pensiun). Kirim fungsi stabil, mis. setState. */
  onFiltersChange: (filters: ColumnFiltersState) => void;
}

/** Status kepegawaian yang dicentang di filter tabel; [] = tidak difilter (semua status). */
export function selectedActiveStatuses(filters: ColumnFiltersState): string[] {
  const value = filters.find((filter) => filter.id === "active_status")?.value as ColumnFilterValue | undefined;
  return value?.values ?? [];
}

/** Tabel data karyawan. Cari, filter, urut, dan halaman diurus oleh DataTable. */
export function KaryawanTable({ employees, referenceDate, onDelete, onFiltersChange }: KaryawanTableProps) {
  // Konfigurasi dibuat ulang hanya kalau tanggal acuan berubah (bukan di setiap render).
  // Urutan, filter, dan halaman tabel tetap tersimpan walaupun konfigurasinya dibuat ulang.
  const config = useMemo(() => createKaryawanTableConfig(onDelete, referenceDate), [onDelete, referenceDate]);

  return <DataTable config={config} data={employees} onColumnFiltersChange={onFiltersChange} />;
}
