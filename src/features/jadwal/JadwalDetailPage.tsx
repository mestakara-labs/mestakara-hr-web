"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { currentMonth, formatMonth, shiftMonth } from "@/lib/schedule-period-rules";
import type { HolidayResource } from "@/types/api/holiday";
import type { SchedulePeriodResource } from "@/types/api/schedule";
import type { ShiftResource } from "@/types/api/shift";
import type { WorkGroupResource } from "@/types/api/work-group";

import { SchedulePeriodPanel } from "./SchedulePeriodPanel";
import { ScheduleProjectionPanel } from "./ScheduleProjectionPanel";

const LIST_URL = "/dashboard/jadwal";

/**
 * Halaman DETAIL JADWAL satu regu:
 *
 *   [←] Jadwal House Keeping Gunung Mas                 [‹] Oktober 2026 [›]
 *       Agrowisata Gunung Mas · 07–17 Tiga Shift · 4 anggota
 *   ┌───────────────────────────────────────────────────────────┐
 *   │ Sudah ada jadwal resmi -> SchedulePeriodPanel (Draf/Terbit/Terkunci) │
 *   │ Belum ada               -> ScheduleProjectionPanel (perkiraan + Buat Jadwal) │
 *   └───────────────────────────────────────────────────────────┘
 *
 * Tombol kembali (←) menuju daftar jadwal kerja.
 */
export function JadwalDetailPage({ groupId }: { groupId: string }) {
  const group = useApiGet<WorkGroupResource>(`/api/work-groups/${groupId}`);
  const shifts = useApiGet<ShiftResource[]>("/api/shifts");
  const holidays = useApiGet<HolidayResource[]>("/api/holidays");
  const [month, setMonth] = useState(() => currentMonth());

  const requests = [group, shifts, holidays];
  if (requests.some((request) => request.loading)) return <PageLoading label="Memuat data jadwal..." />;
  const failed = requests.find((request) => request.error);
  if (failed || !group.data || !shifts.data || !holidays.data) {
    return <PageError message={failed?.error ?? "Regu kerja tidak ditemukan."} />;
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
            <Link href={LIST_URL} aria-label="Kembali ke daftar jadwal">
              <ChevronLeft />
            </Link>
          </Button>
          <div>
            <h1 className="typo-h3 text-fg-heading">Jadwal {group.data.name}</h1>
            <p className="mt-1 typo-body-m text-fg-secondary">
              {group.data.sub_unit.name}
              {group.data.placement_object && ` · ${group.data.placement_object.name}`} · {group.data.work_pattern.name}{" "}
              · {group.data.active_member_count} anggota
            </p>
          </div>
        </div>

        {/* Pilih bulan */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Bulan sebelumnya">
            <ChevronLeft />
          </Button>
          <span className="min-w-36 text-center typo-label-m text-fg-heading">{formatMonth(month)}</span>
          <Button variant="outline" size="icon-sm" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Bulan berikutnya">
            <ChevronRight />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <GroupMonthSchedule
            key={month}
            group={group.data}
            month={month}
            shifts={shifts.data}
            holidays={holidays.data}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/** Jadwal satu regu satu bulan: cari periodenya dulu, lalu tampilkan jadwal resmi atau proyeksi. */
function GroupMonthSchedule({
  group,
  month,
  shifts,
  holidays,
}: {
  group: WorkGroupResource;
  month: string;
  shifts: ShiftResource[];
  holidays: HolidayResource[];
}) {
  const { data: periods, loading, error, reload } = useApiGet<SchedulePeriodResource[]>(
    `/api/schedule-periods?group_id=${group.id}&month=${month}`,
  );

  if (loading) return <PageLoading label="Memuat jadwal..." />;
  if (error || !periods) return <PageError message={error ?? "Jadwal gagal dimuat."} />;

  const period = periods[0];
  return period ? (
    <SchedulePeriodPanel key={period.id} periodId={period.id} shifts={shifts} holidays={holidays} onDeleted={reload} />
  ) : (
    <ScheduleProjectionPanel
      groupId={group.id}
      groupName={group.name}
      month={month}
      shifts={shifts}
      holidays={holidays}
      onCreated={reload}
    />
  );
}
