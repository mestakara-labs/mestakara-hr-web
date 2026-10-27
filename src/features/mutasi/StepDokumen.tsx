"use client";

import { FileSignature, FileUp, Info } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@mestakara/ui/field";
import { RadioGroup, RadioGroupItem } from "@mestakara/ui/radio-group";
import { cn } from "cn";

import { FieldNote } from "@/components/shared/FieldNote";
import { FileUploadField } from "@/components/shared/FileUploadField";
import { DateField, TextField } from "@/components/shared/FormFields";
import { RequiredMark } from "@/components/shared/RequiredMark";
import { SignerFields } from "@/components/shared/SignerFields";
import { toSignerOptions } from "@/features/jabatan-karyawan/assignment-options";
import { DOCUMENT_RULE } from "@/lib/file-rules";
import { DOCUMENT_MODE, suggestDecreeNumber } from "@/lib/transfer-rules";

import { BasisDocumentFields } from "./BasisDocumentFields";
import type { MutasiFormValues, StepProps } from "./mutasi-form-values";

/** Dua cara menyiapkan dokumen SK, tampil sebagai kartu pilihan. */
const MODE_OPTIONS = [
  {
    value: DOCUMENT_MODE.upload,
    icon: FileUp,
    title: "Sudah punya SK yang ditandatangani",
    description: "Unggah scan SK-nya sekarang. Usulan langsung BERLAKU setelah disimpan.",
  },
  {
    value: DOCUMENT_MODE.template,
    icon: FileSignature,
    title: "Buatkan SK dari template",
    description:
      "SK Kolektif & Petikan SK dibuat otomatis (PDF / Word). Usulan MENUNGGU DOKUMEN sampai scan yang ditandatangani diunggah.",
  },
];

/**
 * LANGKAH 3 — DOKUMEN
 *
 *   Dokumen Dasar        Jenis, Nomor, Tanggal, File (opsional; lihat BasisDocumentFields)
 *   Cara menyiapkan SK   [Sudah punya SK bertanda tangan]  [Buatkan dari template]
 *   Data SK              Nomor SK (bawaan 2A44/P/{tgl}-, nomor urut diisi manual), Tanggal SK,
 *                        Penandatangan: Unit (bawaan Manager) / Kantor Regional / Head Office
 *   Scan SK              hanya untuk jalur "Sudah punya SK"
 */
export function StepDokumen({ values, setValues, errors, disabled, data }: StepProps) {
  /** Ubah satu isian SK. */
  function change<K extends "decree_number" | "decree_date" | "document_mode">(
    key: K,
    value: string,
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  /** Ubah isian dokumen dasar / penandatangan SK (sekaligus beberapa isian). */
  function changeMany(changes: Partial<MutasiFormValues>) {
    setValues((previous) => ({ ...previous, ...changes }));
  }

  /**
   * Tanggal SK diganti -> bagian tanggal di nomor SK bawaan ikut diganti,
   * mis. "2A44/P/2026.10.09-015" -> "2A44/P/2026.10.12-015". Nomor yang diketik bebas dibiarkan.
   */
  function changeDecreeDate(date: string) {
    setValues((previous) => {
      const oldPrefix = suggestDecreeNumber(previous.decree_date);
      const decreeNumber =
        date && previous.decree_number.startsWith(oldPrefix)
          ? suggestDecreeNumber(date) + previous.decree_number.slice(oldPrefix.length)
          : previous.decree_number;

      return { ...previous, decree_date: date, decree_number: decreeNumber };
    });
  }

  // Calon penandatangan dari Unit: pejabat yang sedang menjabat, dari level BRM tertinggi.
  const signerOptions = toSignerOptions(data.assignments);

  return (
    <div className="flex flex-col gap-6">
      {/* Dokumen dasar mutasi (opsional) */}
      <FieldSet>
        <FieldLegend>Dokumen Dasar Mutasi & Penempatan</FieldLegend>
        <BasisDocumentFields
          values={values}
          onChange={changeMany}
          errors={errors}
          disabled={disabled}
          signerOptions={signerOptions}
        />
      </FieldSet>

      {/* Cara menyiapkan dokumen */}
      <FieldSet>
        <FieldLegend>Cara Menyiapkan Dokumen SK</FieldLegend>
        <RadioGroup
          value={values.document_mode}
          onValueChange={(value) => change("document_mode", value)}
          disabled={disabled}
          className="grid gap-3 md:grid-cols-2"
        >
          {MODE_OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`mode-${option.value}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4",
                values.document_mode === option.value ? "border-primary bg-brand-subtle" : "border-border hover:bg-subtle",
              )}
            >
              <RadioGroupItem id={`mode-${option.value}`} value={option.value} className="mt-1" />
              <option.icon className="mt-0.5 size-5 shrink-0 text-fg-brand" />
              <span>
                <span className="block typo-label-m text-fg-heading">{option.title}</span>
                <span className="block typo-body-s text-fg-secondary">{option.description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
        <FieldError>{errors.document_mode}</FieldError>
      </FieldSet>

      {/* Data SK */}
      <FieldSet>
        <FieldLegend>Data SK</FieldLegend>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            id="decree_number"
            label="Nomor SK"
            required
            value={values.decree_number}
            onChange={(value) => change("decree_number", value)}
            error={errors.decree_number}
            disabled={disabled}
            placeholder="Cth. 2A44/P/2026.10.09-015"
            note='nomor urut di belakang tanda "-" diisi manual.'
          />
          <DateField
            id="decree_date"
            label="Tanggal SK"
            required
            value={values.decree_date}
            onChange={changeDecreeDate}
            error={errors.decree_date}
            disabled={disabled}
            placeholder="Pilih tanggal SK"
            fromYear={2000}
          />
        </div>
        <SignerFields
          idPrefix="sk"
          values={values}
          onChange={changeMany}
          errors={errors}
          required
          disabled={disabled}
          signerOptions={signerOptions}
        />
        <FieldNote>Penandatangan bawaan: Manager yang sedang menjabat (Unit).</FieldNote>
      </FieldSet>

      {/* Scan SK / keterangan template */}
      {values.document_mode === DOCUMENT_MODE.upload && (
        <Field data-invalid={Boolean(errors.signed_file)}>
          <FieldLabel htmlFor="signed_file">
            Scan SK yang Sudah Ditandatangani <RequiredMark />
          </FieldLabel>
          <FileUploadField
            id="signed_file"
            rule={DOCUMENT_RULE}
            file={values.signed_file}
            onChange={(file) => setValues((previous) => ({ ...previous, signed_file: file }))}
            invalid={Boolean(errors.signed_file)}
            disabled={disabled}
          />
          <FieldError>{errors.signed_file}</FieldError>
        </Field>
      )}

      {values.document_mode === DOCUMENT_MODE.template && (
        <Alert variant="info">
          <Info />
          <AlertDescription>
            <p>
              Setelah disimpan, <strong>SK Kolektif</strong> dan <strong>Petikan SK</strong> setiap karyawan bisa
              diunduh (PDF / Word) di halaman detail usulan. Tanda tangani & beri stempel, lalu unggah scan SK
              Kolektif di halaman yang sama supaya usulan berlaku.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
