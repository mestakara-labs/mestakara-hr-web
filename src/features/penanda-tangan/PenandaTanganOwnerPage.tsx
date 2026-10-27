"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@mestakara/ui/checkbox";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { TextField } from "@/components/shared/FormFields";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { formatDateTime } from "@/lib/date";
import { apiPut } from "@/lib/http-client";
import { SIGNATURE_OWNERS, type SignatureOwnerKind } from "@/lib/signature-rules";
import type { OwnerSignaturePayload, OwnerSignatureSetting } from "@/types/api/signature";

import { checkSections, newSection, toSectionsForm, toSectionsPayload, type SectionForm } from "./signature-form-values";
import { SignatureBlock } from "./SignatureBlock";
import { SignatureSectionsEditor } from "./SignatureSectionsEditor";
import { useSignerEmployees } from "./useSignerEmployees";

interface OwnerPageProps {
  kind: SignatureOwnerKind;
  /** Id kelompok / bidang */
  id: string;
}

/** Halaman ATUR PENANDA TANGAN satu kelompok / bidang: ambil dulu datanya, lalu tampilkan form yang sudah terisi. */
export function PenandaTanganOwnerPage({ kind, id }: OwnerPageProps) {
  const { data: setting, loading, error } = useApiGet<OwnerSignatureSetting>(`${SIGNATURE_OWNERS[kind].apiPath}/${id}`);

  if (loading) return <PageLoading label="Memuat penanda tangan..." />;
  if (error || !setting) return <PageError message={error ?? "Data tidak ditemukan."} />;

  return <OwnerForm kind={kind} setting={setting} />;
}

/** Satu susunan di form: pakai Umum, atau susunan sendiri. */
interface DocumentForm {
  useGeneral: boolean;
  sections: SectionForm[];
}

interface OwnerFormValues {
  place: string;
  payroll: DocumentForm;
  spkl: DocumentForm;
}

/** Susunan dari server -> isian. null = pakai Umum (editor disiapkan satu bagian kosong kalau nanti diaktifkan). */
function toDocumentForm(sections: OwnerSignatureSetting["payroll_sections"]): DocumentForm {
  return sections ? { useGeneral: false, sections: toSectionsForm(sections) } : { useGeneral: true, sections: [newSection()] };
}

/**
 * Form PENANDA TANGAN satu Kelompok Daftar Upah / Bidang:
 *
 *   Tempat Penandatanganan [Malabar]   (kosong = memakai tempat Umum)
 *   Penanda Tangan Daftar Upah   [☑ Pakai penanda tangan Umum]   -> kalau tidak dicentang: editor bagian & orang
 *   Penanda Tangan SPKL          [☐ Pakai penanda tangan Umum]
 *                                                     [Batal] [Simpan Penanda Tangan]
 */
function OwnerForm({ kind, setting }: { kind: SignatureOwnerKind; setting: OwnerSignatureSetting }) {
  const router = useRouter();
  const owner = SIGNATURE_OWNERS[kind];
  const employees = useSignerEmployees();

  const [values, setValues] = useState<OwnerFormValues>(() => ({
    place: setting.place ?? "",
    payroll: toDocumentForm(setting.payroll_sections),
    spkl: toDocumentForm(setting.spkl_sections),
  }));

  const { submit, clearError, saving, errors, formError } = useFormSubmit<OwnerFormValues>({
    validate: (form) => ({
      payroll: form.payroll.useGeneral ? undefined : checkSections(form.payroll.sections),
      spkl: form.spkl.useGeneral ? undefined : checkSections(form.spkl.sections),
    }),
    onSubmit: async (form) => {
      const payload: OwnerSignaturePayload = {
        place: form.place.trim() || null,
        payroll_sections: form.payroll.useGeneral ? null : toSectionsPayload(form.payroll.sections),
        spkl_sections: form.spkl.useGeneral ? null : toSectionsPayload(form.spkl.sections),
      };
      await apiPut(`${owner.apiPath}/${setting.id}`, payload);
      toast.success(`Penanda tangan ${setting.name} berhasil disimpan`);
      router.push(owner.pagePath);
    },
  });

  /** Ubah satu susunan (sebagian), sekaligus hapus pesan error-nya. */
  function changeDocument(key: "payroll" | "spkl", patch: Partial<DocumentForm>) {
    setValues((previous) => ({ ...previous, [key]: { ...previous[key], ...patch } }));
    clearError(key);
  }

  const lastUpdated = setting.updated_at
    ? ` Terakhir diubah ${formatDateTime(setting.updated_at)}${setting.updated_by ? ` oleh ${setting.updated_by}` : ""}.`
    : "";

  /** Satu blok susunan (Daftar Upah / SPKL) dengan pilihan "Pakai penanda tangan Umum". */
  function documentBlock(key: "payroll" | "spkl", title: string) {
    const document = values[key];

    return (
      <SignatureBlock
        title={title}
        description={document.useGeneral ? "Memakai susunan di Penanda Tangan Umum." : undefined}
        action={
          <label className="flex cursor-pointer items-center gap-2 typo-body-m">
            <Checkbox
              checked={document.useGeneral}
              onCheckedChange={(checked) => changeDocument(key, { useGeneral: checked === true })}
              disabled={saving}
            />
            Pakai penanda tangan Umum
          </label>
        }
      >
        {!document.useGeneral && (
          <SignatureSectionsEditor
            idPrefix={key}
            sections={document.sections}
            onChange={(sections) => changeDocument(key, { sections })}
            error={errors[key]}
            disabled={saving}
            employeeOptions={employees.options}
            positionOf={employees.positionOf}
          />
        )}
      </SignatureBlock>
    );
  }

  return (
    <FormPageLayout
      title={`Penanda Tangan — ${setting.name}`}
      description={`${owner.title}. Susunan yang tidak diatur memakai penanda tangan Umum.${lastUpdated}`}
      backHref={owner.pagePath}
      formError={formError}
      saving={saving}
      submitLabel="Simpan Penanda Tangan"
      onSubmit={() => submit(values)}
    >
      <div className="max-w-sm">
        <TextField
          id="place"
          label="Tempat Penandatanganan"
          value={values.place}
          onChange={(value) => setValues((previous) => ({ ...previous, place: value }))}
          disabled={saving}
          placeholder="Kosong = memakai tempat Umum"
          note="ditulis sebelum tanggal di dokumen kelompok / bidang ini."
        />
      </div>

      {documentBlock("payroll", "Penanda Tangan Daftar Upah")}
      {documentBlock("spkl", "Penanda Tangan SPKL (Reguler & DW)")}
    </FormPageLayout>
  );
}
