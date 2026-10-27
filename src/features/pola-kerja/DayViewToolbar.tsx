"use client";

import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "@mestakara/ui/toggle-group";

import { WEEKDAY_NAMES, type DayView } from "@/lib/work-pattern-rules";

interface DayViewToolbarProps {
  view: DayView;
  onChange: (view: DayView) => void;
}

/**
 * Pilihan TAMPILAN JUDUL HARI di editor & ringkasan pola (tidak ikut disimpan):
 *
 *   Tampilkan [Hari ke-n | Nama Hari]   Umpamakan Hari ke-1 = [Senin ▾]   <- hanya saat "Nama Hari"
 */
export function DayViewToolbar({ view, onChange }: DayViewToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 typo-body-s text-fg-secondary">
      <span className="flex items-center gap-2">
        Tampilkan
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={0}
          value={view.mode}
          // Klik pilihan yang sudah aktif mengirim "" -> abaikan supaya selalu ada yang terpilih.
          onValueChange={(mode) => mode && onChange({ ...view, mode: mode as DayView["mode"] })}
          aria-label="Tampilan judul hari"
        >
          <ToggleGroupItem value="number">Hari ke-n</ToggleGroupItem>
          <ToggleGroupItem value="weekday">Nama Hari</ToggleGroupItem>
        </ToggleGroup>
      </span>

      {view.mode === "weekday" && (
        <span className="flex items-center gap-2">
          Umpamakan Hari ke-1 =
          <NativeSelect
            aria-label="Umpamakan hari ke-1"
            size="sm"
            value={String(view.dayOneWeekday)}
            onChange={(event) => onChange({ ...view, dayOneWeekday: Number(event.target.value) })}
            className="w-28"
          >
            {WEEKDAY_NAMES.map((name, index) => (
              <NativeSelectOption key={name} value={String(index + 1)}>
                {name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </span>
      )}
    </div>
  );
}
