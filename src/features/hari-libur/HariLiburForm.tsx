"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { HOLIDAY_TYPE_OPTIONS } from "@/lib/holiday-rules";
import { apiPost, apiPut } from "@/lib/http-client";
import { requireSelection, requireText } from "@/lib/validation";
import type { HolidayPayload, HolidayResource } from "@/types/api/holiday";

const LIST_URL = "/dashboard/jadwal/hari-libur";

/**
 * Form tambah / ubah HARI LIBUR:
 *
 *   Tanggal [📅]          Jenis [Libur Nasional ▾]
 *   Nama Hari Libur [Hari Kemerdekaan RI]
 *   Keterangan
 */
export function HariLiburForm({ holiday }: { holiday?: HolidayResource }) {
  const router = useRouter();
  const isEdit = holiday !== undefined;

  const [values, setValues] = useState<HolidayPayload>({
    date: holiday?.date ?? "",
    name: holiday?.name ?? "",
    type: holiday?.type ?? "",
    description: holiday?.description ?? "",
  });

  const { submit, saving, errors, formError, clearError } = useFormSubmit<HolidayPayload>({
    validate: (form) => ({
      date: requireSelection(form.date, "Tanggal"),
      name: requireText(form.name, "Nama Hari Libur"),
      type: requireSelection(form.type, "Jenis"),
    }),
    onSubmit: async (form) => {
      if (isEdit) {
        await apiPut(`/api/holidays/${holiday.id}`, form);
        toast.success(`Hari libur "${form.name}" berhasil diperbarui`);
      } else {
        await apiPost("/api/holidays", form);
        toast.success(`Hari libur "${form.name}" berhasil ditambahkan`);
      }
      router.push(LIST_URL);
    },
  });

  /** Ubah satu isian; pesan error isian itu dihapus. */
  function change(key: keyof HolidayPayload, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  return (
    <FormPageLayout
      title={isEdit ? "Edit Hari Libur" : "Tambah Hari Libur"}
      description="Hari libur hanya menjadi penanda di kalender jadwal; karyawan tidak otomatis diliburkan."
      backHref={LIST_URL}
      formError={formError}
      saving={saving}
      submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Hari Libur"}
      onSubmit={() => submit(values)}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <DateField
          id="date"
          label="Tanggal"
          required
          value={values.date}
          onChange={(value) => change("date", value)}
          error={errors.date}
          disabled={saving}
          placeholder="Pilih tanggal"
          fromYear={2020}
          note="satu tanggal hanya boleh satu hari libur."
        />
        <SelectField
          id="type"
          label="Jenis"
          required
          options={HOLIDAY_TYPE_OPTIONS}
          value={values.type}
          onChange={(value) => change("type", value)}
          error={errors.type}
          disabled={saving}
        />
      </div>
      <TextField
        id="name"
        label="Nama Hari Libur"
        required
        value={values.name}
        onChange={(value) => change("name", value)}
        error={errors.name}
        disabled={saving}
        placeholder="Cth. Hari Kemerdekaan RI"
      />
      <TextAreaField
        id="description"
        label="Keterangan"
        value={values.description}
        onChange={(value) => change("description", value)}
        disabled={saving}
        placeholder="Cth. Sesuai SKB 3 Menteri"
      />
    </FormPageLayout>
  );
}
