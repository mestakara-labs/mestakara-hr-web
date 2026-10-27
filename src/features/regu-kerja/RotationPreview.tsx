"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@mestakara/ui/button";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { ScheduleGrid } from "@/features/jadwal/ScheduleGrid";
import { useApiGet } from "@/hooks/useApiGet";
import { addDays, formatDate, mondayOf, toDateText } from "@/lib/date";
import type { HolidayResource } from "@/types/api/holiday";
import type { ShiftResource } from "@/types/api/shift";
import type { ProjectionResource } from "@/types/api/work-group";

/** Pratinjau selalu 4 minggu (28 hari), mulai hari Senin. */
const PREVIEW_DAYS = 28;

interface RotationPreviewProps {
  groupId: string;
  shifts: ShiftResource[];
  holidays: HolidayResource[];
}

/**
 * PRATINJAU ROTASI 4 MINGGU (proyeksi, tidak disimpan):
 *
 *   [‹]  5 Oktober 2026 – 1 November 2026  [›]
 *   ScheduleGrid: anggota × tanggal, kode shift + kode slot kecil, baris "Shift kosong"
 *
 * Mulai dari Senin minggu ini; tombol ‹ › menggeser 4 minggu.
 */
export function RotationPreview({ groupId, shifts, holidays }: RotationPreviewProps) {
  const [from, setFrom] = useState(() => mondayOf(toDateText(new Date())));
  const to = addDays(from, PREVIEW_DAYS - 1);
  const { data: projection, loading, error } = useApiGet<ProjectionResource>(
    `/api/work-groups/${groupId}/projection?from=${from}&to=${to}`,
  );

  // Kode shift yang kosong per tanggal, mis. { "2026-10-14": ["P"] }
  const shiftCode = (shiftId: string) => shifts.find((shift) => shift.id === shiftId)?.code ?? "?";
  const vacanciesByDate: Record<string, string[]> = {};
  for (const vacancy of projection?.vacancies ?? []) {
    (vacanciesByDate[vacancy.date] ??= []).push(shiftCode(vacancy.shift_id));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="icon-sm" onClick={() => setFrom(addDays(from, -PREVIEW_DAYS))} aria-label="4 minggu sebelumnya">
          <ChevronLeft />
        </Button>
        <p className="typo-label-m text-fg-heading">
          {formatDate(from)} – {formatDate(to)}
        </p>
        <Button variant="outline" size="icon-sm" onClick={() => setFrom(addDays(from, PREVIEW_DAYS))} aria-label="4 minggu berikutnya">
          <ChevronRight />
        </Button>
      </div>

      {loading && <PageLoading label="Menghitung rotasi..." />}
      {error && <PageError message={error} />}
      {projection && (
        <ScheduleGrid
          dates={projection.dates}
          shifts={shifts}
          holidays={holidays}
          vacanciesByDate={vacanciesByDate}
          rows={projection.rows.map((row) => ({
            key: row.member_id,
            title: row.employee.name,
            cells: row.cells.map((cell) => ({
              date: cell.date,
              shiftId: cell.shift_id,
              slotCode: cell.slot_code,
              inactive: cell.slot_code === null,
            })),
          }))}
        />
      )}
      <p className="text-xs text-fg-tertiary">
        Catatan: huruf kecil di bawah kode shift = slot yang dipegang hari itu. &ldquo;–&rdquo; = belum/sudah tidak
        menjadi anggota. Ini perkiraan dari pola & rotasi; jadwal resmi dibuat di menu Jadwal Kerja.
      </p>
    </div>
  );
}
