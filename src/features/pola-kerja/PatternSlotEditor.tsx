"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Checkbox } from "@mestakara/ui/checkbox";
import { Input } from "@mestakara/ui/input";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import { cn } from "cn";

import { DAY_OFF_LABEL, shiftOptionLabel } from "@/lib/shift-rules";
import { dayLabel, type DayView } from "@/lib/work-pattern-rules";
import type { ShiftResource } from "@/types/api/shift";
import type { PatternSlotPayload } from "@/types/api/work-pattern";

import { newSlot } from "./pola-form-values";

interface PatternSlotEditorProps {
  slots: PatternSlotPayload[];
  cycleDays: number;
  /** Cara menampilkan judul hari (Hari ke-n / nama hari) */
  dayView: DayView;
  shifts: ShiftResource[];
  onChange: (slots: PatternSlotPayload[]) => void;
  /** Pesan error per slot dari server, mis. { "slots.1.code": "Kode dipakai lebih dari sekali" } */
  errors: Record<string, string | undefined>;
  disabled: boolean;
}

/**
 * EDITOR POLA: tabel slot × hari siklus.
 *
 *   Kode | Nama       | Bergilir | Hari ke-1 | Hari ke-2 | ... | Hari ke-7 |
 *   [A]  | [Posisi A] |   [✓]    | [P (07.00–12.00)] | [P (07.00–12.00)] | ... | [L (Libur)] | [↑][↓][🗑]
 *   [B]  | ...
 *   [+ Tambah Slot]
 *
 * Setiap sel berisi pilihan shift beserta jam kerjanya, atau "L (Libur)". Urutan baris = urutan putaran.
 */
export function PatternSlotEditor({ slots, cycleDays, dayView, shifts, onChange, errors, disabled }: PatternSlotEditorProps) {
  const days = Array.from({ length: cycleDays }, (_, index) => index);

  /** Ubah satu slot. */
  function updateSlot(index: number, changes: Partial<PatternSlotPayload>) {
    onChange(slots.map((slot, position) => (position === index ? { ...slot, ...changes } : slot)));
  }

  /** Ganti shift satu sel (slot ke-`index`, hari ke-`day`). "" = libur. */
  function changeCell(index: number, day: number, shiftId: string) {
    const shiftIds = [...slots[index].shift_ids];
    shiftIds[day] = shiftId || null;
    updateSlot(index, { shift_ids: shiftIds });
  }

  /** Geser slot naik (-1) atau turun (+1) dalam urutan putaran. */
  function moveSlot(index: number, step: -1 | 1) {
    const target = index + step;
    if (target < 0 || target >= slots.length) return;
    const next = [...slots];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse typo-body-s">
          <thead className="bg-subtle text-fg-secondary">
            <tr>
              <th className="px-2 py-2 text-left font-medium">Kode</th>
              <th className="px-2 py-2 text-left font-medium">Nama Slot</th>
              <th className="px-2 py-2 text-center font-medium" title="Ikut bergilir pada regu dengan mode Bergilir">
                Bergilir
              </th>
              {days.map((day) => (
                <th key={day} className="px-1 py-2 text-center font-medium whitespace-nowrap">
                  {dayLabel(day + 1, dayView)}
                </th>
              ))}
              <th className="px-2 py-2" aria-label="Aksi" />
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, index) => {
              const codeError = errors[`slots.${index}.code`];
              const daysError = errors[`slots.${index}.shift_ids`];

              return (
                <tr key={slot.id} className="border-t border-border align-top">
                  <td className="px-2 py-2">
                    <Input
                      aria-label={`Kode slot ke-${index + 1}`}
                      value={slot.code}
                      onChange={(event) => updateSlot(index, { code: event.target.value.toUpperCase() })}
                      aria-invalid={Boolean(codeError)}
                      disabled={disabled}
                      className="w-14"
                      maxLength={3}
                    />
                    {codeError && <p className="mt-1 w-28 text-xs text-fg-danger">{codeError}</p>}
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      aria-label={`Nama slot ${slot.code}`}
                      value={slot.name}
                      onChange={(event) => updateSlot(index, { name: event.target.value })}
                      disabled={disabled}
                      className="w-40"
                    />
                    {daysError && <p className="mt-1 w-40 text-xs text-fg-danger">{daysError}</p>}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <Checkbox
                      aria-label={`Slot ${slot.code} ikut bergilir`}
                      checked={slot.rotates}
                      onCheckedChange={(checked) => updateSlot(index, { rotates: checked === true })}
                      disabled={disabled}
                    />
                  </td>
                  {days.map((day) => (
                    <td key={day} className="px-1 py-2">
                      <NativeSelect
                        aria-label={`Slot ${slot.code} ${dayLabel(day + 1, dayView)}`}
                        value={slot.shift_ids[day] ?? ""}
                        onChange={(event) => changeCell(index, day, event.target.value)}
                        disabled={disabled}
                        size="sm"
                        className={cn("w-48", !slot.shift_ids[day] && "text-fg-tertiary")}
                      >
                        <NativeSelectOption value="">{DAY_OFF_LABEL}</NativeSelectOption>
                        {shifts.map((shift) => (
                          <NativeSelectOption key={shift.id} value={shift.id}>
                            {shiftOptionLabel(shift)}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <div className="flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveSlot(index, -1)}
                        disabled={disabled || index === 0}
                        aria-label={`Naikkan slot ${slot.code}`}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveSlot(index, 1)}
                        disabled={disabled || index === slots.length - 1}
                        aria-label={`Turunkan slot ${slot.code}`}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onChange(slots.filter((_, position) => position !== index))}
                        disabled={disabled || slots.length === 1}
                        aria-label={`Hapus slot ${slot.code}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...slots, newSlot(slots, cycleDays)])}
          disabled={disabled}
        >
          <Plus />
          Tambah Slot
        </Button>
        <p className="text-xs text-fg-tertiary">
          Catatan: L = libur. Urutan baris = urutan putaran untuk regu bergilir. Hapus centang &ldquo;Bergilir&rdquo;
          kalau anggota slot itu harus selalu di posisinya.
        </p>
      </div>
    </div>
  );
}
