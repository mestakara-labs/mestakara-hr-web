"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { SearchMultiSelectField, SelectField, TextAreaField, TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost, apiPut } from "@/lib/http-client";
import { requireAtLeastOne, requireSelection, requireText } from "@/lib/validation";
import type { PlacementCategoryResource } from "@/types/api/placement-category";
import type { PlacementObjectPayload, PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";

const LIST_URL = "/dashboard/organisasi/objek-penempatan";

interface ObjekPenempatanFormProps {
  /** Objek penempatan yang diubah. Kosongkan untuk menambah objek baru. */
  placementObject?: PlacementObjectResource;
  /** Pilihan Kategori */
  categories: PlacementCategoryResource[];
  /** Pilihan Sub Unit */
  subUnits: SubUnitResource[];
}

/**
 * Form tambah / ubah objek penempatan.
 *
 * Isiannya:
 *   - Nama Objek            -> wajib, tidak boleh sama dengan objek lain
 *   - Kategori              -> wajib, pilih satu (master Kategori Objek)
 *   - Tersedia di Sub Unit  -> wajib, minimal satu (satu objek boleh ada di beberapa sub unit)
 *   - Keterangan            -> boleh kosong
 *
 * Gagal disimpan -> pesan error tampil di isiannya (mis. sub unit yang mau dilepas
 * ternyata masih punya penugasan aktif di objek ini).
 */
export function ObjekPenempatanForm({ placementObject, categories, subUnits }: ObjekPenempatanFormProps) {
  const router = useRouter();
  const isEdit = placementObject !== undefined;

  const [values, setValues] = useState<PlacementObjectPayload>({
    name: placementObject?.name ?? "",
    category_id: placementObject?.category_id ?? "",
    sub_unit_ids: placementObject?.sub_units.map((subUnit) => subUnit.id) ?? [],
    description: placementObject?.description ?? "",
  });

  /** Ubah satu isian, isian lain tetap. */
  function changeValue<K extends keyof PlacementObjectPayload>(key: K, value: PlacementObjectPayload[K]) {
    setValues({ ...values, [key]: value });
  }

  const { submit, saving, errors, formError } = useFormSubmit<PlacementObjectPayload>({
    validate: (form) => ({
      name: requireText(form.name, "Nama Objek"),
      category_id: requireSelection(form.category_id, "Kategori"),
      sub_unit_ids: requireAtLeastOne(form.sub_unit_ids, "Sub Unit"),
    }),
    onSubmit: async (form) => {
      if (isEdit) {
        await apiPut(`/api/placement-objects/${placementObject.id}`, form);
        toast.success(`Objek "${form.name}" berhasil diperbarui`);
      } else {
        await apiPost("/api/placement-objects", form);
        toast.success(`Objek "${form.name}" berhasil ditambahkan`);
      }

      router.push(LIST_URL);
    },
  });

  return (
    <FormPageLayout
      title={isEdit ? "Edit Objek Penempatan" : "Tambah Objek Penempatan"}
      description="Lengkapi nama, kategori, dan sub unit tempat objek ini tersedia."
      backHref={LIST_URL}
      formError={formError}
      saving={saving}
      submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Objek Penempatan"}
      onSubmit={() => submit(values)}
    >
      {/* Mulai ukuran tablet, Nama dan Kategori berdampingan */}
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          id="name"
          label="Nama Objek"
          required
          value={values.name}
          onChange={(value) => changeValue("name", value)}
          error={errors.name}
          disabled={saving}
          placeholder="Cth. Tea Bridge"
          note="tidak boleh sama dengan objek lain."
        />
        <SelectField
          id="category_id"
          label="Kategori"
          required
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
          value={values.category_id}
          onChange={(value) => changeValue("category_id", value)}
          error={errors.category_id}
          disabled={saving}
        />
      </div>

      <SearchMultiSelectField
        id="sub_unit_ids"
        label="Tersedia di Sub Unit"
        required
        options={subUnits.map((subUnit) => ({ value: subUnit.id, label: subUnit.name }))}
        value={values.sub_unit_ids}
        onChange={(value) => changeValue("sub_unit_ids", value)}
        error={errors.sub_unit_ids}
        disabled={saving}
        placeholder="Cari sub unit..."
        emptyMessage="Sub unit tidak ditemukan."
        note="bisa lebih dari satu, mis. Tea Bridge ada di Gunung Mas dan di Malabar."
      />

      <TextAreaField
        id="description"
        label="Keterangan"
        value={values.description}
        onChange={(value) => changeValue("description", value)}
        error={errors.description}
        disabled={saving}
        placeholder="Cth. Jembatan gantung di atas kebun teh"
      />
    </FormPageLayout>
  );
}
