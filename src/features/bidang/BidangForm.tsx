"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldError, FieldLabel } from "@mestakara/ui/field";
import { Input } from "@mestakara/ui/input";
import { toast } from "@mestakara/ui/sonner";
import { Textarea } from "@mestakara/ui/textarea";

import { FieldNote } from "@/components/shared/FieldNote";
import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { RequiredMark } from "@/components/shared/RequiredMark";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost, apiPut } from "@/lib/http-client";
import { requireText } from "@/lib/validation";
import type { DivisionPayload, DivisionResource } from "@/types/api/division";

const LIST_URL = "/dashboard/organisasi/bidang";

interface BidangFormProps {
  /** Bidang yang diubah. Kosongkan untuk menambah bidang baru. */
  division?: DivisionResource;
}

/**
 * Form tambah / ubah bidang.
 *
 * Alurnya:
 *   1. User mengisi Kode, Nama Bidang, dan Keterangan (opsional)
 *   2. `validate` memeriksa isian wajib di browser
 *   3. Data dikirim ke /api/divisions (tambah) atau /api/divisions/{id} (ubah)
 *   4. Berhasil -> toast, lalu kembali ke daftar bidang
 *      Gagal    -> pesan error tampil di isiannya (mis. kode sudah dipakai)
 */
export function BidangForm({ division }: BidangFormProps) {
  const router = useRouter();
  const isEdit = division !== undefined;

  const [values, setValues] = useState<DivisionPayload>({
    code: division?.code ?? "",
    name: division?.name ?? "",
    description: division?.description ?? "",
  });

  /** Ubah satu isian, isian lain tetap. */
  function changeValue(key: keyof DivisionPayload, value: string) {
    setValues({ ...values, [key]: value });
  }

  const { submit, saving, errors, formError } = useFormSubmit<DivisionPayload>({
    validate: (form) => ({
      code: requireText(form.code, "Kode"),
      name: requireText(form.name, "Nama Bidang"),
    }),
    onSubmit: async (form) => {
      if (isEdit) {
        await apiPut(`/api/divisions/${division.id}`, form);
        toast.success(`Bidang "${form.name}" berhasil diperbarui`);
      } else {
        await apiPost("/api/divisions", form);
        toast.success(`Bidang "${form.name}" berhasil ditambahkan`);
      }

      router.push(LIST_URL);
    },
  });

  return (
    <FormPageLayout
      title={isEdit ? "Edit Bidang" : "Tambah Bidang"}
      description="Lengkapi kode dan nama bidang."
      backHref={LIST_URL}
      formError={formError}
      saving={saving}
      submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Bidang"}
      onSubmit={() => submit(values)}
    >
      {/* Mulai ukuran tablet, Kode dan Nama Bidang berdampingan */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Kode */}
        <Field data-invalid={Boolean(errors.code)}>
          <FieldLabel htmlFor="code">
            Kode <RequiredMark />
          </FieldLabel>
          <Input
            id="code"
            value={values.code}
            onChange={(event) => changeValue("code", event.target.value)}
            aria-invalid={Boolean(errors.code)}
            disabled={saving}
            placeholder="Cth. OPS"
          />
          <FieldNote>Kode singkat, tidak boleh sama dengan bidang lain.</FieldNote>
          <FieldError>{errors.code}</FieldError>
        </Field>

        {/* Nama bidang */}
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="name">
            Nama Bidang <RequiredMark />
          </FieldLabel>
          <Input
            id="name"
            value={values.name}
            onChange={(event) => changeValue("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            disabled={saving}
            placeholder="Cth. Operasional"
          />
          <FieldError>{errors.name}</FieldError>
        </Field>
      </div>

      {/* Keterangan */}
      <Field data-invalid={Boolean(errors.description)}>
        <FieldLabel htmlFor="description">Keterangan</FieldLabel>
        <Textarea
          id="description"
          value={values.description}
          onChange={(event) => changeValue("description", event.target.value)}
          aria-invalid={Boolean(errors.description)}
          disabled={saving}
          placeholder="Cth. Lampiran IX.6 dan IX.7"
          rows={3}
        />
        <FieldError>{errors.description}</FieldError>
      </Field>
    </FormPageLayout>
  );
}
