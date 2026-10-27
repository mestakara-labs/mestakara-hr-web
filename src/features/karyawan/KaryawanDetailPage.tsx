"use client";

import Link from "next/link";
import { BriefcaseBusiness, CakeSlice, CalendarClock, ChevronLeft, Hourglass, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@mestakara/ui/avatar";
import { Badge } from "@mestakara/ui/badge";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mestakara/ui/tabs";

import { NumberCard } from "@/components/shared/NumberCard";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { BrmLevelBadge } from "@/features/jabatan/BrmLevelBadge";
import { EmployeeContactButtons } from "@/features/organisasi/EmployeeContactButtons";
import { useApiGet } from "@/hooks/useApiGet";
import { formatDate, formatMonths, getAgeInMonths } from "@/lib/date";
import { hasRetirement } from "@/lib/employee-rules";
import { getInitials } from "@/lib/initials";
import type { AssignmentResource } from "@/types/api/assignment";
import type { EmployeeProfileResource } from "@/types/api/employee";

import { StatusHistoryTab } from "./detail/StatusHistoryTab";
import { BankCostCenterTab } from "./detail/BankCostCenterTab";
import { EmployeeActiveStatusBadge } from "./EmployeeActiveStatusBadge";
import { BiodataTab } from "./detail/BiodataTab";
import { EducationHistoryTab } from "./detail/EducationHistoryTab";
import { FamilyHistoryTab } from "./detail/FamilyHistoryTab";
import { PositionHistoryTab } from "./detail/PositionHistoryTab";
import { getEmployeeRetirement } from "./employee-retirement";
import { RetirementStatusBadge } from "./RetirementStatusBadge";

const LIST_URL = "/dashboard/karyawan";

/**
 * Halaman DETAIL KARYAWAN (hanya lihat; ubah lewat tombol Edit):
 *
 *   [←] (Foto) Nama Karyawan  [Tetap]                                  [✎ Edit]
 *       NIK 20230028 · Pelaksana House Keeping     [Telepon][Email][WhatsApp]
 *   [Jabatan Sekarang] [Usia] [Masa Kerja] [Pensiun]      (lihat SummaryCards)
 *   [Biodata] [Riwayat Status] [Riwayat Pendidikan 4] [Data Batih 2] [Histori Jabatan 2] [Rekening & Cost Center]
 *
 * Data karyawan dari /api/employees/{id}; histori jabatan dari /api/position-assignments?employee_id={id}.
 */
export function KaryawanDetailPage({ id }: { id: string }) {
  const employeeRequest = useApiGet<EmployeeProfileResource>(`/api/employees/${id}`);
  const historyRequest = useApiGet<AssignmentResource[]>(`/api/position-assignments?employee_id=${id}`);

  if (employeeRequest.loading) return <PageLoading label="Memuat data karyawan..." />;
  const employee = employeeRequest.data;
  if (employeeRequest.error || !employee) {
    return <PageError message={employeeRequest.error ?? "Karyawan tidak ditemukan."} />;
  }

  const assignments = historyRequest.data ?? [];

  return (
    <div className="flex w-full flex-col gap-5">
      <DetailHeader employee={employee} />
      <SummaryCards employee={employee} />

      <Card>
        <CardContent>
          <Tabs defaultValue="biodata">
            <TabsList variant="line" className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="biodata">Biodata</TabsTrigger>
              <TabsTrigger value="status">Riwayat Status Kepegawaian</TabsTrigger>
              <TabsTrigger value="pendidikan">
                <TabLabel label="Riwayat Pendidikan" count={employee.educations.length} />
              </TabsTrigger>
              <TabsTrigger value="batih">
                <TabLabel label="Data Batih" count={employee.family_members.length} />
              </TabsTrigger>
              <TabsTrigger value="jabatan">
                <TabLabel label="Histori Jabatan" count={assignments.length} />
              </TabsTrigger>
              <TabsTrigger value="rekening">Rekening & Cost Center</TabsTrigger>
            </TabsList>

            <TabsContent value="biodata" className="pt-5">
              <BiodataTab employee={employee} />
            </TabsContent>
            <TabsContent value="status" className="pt-5">
              <StatusHistoryTab employeeId={employee.id} />
            </TabsContent>
            <TabsContent value="pendidikan" className="pt-5">
              <EducationHistoryTab educations={employee.educations} />
            </TabsContent>
            <TabsContent value="batih" className="pt-5">
              <FamilyHistoryTab members={employee.family_members} />
            </TabsContent>
            <TabsContent value="jabatan" className="pt-5">
              {historyRequest.loading ? (
                <PageLoading label="Memuat histori jabatan..." />
              ) : historyRequest.error ? (
                <PageError message={historyRequest.error} />
              ) : (
                <PositionHistoryTab assignments={assignments} />
              )}
            </TabsContent>
            <TabsContent value="rekening" className="pt-5">
              <BankCostCenterTab employee={employee} onChanged={employeeRequest.reload} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/** Baris judul: tombol kembali, foto, nama, status, NIK & jabatan, tombol kontak, dan tombol Edit. */
function DetailHeader({ employee }: { employee: EmployeeProfileResource }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
          <Link href={LIST_URL} aria-label="Kembali">
            <ChevronLeft />
          </Link>
        </Button>
        <Avatar size="lg" className="data-[size=lg]:size-16">
          {employee.photo_url && <AvatarImage src={employee.photo_url} alt={`Foto ${employee.name}`} />}
          <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="typo-h3 text-fg-heading">{employee.name}</h1>
            <Badge variant="neutral" dot={false}>
              {employee.employment_status.replace("Karyawan ", "")}
            </Badge>
            <EmployeeActiveStatusBadge status={employee.active_status} />
          </div>
          <p className="mt-1 typo-body-m text-fg-secondary">
            NIK {employee.nik ?? "-"} · {employee.position?.title ?? "Belum ditempatkan"}
          </p>
          <div className="-ml-2 mt-1">
            <EmployeeContactButtons
              employee={{
                name: employee.name,
                phone: employee.phone ?? "",
                // WhatsApp kosong = sama dengan nomor telepon
                whatsapp: employee.whatsapp ?? employee.phone ?? "",
                email: employee.email ?? "",
              }}
            />
          </div>
        </div>
      </div>

      <Button variant="outline" asChild>
        <Link href={`${LIST_URL}/${employee.id}/edit`}>
          <Pencil />
          Edit
        </Link>
      </Button>
    </div>
  );
}

/** Keterangan kartu Masa Kerja, mis. "Masuk 1 Jan 2017 · nonaktif sejak 1 Okt 2026". */
function serviceNote(employee: EmployeeProfileResource): string {
  if (!employee.hire_date) return "Tanggal masuk belum diisi";
  const since = `Masuk ${formatDate(employee.hire_date)}`;
  if (employee.inactive_since) return `${since} · nonaktif sejak ${formatDate(employee.inactive_since)}`;
  return `${since} · masa nonaktif tidak dihitung`;
}

/** Keterangan kartu Pensiun kalau tanggal pensiunnya tidak ditampilkan. */
function retirementEmptyNote(employee: EmployeeProfileResource): string {
  if (!hasRetirement(employee.employment_status)) return "Hanya karyawan Tetap yang punya masa pensiun";
  if (!employee.position) return "Ditampilkan setelah karyawan ditempatkan";
  return "Tanggal lahir belum diisi";
}

/**
 * Empat kartu ringkasan (gaya sama dengan kartu statistik di halaman Data Karyawan):
 *   Jabatan Sekarang | Usia | Masa Kerja | Pensiun
 */
function SummaryCards({ employee }: { employee: EmployeeProfileResource }) {
  const retirement = getEmployeeRetirement(employee);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <NumberCard
        title="Jabatan Sekarang"
        icon={BriefcaseBusiness}
        textValue
        value={employee.position?.title ?? <span className="text-fg-tertiary">Belum ditempatkan</span>}
        note={
          employee.position ? (
            <BrmLevelBadge level={employee.position.brm_level} />
          ) : (
            "Penempatan lewat menu Mutasi & Penempatan"
          )
        }
      />
      <NumberCard
        title="Usia"
        icon={CakeSlice}
        textValue
        value={employee.birth_date ? formatMonths(getAgeInMonths(employee.birth_date)) : "-"}
        note={employee.birth_date ? `Lahir ${formatDate(employee.birth_date)}` : "Tanggal lahir belum diisi"}
      />
      <NumberCard
        title="Masa Kerja"
        icon={CalendarClock}
        textValue
        // Masa kerja dihitung server dari masa AKTIF saja (masa nonaktif tidak dihitung).
        value={employee.hire_date ? formatMonths(employee.service_months) : "-"}
        note={serviceNote(employee)}
      />
      <NumberCard
        title="Pensiun"
        icon={Hourglass}
        textValue
        value={retirement ? formatDate(retirement.date) : <span className="text-fg-tertiary">-</span>}
        note={
          retirement ? (
            <span className="flex flex-wrap items-center gap-2">
              <RetirementStatusBadge period={retirement.period} />
              usia pensiun {retirement.age} tahun
            </span>
          ) : (
            retirementEmptyNote(employee)
          )
        }
      />
    </div>
  );
}

/** Judul tab + jumlah datanya, mis. "Data Batih (2)". */
function TabLabel({ label, count }: { label: string; count: number }) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      {count > 0 && <span className="rounded-full bg-subtle px-1.5 typo-label-s text-fg-secondary">{count}</span>}
    </span>
  );
}
