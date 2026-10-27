/**
 * MENYUSUN BARIS KALENDER dari data API, untuk ScheduleGrid.
 * Dipisah dari file tampilan supaya halaman Jadwal Kerja tetap pendek.
 */
import type { ScheduleEntryResource } from "@/types/api/schedule";
import type { ShiftResource } from "@/types/api/shift";
import type { ProjectionResource } from "@/types/api/work-group";

import type { ScheduleGridRow } from "./ScheduleGrid";

/**
 * Baris jadwal resmi: satu baris per anggota (urut nama), satu sel per tanggal.
 * Tanggal tanpa baris jadwal = anggota tidak aktif ("–").
 * `onEdit` diisi kalau sel boleh diubah.
 */
export function rowsFromEntries(
  dates: string[],
  entries: ScheduleEntryResource[],
  onEdit?: (entry: ScheduleEntryResource) => void,
): ScheduleGridRow[] {
  const byMember = new Map<string, ScheduleEntryResource[]>();
  for (const entry of entries) {
    byMember.set(entry.member_id, [...(byMember.get(entry.member_id) ?? []), entry]);
  }

  return [...byMember.entries()]
    .map(([memberId, memberEntries]) => {
      const byDate = new Map(memberEntries.map((entry) => [entry.work_date, entry]));
      return {
        key: memberId,
        title: memberEntries[0].employee.name,
        cells: dates.map((date) => {
          const entry = byDate.get(date);
          if (!entry) return { date, shiftId: null, inactive: true };
          return {
            date,
            shiftId: entry.shift_id,
            slotCode: entry.slot_code,
            isManual: entry.source === "Manual",
            onClick: onEdit ? () => onEdit(entry) : undefined,
          };
        }),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Baris proyeksi (belum disimpan): satu baris per anggota, tidak bisa diklik. */
export function rowsFromProjection(projection: ProjectionResource): ScheduleGridRow[] {
  return projection.rows.map((row) => ({
    key: row.member_id,
    title: row.employee.name,
    cells: row.cells.map((cell) => ({
      date: cell.date,
      shiftId: cell.shift_id,
      slotCode: cell.slot_code,
      inactive: cell.slot_code === null,
    })),
  }));
}

/**
 * Shift kosong per tanggal untuk baris "Shift kosong", mis. { "2026-10-14": ["T", "P×2"] }.
 * `missing` > 1 ditulis "×jumlah".
 */
export function vacancyLabels(
  vacancies: { date: string; shift_id: string; missing?: number }[],
  shifts: ShiftResource[],
): Record<string, string[]> {
  const labels: Record<string, string[]> = {};
  for (const vacancy of vacancies) {
    const code = shifts.find((shift) => shift.id === vacancy.shift_id)?.code ?? "?";
    const missing = vacancy.missing ?? 1;
    (labels[vacancy.date] ??= []).push(missing > 1 ? `${code}×${missing}` : code);
  }
  return labels;
}
