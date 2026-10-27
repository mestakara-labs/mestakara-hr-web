"use client";

import { FieldLegend, FieldSet } from "@mestakara/ui/field";

import { DateField, SearchSelectField, SelectField, TextAreaField, TextField } from "@/components/shared/FormFields";
import { toObjectOptions, toSubUnitOptions } from "@/features/jabatan-karyawan/assignment-options";
import { formatDayName } from "@/lib/date";
import { ROTATION_MODE, ROTATION_MODES } from "@/lib/schedule-rules";

import type { ReguFormValues, StepErrors } from "./regu-form-values";
import type { ReguFormData } from "./useReguFormData";

interface StepDataReguProps {
  values: ReguFormValues;
  /** Ubah satu isian langkah ini */
  onChange: (key: keyof ReguFormValues, value: string) => void;
  errors: StepErrors;
  disabled: boolean;
  data: ReguFormData;
  /** Regu sudah punya anggota aktif -> pola tidak bisa diganti */
  hasActiveMembers: boolean;
}

/**
 * LANGKAH 1 — DATA REGU
 *
 *   Nama Regu                       Ketua Regu (opsional)
 *   Sub Unit                        Objek Penempatan (opsional)
 *   Pola & Rotasi:
 *   Pola Kerja                      Tanggal Mulai Berlaku Jadwal (= hari ke-1 pola)
 *   Mode Rotasi [Tetap|Bergilir]    Rotasi tiap [7] hari (hanya Bergilir)
 *   Keterangan
 */
export function StepDataRegu({ values, onChange, errors, disabled, data, hasActiveMembers }: StepDataReguProps) {
  const employeeOptions = data.employees.map((employee) => ({
    value: employee.id,
    label: employee.name,
    hint: employee.position?.title ?? "Belum ditempatkan",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          id="name"
          label="Nama Regu"
          required
          value={values.name}
          onChange={(value) => onChange("name", value)}
          error={errors.name}
          disabled={disabled}
          placeholder="Cth. House Keeping Gunung Mas"
        />
        <SearchSelectField
          id="leader_employee_id"
          label="Ketua Regu"
          options={employeeOptions}
          value={values.leader_employee_id}
          onChange={(value) => onChange("leader_employee_id", value)}
          error={errors.leader_employee_id}
          disabled={disabled}
          placeholder="Cari nama karyawan..."
          emptyMessage="Karyawan tidak ditemukan."
          note="opsional. Nantinya ketua regu yang menyetujui jadwal."
        />
        <SelectField
          id="sub_unit_id"
          label="Sub Unit"
          required
          options={toSubUnitOptions(data.subUnits)}
          value={values.sub_unit_id}
          onChange={(value) => onChange("sub_unit_id", value)}
          error={errors.sub_unit_id}
          disabled={disabled}
        />
        <SelectField
          id="placement_object_id"
          label="Objek Penempatan"
          options={toObjectOptions(data.placementObjects, values.sub_unit_id).map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          emptyLabel={values.sub_unit_id ? "Tanpa objek penempatan" : "Pilih Sub Unit terlebih dahulu"}
          value={values.placement_object_id}
          onChange={(value) => onChange("placement_object_id", value)}
          error={errors.placement_object_id}
          disabled={disabled || !values.sub_unit_id}
        />
      </div>

      <FieldSet>
        <FieldLegend>Pola & Rotasi</FieldLegend>
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            id="work_pattern_id"
            label="Pola Kerja"
            required
            options={data.patterns.map((pattern) => ({
              value: pattern.id,
              label: `${pattern.name} — ${pattern.slots.length} slot, siklus ${pattern.cycle_days} hari`,
            }))}
            value={values.work_pattern_id}
            onChange={(value) => onChange("work_pattern_id", value)}
            error={errors.work_pattern_id}
            disabled={disabled || hasActiveMembers}
            note={
              hasActiveMembers
                ? "tidak bisa diganti selama masih ada anggota aktif (slot anggota mengikuti pola ini)."
                : "menentukan slot dan urutan shift setiap hari siklus."
            }
          />
          <DateField
            id="anchor_date"
            label="Tanggal Mulai Berlaku Jadwal"
            required
            value={values.anchor_date}
            onChange={(value) => onChange("anchor_date", value)}
            error={errors.anchor_date}
            disabled={disabled}
            placeholder="Pilih tanggal mulai berlaku"
            fromYear={2020}
            note={
              values.anchor_date
                ? `tanggal ini menjadi Hari ke-1 pola (hari ${formatDayName(values.anchor_date)}) dan awal hitungan rotasi.`
                : "tanggal ini menjadi Hari ke-1 pola dan awal hitungan rotasi."
            }
          />
          <SelectField
            id="rotation_mode"
            label="Mode Rotasi"
            required
            options={ROTATION_MODES}
            value={values.rotation_mode}
            onChange={(value) => onChange("rotation_mode", value)}
            error={errors.rotation_mode}
            disabled={disabled}
            note="Tetap = anggota selalu di slotnya. Bergilir = semua anggota maju ke slot berikutnya secara bersamaan."
          />
          {values.rotation_mode === ROTATION_MODE.rotating && (
            <TextField
              id="rotate_every_days"
              label="Rotasi Tiap (hari)"
              required
              inputMode="numeric"
              value={values.rotate_every_days}
              onChange={(value) => onChange("rotate_every_days", value)}
              error={errors.rotate_every_days}
              disabled={disabled}
              note="mis. 7 = semua anggota pindah slot setiap minggu, dihitung dari Tanggal Mulai Berlaku Jadwal."
            />
          )}
        </div>
      </FieldSet>

      <TextAreaField
        id="description"
        label="Keterangan"
        value={values.description}
        onChange={(value) => onChange("description", value)}
        disabled={disabled}
        placeholder="Cth. Setiap Senin semua anggota maju satu posisi"
      />
    </div>
  );
}
