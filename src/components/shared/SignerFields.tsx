"use client";

import { Field, FieldError, FieldLabel } from "@mestakara/ui/field";
import { RadioGroup, RadioGroupItem } from "@mestakara/ui/radio-group";

import { SIGNER_SOURCE, SIGNER_SOURCES, isExternalSigner, type SignerValues } from "@/lib/signer-rules";

import { FieldNote } from "./FieldNote";
import { SearchSelectField, TextField } from "./FormFields";
import { RequiredMark } from "./RequiredMark";
import type { SearchOption } from "./SearchSelect";

interface SignerFieldsProps {
  /** Awalan id isian supaya unik, mis. "kolektif" atau id item */
  idPrefix: string;
  values: SignerValues;
  onChange: (values: SignerValues) => void;
  errors: Partial<Record<keyof SignerValues, string>>;
  /** Wajib diisi (mis. jenis dokumen SK) */
  required: boolean;
  disabled: boolean;
  /** Calon penandatangan dari unit sendiri (lihat toSignerOptions) */
  signerOptions: SearchOption[];
}

/**
 * ISIAN PENANDATANGAN DOKUMEN (dipakai Penambahan, Penonaktifan, dan Mutasi):
 *
 *   Penandatangan *   ○ Unit   ○ Kantor Regional   ○ Head Office
 *     Unit            -> [Cari nama pejabat ▾]            (pejabat aktif di unit ini)
 *     Regional / HO   -> Nama [..........]  Jabatan [..........]   (diketik)
 */
export function SignerFields({ idPrefix, values, onChange, errors, required, disabled, signerOptions }: SignerFieldsProps) {
  /** Ganti asal penandatangan: isian sumber lama dikosongkan supaya tidak terkirim. */
  function changeSource(source: string) {
    onChange({ signer_source: source, signer_assignment_id: "", signer_name: "", signer_position: "" });
  }

  return (
    <div className="flex flex-col gap-4">
      <Field data-invalid={Boolean(errors.signer_source)}>
        <FieldLabel>
          Penandatangan {required && <RequiredMark />}
        </FieldLabel>
        <RadioGroup
          value={values.signer_source}
          onValueChange={changeSource}
          disabled={disabled}
          className="flex flex-wrap gap-x-6 gap-y-2"
          aria-label="Asal penandatangan"
        >
          {SIGNER_SOURCES.map((source) => (
            <label key={source} htmlFor={`${idPrefix}-signer-${source}`} className="flex cursor-pointer items-center gap-2 typo-body-m">
              <RadioGroupItem id={`${idPrefix}-signer-${source}`} value={source} />
              {source}
            </label>
          ))}
        </RadioGroup>
        <FieldNote>
          {required ? "wajib untuk dokumen jenis SK. " : "opsional untuk jenis dokumen selain SK. "}
          Pejabat Kantor Regional / Head Office tidak ada di data unit, jadi nama & jabatannya diketik.
        </FieldNote>
        <FieldError>{errors.signer_source}</FieldError>
      </Field>

      {values.signer_source === SIGNER_SOURCE.unit && (
        <SearchSelectField
          id={`${idPrefix}-signer-assignment`}
          label="Pejabat Penandatangan"
          required
          options={signerOptions}
          value={values.signer_assignment_id}
          onChange={(value) => onChange({ ...values, signer_assignment_id: value })}
          error={errors.signer_assignment_id}
          disabled={disabled}
          placeholder="Cari nama pejabat..."
          emptyMessage="Pejabat tidak ditemukan."
        />
      )}

      {isExternalSigner(values.signer_source) && (
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id={`${idPrefix}-signer-name`}
            label="Nama Penandatangan"
            required
            value={values.signer_name}
            onChange={(value) => onChange({ ...values, signer_name: value })}
            error={errors.signer_name}
            disabled={disabled}
            placeholder="Cth. Ir. Budi Santoso"
          />
          <TextField
            id={`${idPrefix}-signer-position`}
            label="Jabatan Penandatangan"
            required
            value={values.signer_position}
            onChange={(value) => onChange({ ...values, signer_position: value })}
            error={errors.signer_position}
            disabled={disabled}
            placeholder={
              values.signer_source === SIGNER_SOURCE.headOffice ? "Cth. Direktur SDM" : "Cth. Kepala Bagian SDM Regional 2"
            }
          />
        </div>
      )}
    </div>
  );
}
