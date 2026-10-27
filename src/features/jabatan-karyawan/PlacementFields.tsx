"use client";

import { DateField, SearchMultiSelectField, SearchSelectField, SelectField } from "@/components/shared/FormFields";
import { ASSIGNMENT_STATUS_OPTIONS, needsSupervisor } from "@/lib/assignment-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { PositionResource } from "@/types/api/organization";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";

import {
  keepObjectsAvailableIn,
  toObjectOptions,
  toPositionOptions,
  toSubUnitOptions,
  toSupervisorOptions,
} from "./assignment-options";

/** Isian penempatan jabatan satu karyawan ("" = kosong). */
export interface PlacementValues {
  position_id: string;
  assignment_status: string;
  sub_unit_id: string;
  placement_object_ids: string[];
  supervisor_assignment_ids: string[];
  end_date: string;
}

/** Data pilihan yang dibutuhkan isian penempatan. */
export interface PlacementData {
  positions: PositionResource[];
  assignments: AssignmentResource[];
  subUnits: SubUnitResource[];
  placementObjects: PlacementObjectResource[];
}

interface PlacementFieldsProps {
  /** Awalan id isian supaya unik per karyawan, mis. id item */
  idPrefix: string;
  values: PlacementValues;
  /** Karyawan yang ditempatkan (tidak boleh menjadi atasannya sendiri) */
  employeeId: string;
  data: PlacementData;
  errors: Partial<Record<keyof PlacementValues, string>>;
  disabled: boolean;
  /** Tampilkan isian TMT Selesai (mis. Penugasan Sementara / Plh) */
  showEndDate: boolean;
  onChange: (values: PlacementValues) => void;
}

/**
 * ISIAN PENEMPATAN JABATAN satu karyawan, dipakai bersama Mutasi & Penambahan Karyawan:
 *
 *   Jabatan [cari]       Status Jabatan [▾]
 *   Sub Unit [▾]         Objek Penempatan [cari, bisa lebih dari satu]
 *   Atasan Langsung [cari, bisa lebih dari satu]
 *   TMT Selesai (opsional, kalau showEndDate)
 *
 * Otomatis: sub unit diganti -> objek yang tidak tersedia dibuang; jabatan diganti -> atasan
 * yang tidak lagi memenuhi syarat (level BRM) dibuang.
 */
export function PlacementFields({
  idPrefix,
  values,
  employeeId,
  data,
  errors,
  disabled,
  showEndDate,
  onChange,
}: PlacementFieldsProps) {
  const position = data.positions.find((entry) => entry.id === values.position_id);

  function supervisorOptionsFor(positionId: string) {
    const target = data.positions.find((entry) => entry.id === positionId);
    return toSupervisorOptions(data.assignments, [{ brmLevel: target?.brm_level ?? null, employeeId, assignmentId: null }]);
  }

  /** Ubah satu isian (beserta isian yang bergantung padanya). */
  function change<K extends keyof PlacementValues>(key: K, value: PlacementValues[K]) {
    const next = { ...values, [key]: value };

    if (key === "sub_unit_id") {
      next.placement_object_ids = keepObjectsAvailableIn(next.placement_object_ids, data.placementObjects, next.sub_unit_id);
    }
    if (key === "position_id") {
      const allowedIds = supervisorOptionsFor(next.position_id).map((option) => option.value);
      next.supervisor_assignment_ids = next.supervisor_assignment_ids.filter((id) => allowedIds.includes(id));
    }

    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SearchSelectField
          id={`${idPrefix}-position`}
          label="Jabatan"
          required
          options={toPositionOptions(data.positions)}
          value={values.position_id}
          onChange={(value) => change("position_id", value)}
          error={errors.position_id}
          disabled={disabled}
          placeholder="Cari nama jabatan..."
          emptyMessage="Jabatan tidak ditemukan."
        />
        <SelectField
          id={`${idPrefix}-status`}
          label="Status Jabatan"
          required
          options={ASSIGNMENT_STATUS_OPTIONS}
          value={values.assignment_status}
          onChange={(value) => change("assignment_status", value)}
          error={errors.assignment_status}
          disabled={disabled}
        />
        <SelectField
          id={`${idPrefix}-sub-unit`}
          label="Sub Unit"
          required
          options={toSubUnitOptions(data.subUnits)}
          value={values.sub_unit_id}
          onChange={(value) => change("sub_unit_id", value)}
          error={errors.sub_unit_id}
          disabled={disabled}
        />
        <SearchMultiSelectField
          id={`${idPrefix}-objects`}
          label="Objek Penempatan"
          options={toObjectOptions(data.placementObjects, values.sub_unit_id)}
          value={values.placement_object_ids}
          onChange={(value) => change("placement_object_ids", value)}
          error={errors.placement_object_ids}
          disabled={disabled || !values.sub_unit_id}
          placeholder={values.sub_unit_id ? "Cari objek penempatan..." : "Pilih Sub Unit terlebih dahulu"}
          emptyMessage="Tidak ada objek di sub unit ini."
          note="opsional, bisa lebih dari satu. Cth. House Keeping untuk Pondokan dan Bungalow."
        />
      </div>

      <SearchMultiSelectField
        id={`${idPrefix}-supervisors`}
        label="Atasan Langsung"
        required={needsSupervisor(position?.brm_level ?? null)}
        options={supervisorOptionsFor(values.position_id)}
        value={values.supervisor_assignment_ids}
        onChange={(value) => change("supervisor_assignment_ids", value)}
        error={errors.supervisor_assignment_ids}
        disabled={disabled || !values.position_id}
        placeholder={values.position_id ? "Cari nama atasan..." : "Pilih Jabatan terlebih dahulu"}
        emptyMessage="Tidak ada calon atasan yang cocok."
        note="bisa lebih dari satu. Hanya karyawan dengan penugasan aktif di jabatan ber-level BRM lebih tinggi."
      />

      {showEndDate && (
        <div className="grid gap-4 md:grid-cols-2">
          <DateField
            id={`${idPrefix}-end-date`}
            label="TMT Selesai"
            value={values.end_date}
            onChange={(value) => change("end_date", value)}
            error={errors.end_date}
            disabled={disabled}
            placeholder="Pilih tanggal selesai"
            fromYear={2000}
            note="opsional. Kosongkan kalau belum ditentukan."
          />
        </div>
      )}
    </div>
  );
}
