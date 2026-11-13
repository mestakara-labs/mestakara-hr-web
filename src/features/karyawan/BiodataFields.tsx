"use client";

import { FieldLegend, FieldSet } from "@mestakara/ui/field";

import { DateField, SelectField, TextAreaField, TextField } from "@/components/shared/FormFields";
import {
  EMPLOYMENT_STATUS_OPTIONS,
  GENDER_OPTIONS,
  isNikRequired,
  MARITAL_STATUS_OPTIONS,
  RELIGION_OPTIONS,
} from "@/lib/employee-rules";

import type { FormSectionProps } from "./karyawan-form-values";

/**
 * Bagian DATA BIOGRAFI di form karyawan.
 * Pendidikan terakhir tidak diisi di sini; diambil otomatis dari tab Riwayat Pendidikan.
 *
 * NIK Karyawan wajib untuk Karyawan Tetap & PKWT, opsional untuk Casual & Daily Worker.
 */
export function BiodataFields({ values, changeValue, errors, disabled }: FormSectionProps) {
  const nikRequired = isNikRequired(values.employment_status);

  return (
    <FieldSet>
      <FieldLegend>Data Biografi</FieldLegend>
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          id="name"
          label="Nama Lengkap"
          required
          value={values.name}
          onChange={(value) => changeValue("name", value)}
          error={errors.name}
          disabled={disabled}
          placeholder="Cth. Asep Saepudin"
        />
        <SelectField
          id="employment_status"
          label="Status Karyawan"
          required
          options={EMPLOYMENT_STATUS_OPTIONS}
          value={values.employment_status}
          onChange={(value) => changeValue("employment_status", value)}
          error={errors.employment_status}
          disabled={disabled}
        />
        <TextField
          id="nik"
          label="NIK Karyawan"
          required={nikRequired}
          value={values.nik}
          onChange={(value) => changeValue("nik", value)}
          error={errors.nik}
          disabled={disabled}
          placeholder="Cth. 20230211"
          note="wajib untuk Karyawan Tetap dan PKWT, opsional untuk Karyawan Casual dan Daily Worker. Tidak boleh sama dengan karyawan lain."
        />
        <TextField
          id="registration_number"
          label="No. Registrasi"
          value={values.registration_number}
          onChange={(value) => changeValue("registration_number", value)}
          error={errors.registration_number}
          disabled={disabled}
          placeholder="Cth. 01070577040088"
          note="opsional. Tidak boleh sama dengan karyawan lain."
        />
        <DateField
          id="hire_date"
          label="Tanggal Masuk"
          required
          disableFuture
          value={values.hire_date}
          onChange={(value) => changeValue("hire_date", value)}
          error={errors.hire_date}
          disabled={disabled}
          placeholder="Pilih tanggal mulai bekerja"
          fromYear={1980}
          note="tanggal mulai bekerja (TMT masuk), dasar perhitungan masa kerja."
        />
        <TextField
          id="ktp_number"
          label="No. KTP"
          required
          inputMode="numeric"
          value={values.ktp_number}
          onChange={(value) => changeValue("ktp_number", value)}
          error={errors.ktp_number}
          disabled={disabled}
          placeholder="16 digit angka"
        />
        <SelectField
          id="gender"
          label="Jenis Kelamin"
          required
          options={GENDER_OPTIONS}
          value={values.gender}
          onChange={(value) => changeValue("gender", value)}
          error={errors.gender}
          disabled={disabled}
        />
        <TextField
          id="birth_place"
          label="Tempat Lahir"
          required
          value={values.birth_place}
          onChange={(value) => changeValue("birth_place", value)}
          error={errors.birth_place}
          disabled={disabled}
          placeholder="Cth. Bandung"
        />
        <DateField
          id="birth_date"
          label="Tanggal Lahir"
          required
          disableFuture
          value={values.birth_date}
          onChange={(value) => changeValue("birth_date", value)}
          error={errors.birth_date}
          disabled={disabled}
          placeholder="Pilih tanggal lahir"
        />
        <SelectField
          id="religion"
          label="Agama"
          required
          options={RELIGION_OPTIONS}
          value={values.religion}
          onChange={(value) => changeValue("religion", value)}
          error={errors.religion}
          disabled={disabled}
        />
        <SelectField
          id="marital_status"
          label="Status Perkawinan"
          required
          options={MARITAL_STATUS_OPTIONS}
          value={values.marital_status}
          onChange={(value) => changeValue("marital_status", value)}
          error={errors.marital_status}
          disabled={disabled}
        />
        <TextField
          id="phone"
          label="No. Telepon"
          required
          type="tel"
          value={values.phone}
          onChange={(value) => changeValue("phone", value)}
          error={errors.phone}
          disabled={disabled}
          placeholder="Cth. 0812-3456-7890"
        />
        <TextField
          id="whatsapp"
          label="No. WhatsApp"
          type="tel"
          value={values.whatsapp}
          onChange={(value) => changeValue("whatsapp", value)}
          error={errors.whatsapp}
          disabled={disabled}
          placeholder="Cth. 0812-3456-7890"
          note="kosongkan kalau tidak punya WhatsApp. Kalau nomornya sama dengan No. Telepon, tetap diisi."
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={(value) => changeValue("email", value)}
          error={errors.email}
          disabled={disabled}
          placeholder="Cth. nama@agrowisata.co.id"
        />
      </div>
      <TextAreaField
        id="address"
        label="Alamat"
        value={values.address}
        onChange={(value) => changeValue("address", value)}
        error={errors.address}
        disabled={disabled}
        placeholder="Alamat sesuai KTP"
      />
    </FieldSet>
  );
}
