"use client";

import { Wand2, X } from "lucide-react";
import { Badge } from "@mestakara/ui/badge";
import { Button } from "@mestakara/ui/button";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";

import type { ShiftResource } from "@/types/api/shift";
import type { NewMemberPayload } from "@/types/api/work-group";
import type { WorkPatternResource } from "@/types/api/work-pattern";

import type { StepErrors } from "./regu-form-values";
import { slotOptionsWithHours } from "./slot-hours";

/** Anggota yang SUDAH ada di regu (hanya ditampilkan, tidak diubah di wizard). */
export interface ExistingMemberRow {
  id: string;
  name: string;
  slotId: string;
  /** Keterangan kecil, mis. "slot pada 20 Oktober 2026" */
  note: string;
}

interface MemberSlotListProps {
  /** Anggota lama (edit regu); [] untuk regu baru */
  existingMembers: ExistingMemberRow[];
  members: NewMemberPayload[];
  /** Nama karyawan per id */
  nameOf: (employeeId: string) => string;
  pattern: WorkPatternResource;
  shifts: ShiftResource[];
  errors: StepErrors;
  disabled: boolean;
  onSlotChange: (employeeId: string, slotId: string) => void;
  onRemove: (employeeId: string) => void;
  onAutoFill: () => void;
}

/**
 * KARYAWAN TERPILIH + SLOT MASING-MASING:
 *
 *   2 anggota saat ini · 1 karyawan baru dipilih                [✨ Isi Slot Otomatis]
 *   1  Agus Salim    (Anggota saat ini)  A — Posisi A · P 07.00–12.00 ×5, L ×2   <- hanya dilihat
 *   2  Budi Santoso  (Anggota saat ini)  B — Posisi B · S 12.00–17.00 ×5, L ×2
 *   3  Cecep         [C — Posisi C · ... ▾]                                     [×]
 *
 * Slot = posisi karyawan pada tanggal bergabung. Setelah itu ikut berputar sesuai mode rotasi regu.
 */
export function MemberSlotList({
  existingMembers,
  members,
  nameOf,
  pattern,
  shifts,
  errors,
  disabled,
  onSlotChange,
  onRemove,
  onAutoFill,
}: MemberSlotListProps) {
  const options = slotOptionsWithHours(pattern.slots, shifts);
  const slotLabel = (slotId: string) => options.find((option) => option.value === slotId)?.label ?? "-";
  const counts = [
    existingMembers.length > 0 ? `${existingMembers.length} anggota saat ini` : null,
    `${members.length} karyawan baru dipilih`,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="typo-label-m text-fg-heading">{counts.join(" · ")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAutoFill}
          disabled={disabled || members.length === 0}
        >
          <Wand2 />
          Isi Slot Otomatis
        </Button>
      </div>

      <ol className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {existingMembers.map((member, index) => (
          <li key={member.id} className="flex flex-col gap-2 bg-subtle p-3 md:flex-row md:items-center">
            <span className="flex min-w-0 items-center gap-3 md:w-64">
              <span className="w-5 shrink-0 text-right typo-body-s text-fg-tertiary">{index + 1}</span>
              <span className="flex min-w-0 flex-col items-start gap-1">
                <span className="truncate font-medium text-fg-heading">{member.name}</span>
                <Badge variant="neutral" dot={false}>
                  Anggota saat ini
                </Badge>
              </span>
            </span>
            <span className="flex-1 typo-body-s text-fg-primary">
              {slotLabel(member.slotId)}
              <span className="block text-xs text-fg-tertiary">{member.note}</span>
            </span>
          </li>
        ))}
        {members.map((member, index) => {
          const error = errors[`members.${index}.start_slot_id`] ?? errors[`members.${index}.employee_id`];
          return (
            <li key={member.employee_id} className="flex flex-col gap-2 p-3 md:flex-row md:items-start">
              <span className="flex min-w-0 items-center gap-3 md:w-64 md:pt-2">
                <span className="w-5 shrink-0 text-right typo-body-s text-fg-tertiary">
                  {existingMembers.length + index + 1}
                </span>
                <span className="truncate font-medium text-fg-heading">{nameOf(member.employee_id)}</span>
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <NativeSelect
                  aria-label={`Slot ${nameOf(member.employee_id)}`}
                  value={member.start_slot_id}
                  onChange={(event) => onSlotChange(member.employee_id, event.target.value)}
                  aria-invalid={Boolean(error)}
                  disabled={disabled}
                  className="w-full"
                >
                  <NativeSelectOption value="">Pilih slot...</NativeSelectOption>
                  {options.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {error && <p className="text-xs text-fg-danger">{error}</p>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemove(member.employee_id)}
                disabled={disabled}
                aria-label={`Batalkan pilihan ${nameOf(member.employee_id)}`}
                className="self-end md:self-start md:mt-1"
              >
                <X />
              </Button>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-fg-tertiary">
        Catatan: slot = posisi karyawan pada tanggal bergabung; setelah itu ikut berputar sesuai mode rotasi regu. P
        07.00–12.00 ×5 = shift P sebanyak 5 hari dalam satu siklus, L = libur. Anggota saat ini tidak diubah di sini;
        akhiri keanggotaan lewat tombol &ldquo;Akhiri&rdquo; di detail regu.
      </p>
    </div>
  );
}
