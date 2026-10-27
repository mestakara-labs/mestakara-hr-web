"use client";

import { useState } from "react";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { TextField } from "@/components/shared/FormFields";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { formatDateTime } from "@/lib/date";
import { apiPut } from "@/lib/http-client";
import { requireText } from "@/lib/validation";
import type { GeneralSignaturePayload, GeneralSignatureSetting } from "@/types/api/signature";

import { checkSections, newSection, toSectionsForm, toSectionsPayload, type SectionForm } from "./signature-form-values";
import { SignatureBlock } from "./SignatureBlock";
import { SignatureSectionsEditor } from "./SignatureSectionsEditor";
import { useSignerEmployees } from "./useSignerEmployees";

/** Halaman PENANDA TANGAN UMUM: ambil dulu pengaturannya, lalu tampilkan form yang sudah terisi. */
export function PenandaTanganUmumPage() {
  const { data: setting, loading, error, reload } = useApiGet<GeneralSignatureSetting>("/api/signature-settings/general");

  if (loading) return <PageLoading label="Memuat penanda tangan..." />;
  if (error || !setting) return <PageError message={error ?? "Penanda tangan gagal dimuat."} />;

  // `key`: setelah disimpan & dimuat ulang, form diisi ulang dari data server yang baru.
  return <UmumForm key={setting.updated_at ?? "bawaan"} setting={setting} onSaved={reload} />;
}

interface UmumFormValues {
  place: string;
  payroll: SectionForm[];
  spkl: SectionForm[];
}

/** Susunan dari server; kalau masih kosong, mulai dengan satu bagian kosong. */
function startSections(sections: GeneralSignatureSetting["payroll_sections"]): SectionForm[] {
  return sections.length > 0 ? toSectionsForm(sections) : [newSection()];
}

/**
 * Form PENANDA TANGAN UMUM:
 *
 *   Tempat Penandatanganan [Gunung Mas]
 *   Penanda Tangan Daftar Upah   (editor bagian & orang)
 *   Penanda Tangan SPKL          (editor bagian & orang)
 *                                              [Batal] [Simpan Penanda Tangan]
 *
 * Dipakai untuk sheet REKAP, "Tanpa Kelompok" / "Tanpa Bidang", dan setiap kelompok / bidang
 * yang belum mengatur penanda tangannya sendiri.
 */
function UmumForm({ setting, onSaved }: { setting: GeneralSignatureSetting; onSaved: () => void }) {
  const employees = useSignerEmployees();
  const [values, setValues] = useState<UmumFormValues>(() => ({
    place: setting.place,
    payroll: startSections(setting.payroll_sections),
    spkl: startSections(setting.spkl_sections),
  }));

  const { submit, clearError, saving, errors, formError } = useFormSubmit<UmumFormValues>({
    validate: (form) => ({
      place: requireText(form.place, "Tempat Penandatanganan"),
      payroll: checkSections(form.payroll),
      spkl: checkSections(form.spkl),
    }),
    onSubmit: async (form) => {
      const payload: GeneralSignaturePayload = {
        place: form.place.trim(),
        payroll_sections: toSectionsPayload(form.payroll),
        spkl_sections: toSectionsPayload(form.spkl),
      };
      await apiPut("/api/signature-settings/general", payload);
      toast.success("Penanda tangan umum berhasil disimpan");
      onSaved();
    },
  });

  /** Ubah satu isian, sekaligus hapus pesan error isian itu. */
  function changeValue<K extends keyof UmumFormValues>(key: K, value: UmumFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  const lastUpdated = setting.updated_at
    ? ` Terakhir diubah ${formatDateTime(setting.updated_at)}${setting.updated_by ? ` oleh ${setting.updated_by}` : ""}.`
    : "";

  return (
    <FormPageLayout
      title="Penanda Tangan Umum"
      description={`Dipakai untuk sheet REKAP, karyawan tanpa kelompok / bidang, dan kelompok / bidang yang belum diatur sendiri.${lastUpdated}`}
      backHref="/dashboard"
      formError={formError}
      saving={saving}
      submitLabel="Simpan Penanda Tangan"
      onSubmit={() => submit(values)}
    >
      <div className="max-w-sm">
        <TextField
          id="place"
          label="Tempat Penandatanganan"
          required
          value={values.place}
          onChange={(value) => changeValue("place", value)}
          error={errors.place}
          disabled={saving}
          note={'ditulis sebelum tanggal, mis. "Gunung Mas, 31 Oktober 2026".'}
        />
      </div>

      <SignatureBlock title="Penanda Tangan Daftar Upah">
        <SignatureSectionsEditor
          idPrefix="payroll"
          sections={values.payroll}
          onChange={(sections) => changeValue("payroll", sections)}
          error={errors.payroll}
          disabled={saving}
          employeeOptions={employees.options}
          positionOf={employees.positionOf}
        />
      </SignatureBlock>

      <SignatureBlock title="Penanda Tangan SPKL (Reguler & DW)">
        <SignatureSectionsEditor
          idPrefix="spkl"
          sections={values.spkl}
          onChange={(sections) => changeValue("spkl", sections)}
          error={errors.spkl}
          disabled={saving}
          employeeOptions={employees.options}
          positionOf={employees.positionOf}
        />
      </SignatureBlock>
    </FormPageLayout>
  );
}
