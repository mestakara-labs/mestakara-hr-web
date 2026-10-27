"use client";

import { useState } from "react";
import { Field, FieldError, FieldLabel } from "@mestakara/ui/field";

import { FileUploadField } from "@/components/shared/FileUploadField";
import { FormDialog } from "@/components/shared/FormDialog";
import { SelectField, TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { EDUCATION_OPTIONS } from "@/lib/employee-rules";
import { CERTIFICATE_RULE } from "@/lib/file-rules";
import { requireSelection, requireText } from "@/lib/validation";

import type { EducationFormItem } from "./karyawan-form-values";

interface EducationDialogProps {
  /** Riwayat yang diubah, atau riwayat kosong untuk tambah baru */
  education: EducationFormItem;
  isNew: boolean;
  onSave: (education: EducationFormItem) => void;
  onClose: () => void;
}

/** Tahun 4 digit, mis. "2015". Kosong dianggap lolos (isian wajib dicek terpisah). */
function mustBeYear(value: string, label: string): string | undefined {
  if (!value.trim()) return undefined;
  return /^\d{4}$/.test(value.trim()) ? undefined : `${label} harus 4 digit tahun, mis. 2015`;
}

/**
 * Dialog tambah / ubah SATU riwayat pendidikan.
 * Hanya Jenjang dan Tahun Lulus yang wajib; isian lain opsional.
 * Data baru benar-benar tersimpan saat tombol "Simpan Karyawan" di form utama ditekan.
 */
export function EducationDialog({ education, isNew, onSave, onClose }: EducationDialogProps) {
  const [values, setValues] = useState<EducationFormItem>(education);

  function changeValue<K extends keyof EducationFormItem>(key: K, value: EducationFormItem[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  const { submit, errors } = useFormSubmit<EducationFormItem>({
    validate: (form) => ({
      level: requireSelection(form.level, "Jenjang"),
      graduation_year:
        requireText(form.graduation_year, "Tahun Lulus") ?? mustBeYear(form.graduation_year, "Tahun Lulus"),
      start_year:
        mustBeYear(form.start_year, "Tahun Masuk") ??
        (form.start_year && form.graduation_year && form.start_year > form.graduation_year
          ? "Tahun Masuk tidak boleh setelah Tahun Lulus"
          : undefined),
    }),
    onSubmit: async (form) => onSave(form),
  });

  return (
    <FormDialog
      open
      title={isNew ? "Tambah Pendidikan" : "Ubah Pendidikan"}
      description="Hanya Jenjang dan Tahun Lulus yang wajib diisi."
      saveLabel={isNew ? "Tambah" : "Simpan Perubahan"}
      onSave={() => submit(values)}
      onClose={onClose}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          id="education_level"
          label="Jenjang"
          required
          options={EDUCATION_OPTIONS}
          value={values.level}
          onChange={(value) => changeValue("level", value)}
          error={errors.level}
        />
        <TextField
          id="education_institution"
          label="Nama Institusi"
          value={values.institution}
          onChange={(value) => changeValue("institution", value)}
          placeholder="Cth. Universitas Padjadjaran"
        />
        <TextField
          id="education_major"
          label="Jurusan / Program Studi"
          value={values.major}
          onChange={(value) => changeValue("major", value)}
          placeholder="Cth. Akuntansi"
        />
        <TextField
          id="education_city"
          label="Kota"
          value={values.city}
          onChange={(value) => changeValue("city", value)}
          placeholder="Cth. Bandung"
        />
        <TextField
          id="education_start_year"
          label="Tahun Masuk"
          inputMode="numeric"
          value={values.start_year}
          onChange={(value) => changeValue("start_year", value)}
          error={errors.start_year}
          placeholder="Cth. 2011"
        />
        <TextField
          id="education_graduation_year"
          label="Tahun Lulus"
          required
          inputMode="numeric"
          value={values.graduation_year}
          onChange={(value) => changeValue("graduation_year", value)}
          error={errors.graduation_year}
          placeholder="Cth. 2015"
        />
        <TextField
          id="education_gpa"
          label="IPK / Nilai"
          value={values.gpa}
          onChange={(value) => changeValue("gpa", value)}
          placeholder="Cth. 3,45 atau 87,5"
        />
        <TextField
          id="education_certificate_number"
          label="No. Ijazah"
          value={values.certificate_number}
          onChange={(value) => changeValue("certificate_number", value)}
        />
        <TextField
          id="education_title_front"
          label="Gelar Depan"
          value={values.title_front}
          onChange={(value) => changeValue("title_front", value)}
          placeholder="Cth. Ir."
        />
        <TextField
          id="education_title_back"
          label="Gelar Belakang"
          value={values.title_back}
          onChange={(value) => changeValue("title_back", value)}
          placeholder="Cth. S.E."
        />
      </div>

      <Field>
        <FieldLabel htmlFor="education_certificate_file">File Ijazah</FieldLabel>
        <FileUploadField
          id="education_certificate_file"
          rule={CERTIFICATE_RULE}
          file={values.certificate_file}
          onChange={(file) => changeValue("certificate_file", file)}
        />
        <FieldError>{errors.certificate_file}</FieldError>
      </Field>
    </FormDialog>
  );
}
