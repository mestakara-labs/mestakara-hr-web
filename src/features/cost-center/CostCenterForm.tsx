"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { TextAreaField, TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost, apiPut } from "@/lib/http-client";
import { requireText } from "@/lib/validation";
import type { CostCenterPayload, CostCenterResource } from "@/types/api/cost-center";

const LIST_URL = "/dashboard/upah/cost-center";

interface CostCenterFormProps {
  /** Cost center yang diubah. Kosongkan untuk menambah cost center baru. */
  costCenter?: CostCenterResource;
}

/**
 * Form tambah / ubah cost center.
 *
 * Alurnya:
 *   1. User mengisi Kode (SAP), Uraian, dan Keterangan (opsional)
 *   2. `validate` memeriksa isian wajib di browser
 *   3. Data dikirim ke /api/cost-centers (tambah) atau /api/cost-centers/{id} (ubah)
 *   4. Berhasil -> toast, lalu kembali ke daftar cost center
 *      Gagal    -> pesan error tampil di isiannya (mis. kode sudah dipakai)
 */
export function CostCenterForm({ costCenter }: CostCenterFormProps) {
  const router = useRouter();
  const isEdit = costCenter !== undefined;

  const [values, setValues] = useState<CostCenterPayload>({
    code: costCenter?.code ?? "",
    name: costCenter?.name ?? "",
    description: costCenter?.description ?? "",
  });

  const { submit, clearError, saving, errors, formError } = useFormSubmit<CostCenterPayload>({
    validate: (form) => ({
      code: requireText(form.code, "Kode"),
      name: requireText(form.name, "Uraian"),
    }),
    onSubmit: async (form) => {
      // Kode SAP selalu huruf besar, mis. "4A44AGR007".
      const payload = { ...form, code: form.code.trim().toUpperCase() };

      if (isEdit) {
        await apiPut(`/api/cost-centers/${costCenter.id}`, payload);
        toast.success(`Cost center "${payload.code}" berhasil diperbarui`);
      } else {
        await apiPost("/api/cost-centers", payload);
        toast.success(`Cost center "${payload.code}" berhasil ditambahkan`);
      }

      router.push(LIST_URL);
    },
  });

  /** Ubah satu isian, sekaligus hapus pesan error isian itu. */
  function changeValue(key: keyof CostCenterPayload, value: string) {
    setValues({ ...values, [key]: value });
    clearError(key);
  }

  return (
    <FormPageLayout
      title={isEdit ? "Edit Cost Center" : "Tambah Cost Center"}
      description="Cost center SAP yang dipakai di biodata karyawan dan Daftar Upah."
      backHref={LIST_URL}
      formError={formError}
      saving={saving}
      submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Cost Center"}
      onSubmit={() => submit(values)}
    >
      {/* Mulai ukuran tablet, Kode dan Uraian berdampingan */}
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          id="code"
          label="Kode"
          required
          value={values.code}
          onChange={(value) => changeValue("code", value.toUpperCase())}
          error={errors.code}
          disabled={saving}
          placeholder="Cth. 4A44AGR007"
          note="kode cost center SAP, tidak boleh sama dengan cost center lain."
        />
        <TextField
          id="name"
          label="Uraian"
          required
          value={values.name}
          onChange={(value) => changeValue("name", value)}
          error={errors.name}
          disabled={saving}
          placeholder="Cth. Tiket & Parkir"
        />
      </div>

      <TextAreaField
        id="description"
        label="Keterangan"
        value={values.description}
        onChange={(value) => changeValue("description", value)}
        error={errors.description}
        disabled={saving}
        placeholder="Cth. Biaya SDM area tiket dan parkir Gunung Mas"
        note="opsional."
      />
    </FormPageLayout>
  );
}
