"use client";

import type { Dispatch, SetStateAction } from "react";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { FieldLegend, FieldSet } from "@mestakara/ui/field";

import { DateField } from "@/components/shared/FormFields";
import { formatDate } from "@/lib/date";
import type { WorkGroupResource } from "@/types/api/work-group";
import type { WorkPatternResource } from "@/types/api/work-pattern";

import { EmployeePickerTable } from "./EmployeePickerTable";
import { autoFillSlots, type SlotHolder } from "./group-members";
import { MemberSlotList, type ExistingMemberRow } from "./MemberSlotList";
import { newMember, type ReguFormValues, type StepErrors } from "./regu-form-values";
import type { ReguFormData } from "./useReguFormData";

interface StepAnggotaSlotProps {
  values: ReguFormValues;
  setValues: Dispatch<SetStateAction<ReguFormValues>>;
  errors: StepErrors;
  disabled: boolean;
  data: ReguFormData;
  /** Regu yang dikelola anggotanya (kosong = regu baru di wizard tambah) */
  group?: WorkGroupResource;
  pattern: WorkPatternResource;
  /** Anggota lama yang memegang slot pada tanggal bergabung */
  oldHolders: SlotHolder[];
  /** Tanggal bergabung anggota baru (regu baru = Tanggal Mulai Berlaku) */
  joinDate: string;
}

/**
 * ANGGOTA & SLOT — langkah 2 wizard Tambah Regu (boleh dilewati) dan isi halaman Kelola Anggota:
 *
 *   (edit) Tanggal Bergabung Anggota Baru [📅]
 *   Tabel karyawan (centang satu atau banyak)
 *   Daftar slot: anggota saat ini (hanya dilihat) + karyawan baru dengan pilihan slot   [Isi Slot Otomatis]
 */
export function StepAnggotaSlot({
  values,
  setValues,
  errors,
  disabled,
  data,
  group,
  pattern,
  oldHolders,
  joinDate,
}: StepAnggotaSlotProps) {
  const subUnitName = data.subUnits.find((item) => item.id === values.sub_unit_id)?.name ?? "-";
  const nameOf = (employeeId: string) => data.employees.find((item) => item.id === employeeId)?.name ?? "-";

  // Anggota yang sudah ada di regu (belum selesai), ditampilkan di daftar bawah supaya tidak perlu dicari lagi.
  // Slotnya = slot pada tanggal bergabung anggota baru (hasil rotasi), atau slot awalnya kalau tidak aktif saat itu.
  const existingMembers: ExistingMemberRow[] = (group?.members ?? [])
    .filter((member) => member.period !== "Selesai")
    .map((member) => {
      const holder = oldHolders.find((item) => item.memberId === member.id);
      return {
        id: member.id,
        name: member.employee.name,
        slotId: holder?.slotId ?? member.start_slot.id,
        note: holder
          ? `slot pada ${formatDate(joinDate)}`
          : member.start_date > joinDate
            ? `bergabung ${formatDate(member.start_date)}`
            : `sampai ${formatDate(member.end_date)}`,
      };
    });

  /** Centang berubah: karyawan yang sudah dipilih tetap (slotnya tidak hilang), yang baru ditambahkan. */
  function changeSelection(employeeIds: string[]) {
    setValues((previous) => ({
      ...previous,
      members: employeeIds.map(
        (employeeId) => previous.members.find((member) => member.employee_id === employeeId) ?? newMember(employeeId),
      ),
    }));
  }

  function changeSlot(employeeId: string, slotId: string) {
    setValues((previous) => ({
      ...previous,
      members: previous.members.map((member) =>
        member.employee_id === employeeId ? { ...member, start_slot_id: slotId } : member,
      ),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert variant="info">
        <Info />
        <AlertDescription>
          {group ? (
            <p>
              Centang karyawan baru, lalu tentukan slotnya. Anggota saat ini ditampilkan di daftar paling bawah;
              untuk mengakhiri keanggotaan pakai tombol &ldquo;Akhiri&rdquo; di halaman detail regu.
            </p>
          ) : (
            <p>
              Pilih karyawan anggota regu, lalu tentukan slot masing-masing. Langkah ini boleh dilewati; anggota bisa
              ditambahkan kapan saja lewat <strong>Kelola Anggota</strong> di halaman detail regu.
            </p>
          )}
        </AlertDescription>
      </Alert>

      {group && (
        <div className="grid gap-5 md:grid-cols-2">
          <DateField
            id="members_start_date"
            label="Tanggal Bergabung Anggota Baru"
            required={values.members.length > 0}
            value={values.members_start_date}
            onChange={(value) => setValues((previous) => ({ ...previous, members_start_date: value }))}
            error={errors.members_start_date}
            disabled={disabled}
            fromYear={2020}
            note={`slot yang dipilih = slot pada tanggal ini. Paling awal ${formatDate(values.anchor_date)}.`}
          />
        </div>
      )}

      <FieldSet className="min-w-0">
        <FieldLegend>Pilih Karyawan</FieldLegend>
        <EmployeePickerTable
          data={data}
          groupId={group?.id ?? null}
          subUnitId={values.sub_unit_id}
          subUnitName={subUnitName}
          date={joinDate}
          selectedIds={values.members.map((member) => member.employee_id)}
          onSelectionChange={changeSelection}
          disabled={disabled}
        />
      </FieldSet>

      {existingMembers.length + values.members.length > 0 && (
        <FieldSet className="min-w-0">
          <FieldLegend>Slot Setiap Karyawan</FieldLegend>
          <MemberSlotList
            existingMembers={existingMembers}
            members={values.members}
            nameOf={nameOf}
            pattern={pattern}
            shifts={data.shifts}
            errors={errors}
            disabled={disabled}
            onSlotChange={changeSlot}
            onRemove={(employeeId) =>
              changeSelection(values.members.map((member) => member.employee_id).filter((id) => id !== employeeId))
            }
            onAutoFill={() =>
              setValues((previous) => ({ ...previous, members: autoFillSlots(previous, pattern, oldHolders) }))
            }
          />
        </FieldSet>
      )}
    </div>
  );
}
