"use client";

import { Field, FieldError, FieldLabel } from "@mestakara/ui/field";

import { FileUploadField } from "@/components/shared/FileUploadField";
import { DateField, SelectField, TextField } from "@/components/shared/FormFields";
import { RequiredMark } from "@/components/shared/RequiredMark";
import type { SearchOption } from "@/components/shared/SearchSelect";
import { SignerFields } from "@/components/shared/SignerFields";
import { hasDocument, SK_DOCUMENT_TYPE, STATUS_DOCUMENT_TYPES, type StatusDocumentValues } from "@/lib/activation-rules";
import { DOCUMENT_RULE } from "@/lib/file-rules";
import type { SignerValues } from "@/lib/signer-rules";
import type { UploadedFileInfo } from "@/types/api/employee";

/** Isian satu dokumen di form: teks + file (File = baru, UploadedFileInfo = lama, null = belum ada). */
export interface StatusDocumentFormValues extends StatusDocumentValues {
  document_file: File | UploadedFileInfo | null;
}

export const EMPTY_DOCUMENT_FORM: StatusDocumentFormValues = {
  document_type: "",
  document_number: "",
  document_date: "",
  signer_source: "",
  signer_assignment_id: "",
  signer_name: "",
  signer_position: "",
  document_file: null,
};

interface StatusDocumentFieldsProps {
  /** Awalan id isian supaya unik, mis. "kolektif" atau id item */
  idPrefix: string;
  values: StatusDocumentFormValues;
  onChange: (values: StatusDocumentFormValues) => void;
  /** Pesan error per isian, mis. { document_number: "Nomor Dokumen wajib diisi" } */
  errors: Record<string, string>;
  /** Dokumen wajib ada (penonaktifan). Bawaan: opsional (penambahan). */
  required?: boolean;
  disabled: boolean;
  signerOptions: SearchOption[];
}

/**
 * Isian SATU DOKUMEN DASAR (penambahan / penonaktifan karyawan), hanya unggah — tanpa template:
 *
 *   Jenis Dokumen [SK ▾]     Nomor Dokumen [.........]     Tanggal [📅]
 *   File Dokumen [ Tarik & lepas file / Pilih File ]
 *   Penandatangan  ○ Unit ○ Kantor Regional ○ Head Office   (wajib kalau jenisnya SK)
 *
 * Boleh kosong seluruhnya (kecuali `required`). Begitu salah satu isian diisi, jenis, nomor,
 * tanggal, dan file menjadi wajib (tanda * muncul sendiri). Aturannya di checkStatusDocument().
 */
export function StatusDocumentFields({
  idPrefix,
  values,
  onChange,
  errors,
  required = false,
  disabled,
  signerOptions,
}: StatusDocumentFieldsProps) {
  const isFilled = required || hasDocument(values, values.document_file !== null);
  const isSk = values.document_type === SK_DOCUMENT_TYPE;

  function change<K extends keyof StatusDocumentFormValues>(key: K, value: StatusDocumentFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField
          id={`${idPrefix}-document-type`}
          label="Jenis Dokumen"
          required={isFilled}
          options={STATUS_DOCUMENT_TYPES}
          value={values.document_type}
          onChange={(value) => change("document_type", value)}
          error={errors.document_type}
          disabled={disabled}
        />
        <TextField
          id={`${idPrefix}-document-number`}
          label="Nomor Dokumen"
          required={isFilled}
          value={values.document_number}
          onChange={(value) => change("document_number", value)}
          error={errors.document_number}
          disabled={disabled}
          placeholder="Cth. 812/SDM/X/2026"
        />
        <DateField
          id={`${idPrefix}-document-date`}
          label="Tanggal Dokumen"
          required={isFilled}
          value={values.document_date}
          onChange={(value) => change("document_date", value)}
          error={errors.document_date}
          disabled={disabled}
          placeholder="Pilih tanggal dokumen"
          fromYear={2000}
        />
      </div>

      <Field data-invalid={Boolean(errors.document_file)}>
        <FieldLabel htmlFor={`${idPrefix}-document-file`}>
          File Dokumen {isFilled && <RequiredMark />}
        </FieldLabel>
        <FileUploadField
          id={`${idPrefix}-document-file`}
          rule={DOCUMENT_RULE}
          file={values.document_file}
          onChange={(file) => change("document_file", file)}
          invalid={Boolean(errors.document_file)}
          disabled={disabled}
        />
        <FieldError>{errors.document_file}</FieldError>
      </Field>

      <SignerFields
        idPrefix={idPrefix}
        values={values}
        onChange={(signer: SignerValues) => onChange({ ...values, ...signer })}
        errors={errors}
        required={isSk}
        disabled={disabled}
        signerOptions={signerOptions}
      />
    </div>
  );
}
