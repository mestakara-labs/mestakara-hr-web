"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { TextAreaField, TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost, apiPut } from "@/lib/http-client";
import { requireText } from "@/lib/validation";
import type { PlacementCategoryPayload, PlacementCategoryResource } from "@/types/api/placement-category";

const LIST_URL = "/dashboard/organisasi/kategori-objek";

interface KategoriObjekFormProps {
  /** Kategori yang diubah. Kosongkan untuk menambah kategori baru. */
  category?: PlacementCategoryResource;
}

/**
 * Form tambah / ubah kategori objek.
 *
 * Alurnya:
 *   1. User mengisi Nama Kategori dan Keterangan (opsional)
 *   2. `validate` memeriksa isian wajib di browser
 *   3. Data dikirim ke /api/placement-categories (tambah) atau /api/placement-categories/{id} (ubah)
 *   4. Berhasil -> toast, lalu kembali ke daftar kategori objek
 *      Gagal    -> pesan error tampil di isiannya (mis. nama sudah ada)
 */
export function KategoriObjekForm({ category }: KategoriObjekFormProps) {
  const router = useRouter();
  const isEdit = category !== undefined;

  const [values, setValues] = useState<PlacementCategoryPayload>({
    name: category?.name ?? "",
    description: category?.description ?? "",
  });

  /** Ubah satu isian, isian lain tetap. */
  function changeValue(key: keyof PlacementCategoryPayload, value: string) {
    setValues({ ...values, [key]: value });
  }

  const { submit, saving, errors, formError } = useFormSubmit<PlacementCategoryPayload>({
    validate: (form) => ({
      name: requireText(form.name, "Nama Kategori"),
    }),
    onSubmit: async (form) => {
      if (isEdit) {
        await apiPut(`/api/placement-categories/${category.id}`, form);
        toast.success(`Kategori "${form.name}" berhasil diperbarui`);
      } else {
        await apiPost("/api/placement-categories", form);
        toast.success(`Kategori "${form.name}" berhasil ditambahkan`);
      }

      router.push(LIST_URL);
    },
  });

  return (
    <FormPageLayout
      title={isEdit ? "Edit Kategori Objek" : "Tambah Kategori Objek"}
      description="Lengkapi nama kategori objek penempatan, mis. Penginapan atau Wahana."
      backHref={LIST_URL}
      formError={formError}
      saving={saving}
      submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Kategori Objek"}
      onSubmit={() => submit(values)}
    >
      <TextField
        id="name"
        label="Nama Kategori"
        required
        value={values.name}
        onChange={(value) => changeValue("name", value)}
        error={errors.name}
        disabled={saving}
        placeholder="Cth. Penginapan"
        note="tidak boleh sama dengan kategori lain."
      />

      <TextAreaField
        id="description"
        label="Keterangan"
        value={values.description}
        onChange={(value) => changeValue("description", value)}
        error={errors.description}
        disabled={saving}
        placeholder="Cth. Glamping, bungalow, pondokan"
      />
    </FormPageLayout>
  );
}
