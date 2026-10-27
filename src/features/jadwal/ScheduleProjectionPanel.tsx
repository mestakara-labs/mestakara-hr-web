"use client";

import { useState } from "react";
import { CalendarPlus, Info } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { ApiError, apiPost } from "@/lib/http-client";
import { datesOfMonth, formatMonth, monthPosition } from "@/lib/schedule-period-rules";
import type { HolidayResource } from "@/types/api/holiday";
import type { ShiftResource } from "@/types/api/shift";
import type { ProjectionResource } from "@/types/api/work-group";

import { PeriodStatusBadge } from "./PeriodStatusBadge";
import { ScheduleGrid } from "./ScheduleGrid";
import { rowsFromProjection, vacancyLabels } from "./schedule-grid-rows";

interface ScheduleProjectionPanelProps {
  groupId: string;
  groupName: string;
  month: string;
  shifts: ShiftResource[];
  holidays: HolidayResource[];
  /** Dipanggil setelah jadwal berhasil dibuat */
  onCreated: () => void;
}

/**
 * Bulan yang BELUM punya jadwal resmi: tampilkan PROYEKSI (perkiraan dari pola & rotasi).
 *
 *   [Proyeksi]  Jadwal November 2026 belum dibuat.        [Buat Jadwal November 2026]
 *   ScheduleGrid (tidak bisa diklik)
 *
 * Tombol "Buat Jadwal" hanya untuk bulan berjalan & bulan depan (jendela jadwal).
 * Nantinya backend juga membuatnya otomatis lewat cron setiap tanggal 20.
 */
export function ScheduleProjectionPanel({
  groupId,
  groupName,
  month,
  shifts,
  holidays,
  onCreated,
}: ScheduleProjectionPanelProps) {
  const dates = datesOfMonth(month);
  const { data: projection, loading, error } = useApiGet<ProjectionResource>(
    `/api/work-groups/${groupId}/projection?from=${dates[0]}&to=${dates[dates.length - 1]}`,
  );
  const [creating, setCreating] = useState(false);
  const position = monthPosition(month);

  async function create() {
    setCreating(true);
    try {
      const response = await apiPost("/api/schedule-periods", { group_id: groupId, month });
      toast.success(response.message);
      onCreated();
    } catch (createError) {
      toast.error(createError instanceof ApiError ? createError.message : "Jadwal gagal dibuat.");
    } finally {
      setCreating(false);
    }
  }

  const message = {
    window: `Jadwal ${groupName} untuk ${formatMonth(month)} belum dibuat. Di bawah ini perkiraan dari pola & rotasi regu.`,
    future: `${formatMonth(month)} masih di luar jendela jadwal (bulan berjalan & bulan depan). Di bawah ini hanya perkiraan.`,
    past: `Tidak ada jadwal resmi untuk ${formatMonth(month)}. Di bawah ini perkiraan dari pola & rotasi regu.`,
  }[position];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <PeriodStatusBadge status="Proyeksi" />
          <span className="typo-label-m text-fg-heading">
            {groupName} · {formatMonth(month)}
          </span>
        </div>
        {position === "window" && (
          <Button onClick={create} disabled={creating}>
            {creating ? <Spinner /> : <CalendarPlus />}
            Buat Jadwal {formatMonth(month)}
          </Button>
        )}
      </div>

      <Alert variant="info">
        <Info />
        <AlertDescription>
          <p>{message}</p>
        </AlertDescription>
      </Alert>

      {loading && <PageLoading label="Menghitung proyeksi..." />}
      {error && <PageError message={error} />}
      {projection && (
        <ScheduleGrid
          dates={projection.dates}
          rows={rowsFromProjection(projection)}
          shifts={shifts}
          holidays={holidays}
          vacanciesByDate={vacancyLabels(projection.vacancies, shifts)}
        />
      )}
    </div>
  );
}
