"use client";

import { useState } from "react";

import { FormDialog } from "@/components/shared/FormDialog";
import { DateField, SelectField, TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { DEPENDENT_STATUS_OPTIONS, GENDER_OPTIONS, RELATIONSHIP_OPTIONS } from "@/lib/employee-rules";
import { mustBeDigits, requireSelection, requireText } from "@/lib/validation";

import type { FamilyFormItem } from "./karyawan-form-values";

/** Jenis kelamin yang otomatis terisi saat hubungan dipilih. */
const GENDER_BY_RELATIONSHIP: Record<string, string> = { Suami: "Laki-laki", Istri: "Perempuan" };

interface FamilyMemberDialogProps {
  /** Anggota yang diubah, atau anggota kosong untuk tambah baru */
  member: FamilyFormItem;
  isNew: boolean;
  onSave: (member: FamilyFormItem) => void;
  onClose: () => void;
}

/**
 * Dialog tambah / ubah SATU anggota batih (suami/istri atau anak).
 * Data baru benar-benar tersimpan saat tombol "Simpan Karyawan" di form utama ditekan.
 */
export function FamilyMemberDialog({ member, isNew, onSave, onClose }: FamilyMemberDialogProps) {
  const [values, setValues] = useState<FamilyFormItem>(member);

  function changeValue(key: keyof FamilyFormItem, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  /** Memilih Suami / Istri sekaligus mengisi jenis kelaminnya. */
  function changeRelationship(relationship: string) {
    setValues((previous) => ({
      ...previous,
      relationship,
      gender: GENDER_BY_RELATIONSHIP[relationship] ?? previous.gender,
    }));
  }

  const { submit, errors } = useFormSubmit<FamilyFormItem>({
    validate: (form) => ({
      relationship: requireSelection(form.relationship, "Hubungan"),
      name: requireText(form.name, "Nama Lengkap"),
      ktp_number: mustBeDigits(form.ktp_number, "No. KTP", 16),
      gender: requireSelection(form.gender, "Jenis Kelamin"),
      birth_date: requireSelection(form.birth_date, "Tanggal Lahir"),
      dependent_status: requireSelection(form.dependent_status, "Status Tanggungan"),
    }),
    onSubmit: async (form) => onSave(form),
  });

  return (
    <FormDialog
      open
      title={isNew ? "Tambah Anggota Batih" : "Ubah Anggota Batih"}
      description="Data suami / istri atau anak karyawan."
      saveLabel={isNew ? "Tambah" : "Simpan Perubahan"}
      onSave={() => submit(values)}
      onClose={onClose}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          id="family_relationship"
          label="Hubungan"
          required
          options={RELATIONSHIP_OPTIONS}
          value={values.relationship}
          onChange={changeRelationship}
          error={errors.relationship}
        />
        <TextField
          id="family_name"
          label="Nama Lengkap"
          required
          value={values.name}
          onChange={(value) => changeValue("name", value)}
          error={errors.name}
        />
        <TextField
          id="family_ktp_number"
          label="No. KTP"
          inputMode="numeric"
          value={values.ktp_number}
          onChange={(value) => changeValue("ktp_number", value)}
          error={errors.ktp_number}
          placeholder="16 digit angka"
        />
        <SelectField
          id="family_gender"
          label="Jenis Kelamin"
          required
          options={GENDER_OPTIONS}
          value={values.gender}
          onChange={(value) => changeValue("gender", value)}
          error={errors.gender}
        />
        <TextField
          id="family_birth_place"
          label="Tempat Lahir"
          value={values.birth_place}
          onChange={(value) => changeValue("birth_place", value)}
          placeholder="Cth. Bandung"
        />
        <DateField
          id="family_birth_date"
          label="Tanggal Lahir"
          required
          disableFuture
          value={values.birth_date}
          onChange={(value) => changeValue("birth_date", value)}
          error={errors.birth_date}
          placeholder="Pilih tanggal lahir"
        />
        <TextField
          id="family_occupation"
          label="Pekerjaan"
          value={values.occupation}
          onChange={(value) => changeValue("occupation", value)}
          placeholder="Cth. Wiraswasta"
        />
        <SelectField
          id="family_dependent_status"
          label="Status Tanggungan"
          required
          options={DEPENDENT_STATUS_OPTIONS}
          value={values.dependent_status}
          onChange={(value) => changeValue("dependent_status", value)}
          error={errors.dependent_status}
        />
      </div>
    </FormDialog>
  );
}
