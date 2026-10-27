"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { TextAreaField, TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost, apiPut } from "@/lib/http-client";
import { requireText } from "@/lib/validation";
import type { PayrollGroupPayload, PayrollGroupResource } from "@/types/api/payroll-group";

const LIST_URL = "/dashboard/upah/kelompok";

/** Isian form dalam bentuk teks (Urutan diubah ke angka saat dikirim). */
interface KelompokUpahFormValues {
  name: string;
  sort_order: string;
  description: string;
}

interface KelompokUpahFormProps {
  /** Kelompok yang diubah. Kosongkan untuk menambah kelompok baru. */
  group?: PayrollGroupResource;
}

/**
 * Form tambah / ubah KELOMPOK DAFTAR UPAH (pengelompokan "legacy" seperti file Excel Daftar Upah lama).
 *
 * Alurnya:
 *   1. User mengisi Nama, Urutan (opsional), dan Keterangan (opsional)
 *   2. Data dikirim ke /api/payroll-groups (tambah) atau /api/payroll-groups/{id} (ubah)
 *   3. Berhasil -> toast, lalu kembali ke daftar kelompok
 */
export function KelompokUpahForm({ group }: KelompokUpahFormProps) {
  const router = useRouter();
  const isEdit = group !== undefined;

  const [values, setValues] = useState<KelompokUpahFormValues>({
    name: group?.name ?? "",
    sort_order: group ? String(group.sort_order) : "",
    description: group?.description ?? "",
  });

  const { submit, clearError, saving, errors, formError } = useFormSubmit<KelompokUpahFormValues>({
    validate: (form) => ({
      name: requireText(form.name, "Nama Kelompok"),
      sort_order: form.sort_order === "" || /^\d+$/.test(form.sort_order) ? undefined : "Urutan harus angka",
    }),
    onSubmit: async (form) => {
      // Urutan kosong = 0 (tampil paling atas, lalu diurutkan menurut nama).
      const payload: PayrollGroupPayload = { ...form, sort_order: Number(form.sort_order || 0) };

      if (isEdit) {
        await apiPut(`/api/payroll-groups/${group.id}`, payload);
        toast.success(`Kelompok "${form.name}" berhasil diperbarui`);
      } else {
        await apiPost("/api/payroll-groups", payload);
        toast.success(`Kelompok "${form.name}" berhasil ditambahkan`);
      }

      router.push(LIST_URL);
    },
  });

  /** Ubah satu isian, sekaligus hapus pesan error isian itu. */
  function changeValue(key: keyof KelompokUpahFormValues, value: string) {
    setValues({ ...values, [key]: value });
    clearError(key);
  }

  return (
    <FormPageLayout
      title={isEdit ? "Edit Kelompok Daftar Upah" : "Tambah Kelompok Daftar Upah"}
      description="Kelompok untuk menyusun Daftar Upah dengan pengelompokan Legacy (seperti file Excel lama)."
      backHref={LIST_URL}
      formError={formError}
      saving={saving}
      submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Kelompok"}
      onSubmit={() => submit(values)}
    >
      <div className="grid gap-5 md:grid-cols-[1fr_12rem]">
        <TextField
          id="name"
          label="Nama Kelompok"
          required
          value={values.name}
          onChange={(value) => changeValue("name", value)}
          error={errors.name}
          disabled={saving}
          placeholder="Cth. F&B Gunung Mas"
        />
        <TextField
          id="sort_order"
          label="Urutan"
          inputMode="numeric"
          value={values.sort_order}
          onChange={(value) => changeValue("sort_order", value)}
          error={errors.sort_order}
          disabled={saving}
          placeholder="Cth. 1"
          note="urutan di Daftar Upah, kecil = lebih dulu."
        />
      </div>

      <TextAreaField
        id="description"
        label="Keterangan"
        value={values.description}
        onChange={(value) => changeValue("description", value)}
        error={errors.description}
        disabled={saving}
        placeholder="Cth. Karyawan Tea Corner, Tea Cafe, dan Hi Tea"
        note="opsional."
      />
    </FormPageLayout>
  );
}
