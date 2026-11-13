"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@mestakara/ui/popover";

import { BrmLevelBadge } from "@/features/jabatan/BrmLevelBadge";
import type { EmployeePlacement } from "@/types/api/employee";

/**
 * Tanda penugasan ganda di kolom Jabatan: badge "+1" (atau +2, dst.).
 * Diklik -> muncul daftar SEMUA jabatan aktif karyawan itu:
 *
 *   [+1]
 *    ┌ 2 jabatan aktif ─────────────────────────────┐
 *    │ Asisten Manager Operasional   [BRM-2]        │
 *    │ Definitif · Jabatan utama                    │
 *    │ Operasional · Agrowisata Gunung Mas · ATV    │
 *    │──────────────────────────────────────────────│
 *    │ Asisten Pemasaran             [BRM-3]        │
 *    │ Plt                                          │
 *    │ Pemasaran · Kantor Induk                     │
 *    └──────────────────────────────────────────────┘
 *
 * `positions` = active_positions karyawan (jabatan utama di urutan pertama).
 * Tidak tampil apa-apa kalau jabatannya hanya satu (atau belum ada).
 */
export function ActivePositionsPopover({ positions }: { positions: EmployeePlacement[] }) {
  if (positions.length <= 1) return null;

  return (
    <Popover>
      <PopoverTrigger
        className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-xs font-semibold text-fg-brand hover:bg-primary hover:text-white"
        aria-label={`Lihat ${positions.length} jabatan aktif`}
      >
        +{positions.length - 1}
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <p className="border-b border-border px-4 py-2.5 typo-label-m text-fg-heading">{positions.length} jabatan aktif</p>
        <ul className="flex max-h-80 flex-col overflow-y-auto">
          {positions.map((position, index) => (
            <li key={position.assignment_id} className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-0">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-fg-heading">{position.title}</span>
                <BrmLevelBadge level={position.brm_level} />
              </div>
              <p className="typo-body-s text-fg-secondary">
                {position.assignment_status}
                {index === 0 && " · Jabatan utama"}
              </p>
              <p className="typo-body-s text-fg-tertiary">{placementText(position)}</p>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** "Bidang · Sub Unit · Objek"; bagian yang kosong dilewati. */
function placementText(position: EmployeePlacement): string {
  return [position.division?.name, position.sub_unit.name, position.placement_object?.name]
    .filter(Boolean)
    .join(" · ");
}
