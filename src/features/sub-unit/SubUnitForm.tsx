"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { TextAreaField, TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost, apiPut } from "@/lib/http-client";
import { checkAfdelingCode } from "@/lib/sub-unit-rules";
import { requireText } from "@/lib/validation";
import type { SubUnitPayload, SubUnitResource } from "@/types/api/sub-unit";

const LIST_URL = "/dashboard/organisasi/sub-unit";

interface SubUnitFormProps {
  /** Sub unit yang diubah. Kosongkan untuk menambah sub unit baru. */
  subUnit?: SubUnitResource;
}

/**
 * Form tambah / ubah sub unit.
 *
 * Alurnya:
 *   1. User mengisi Nama Sub Unit, Kode Afdeling (opsional), dan Keterangan (opsional)
 *   2. `validate` memeriksa isian wajib di browser
 *   3. Data dikirim ke /api/sub-units (tambah) atau /api/sub-units/{id} (ubah)
 *   4. Berhasil -> toast, lalu kembali ke daftar sub unit
 *      Gagal    -> pesan error tampil di isiannya (mis. nama sudah ada)
 */
export function SubUnitForm({ subUnit }: SubUnitFormProps) {
  const router = useRouter();
  const isEdit = subUnit !== undefined;

  const [values, setValues] = useState<SubUnitPayload>({
    name: subUnit?.name ?? "",
    afdeling_code: subUnit?.afdeling_code ?? "",
    description: subUnit?.description ?? "",
  });

  /** Ubah satu isian, isian lain tetap. */
  function changeValue(key: keyof SubUnitPayload, value: string) {
    setValues({ ...values, [key]: value });
  }

  const { submit, saving, errors, formError } = useFormSubmit<SubUnitPayload>({
    validate: (form) => ({
      name: requireText(form.name, "Nama Sub Unit"),
      afdeling_code: checkAfdelingCode(form.afdeling_code),
    }),
    onSubmit: async (form) => {
      if (isEdit) {
        await apiPut(`/api/sub-units/${subUnit.id}`, form);
        toast.success(`Sub unit "${form.name}" berhasil diperbarui`);
      } else {
        await apiPost("/api/sub-units", form);
        toast.success(`Sub unit "${form.name}" berhasil ditambahkan`);
      }

      router.push(LIST_URL);
    },
  });

  return (
    <FormPageLayout
      title={isEdit ? "Edit Sub Unit" : "Tambah Sub Unit"}
      description="Lengkapi nama sub unit tempat karyawan ditugaskan."
      backHref={LIST_URL}
      formError={formError}
      saving={saving}
      submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Sub Unit"}
      onSubmit={() => submit(values)}
    >
      <TextField
        id="name"
        label="Nama Sub Unit"
        required
        value={values.name}
        onChange={(value) => changeValue("name", value)}
        error={errors.name}
        disabled={saving}
        placeholder="Cth. Agrowisata Gunung Mas"
        note="tidak boleh sama dengan sub unit lain."
      />

      <TextField
        id="afdeling_code"
        label="Kode Afdeling"
        value={values.afdeling_code}
        // Langsung huruf besar supaya sama dengan yang disimpan.
        onChange={(value) => changeValue("afdeling_code", value.toUpperCase())}
        error={errors.afdeling_code}
        disabled={saving}
        placeholder="Cth. AFD03"
        note="opsional; kalau diisi, tidak boleh sama dengan sub unit lain."
      />

      <TextAreaField
        id="description"
        label="Keterangan"
        value={values.description}
        onChange={(value) => changeValue("description", value)}
        error={errors.description}
        disabled={saving}
        placeholder="Cth. Bogor"
      />
    </FormPageLayout>
  );
}
