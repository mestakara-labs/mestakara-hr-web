"use client";

import type { Dispatch, SetStateAction } from "react";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { FieldLegend, FieldSet } from "@mestakara/ui/field";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";

import { DateField, SelectField, TextAreaField, TextField } from "@/components/shared/FormFields";
import { toSignerOptions } from "@/features/jabatan-karyawan/assignment-options";
import { DocumentScopeSection } from "@/features/penambahan/DocumentScopeSection";
import { formatDate } from "@/lib/date";
import {
  requiresDestinationUnit,
  requiresTerminationReason,
  TERMINATION_TYPE,
  TERMINATION_TYPE_OPTIONS,
  TERMINATION_TYPES,
} from "@/lib/termination-rules";

import {
  itemErrorKey,
  retirementDateOf,
  withType,
  type PenonaktifanData,
  type PenonaktifanFormValues,
  type PenonaktifanItemValues,
  type StepErrors,
} from "./penonaktifan-form-values";

interface StepDasarPenonaktifanProps {
  values: PenonaktifanFormValues;
  setValues: Dispatch<SetStateAction<PenonaktifanFormValues>>;
  errors: StepErrors;
  disabled: boolean;
  data: PenonaktifanData;
}

/**
 * LANGKAH 2 — DASAR PENONAKTIFAN & DOKUMEN
 *
 *   Dasar Penonaktifan
 *     Samakan jenis untuk semua [▾]   [Samakan TMT dengan baris pertama]
 *     Per karyawan: Jenis [▾] · TMT Nonaktif [📅] · Unit Tujuan (Mutasi Keluar) · Alasan
 *   Dokumen Dasar Penonaktifan (WAJIB)
 *     ○ Kolektif  ○ Per Orang
 *     Jenis · Nomor · Tanggal · File · Penandatangan (wajib kalau SK)
 */
export function StepDasarPenonaktifan({ values, setValues, errors, disabled, data }: StepDasarPenonaktifanProps) {
  const signerOptions = toSignerOptions(data.assignments);
  const employeeOf = (employeeId: string) => data.employees.find((entry) => entry.id === employeeId);

  function changeItem(itemId: string, changes: Partial<PenonaktifanItemValues>) {
    setValues((previous) => ({
      ...previous,
      items: previous.items.map((item) => (item.id === itemId ? { ...item, ...changes } : item)),
    }));
  }

  function changeType(itemId: string, type: string) {
    setValues((previous) => ({
      ...previous,
      items: previous.items.map((item) => (item.id === itemId ? withType(item, type, employeeOf(item.employee_id)) : item)),
    }));
  }

  /** "Samakan jenis untuk semua". */
  function applyTypeToAll(type: string) {
    if (!type) return;
    setValues((previous) => ({
      ...previous,
      items: previous.items.map((item) => withType(item, type, employeeOf(item.employee_id))),
    }));
  }

  /** "Samakan TMT": TMT karyawan pertama dipakai untuk semua. */
  function applyFirstDateToAll() {
    const date = values.items[0]?.effective_date;
    if (!date) return;
    setValues((previous) => ({ ...previous, items: previous.items.map((item) => ({ ...item, effective_date: date })) }));
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ================= Dasar penonaktifan per karyawan ================= */}
      <FieldSet>
        <FieldLegend>Dasar Penonaktifan</FieldLegend>
        <div className="flex flex-wrap items-center gap-2 typo-body-s text-fg-secondary">
          Samakan jenis untuk semua:
          <NativeSelect
            aria-label="Samakan jenis untuk semua"
            value=""
            onChange={(event) => applyTypeToAll(event.target.value)}
            disabled={disabled}
            className="w-52"
          >
            <NativeSelectOption value="">Pilih jenis...</NativeSelectOption>
            {TERMINATION_TYPES.map((type) => (
              <NativeSelectOption key={type} value={type}>
                {type}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button type="button" variant="ghost" size="sm" onClick={applyFirstDateToAll} disabled={disabled || !values.items[0]?.effective_date}>
            Samakan TMT dengan baris pertama
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {values.items.map((item) => {
            const employee = employeeOf(item.employee_id);
            const key = (field: string) => errors[itemErrorKey(item.id, field)];
            const retirementDate = retirementDateOf(employee);
            const typeDescription = TERMINATION_TYPE_OPTIONS.find((option) => option.value === item.type)?.description;

            return (
              <div key={item.id} className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <p className="typo-label-m text-fg-heading">{employee?.name ?? "-"}</p>
                  <p className="typo-body-s text-fg-tertiary">
                    {employee?.position?.title ?? "Belum ditempatkan"} · {employee?.employment_status}
                    {retirementDate && ` · Pensiun ${formatDate(retirementDate)}`}
                  </p>
                </div>
                <SelectField
                  id={`${item.id}-type`}
                  label="Jenis Penonaktifan"
                  required
                  options={TERMINATION_TYPES}
                  value={item.type}
                  onChange={(value) => changeType(item.id, value)}
                  error={key("type")}
                  disabled={disabled}
                  note={typeDescription}
                />
                <DateField
                  id={`${item.id}-effective-date`}
                  label="TMT Nonaktif"
                  required
                  value={item.effective_date}
                  onChange={(value) => changeItem(item.id, { effective_date: value })}
                  error={key("effective_date")}
                  disabled={disabled}
                  placeholder="Pilih hari pertama tidak aktif"
                  fromYear={2000}
                  note={
                    item.type === TERMINATION_TYPE.retirement && retirementDate
                      ? `Terisi otomatis dari tanggal pensiun (${formatDate(retirementDate)}); bisa diubah.`
                      : "Hari pertama karyawan tidak aktif; jabatan & regu berakhir sehari sebelumnya."
                  }
                />
                {requiresDestinationUnit(item.type) && (
                  <TextField
                    id={`${item.id}-destination-unit`}
                    label="Unit Tujuan"
                    required
                    value={item.destination_unit}
                    onChange={(value) => changeItem(item.id, { destination_unit: value })}
                    error={key("destination_unit")}
                    disabled={disabled}
                    placeholder="Cth. PTPN I Regional 1"
                  />
                )}
                <div className="md:col-span-2">
                  <TextAreaField
                    id={`${item.id}-reason`}
                    label="Alasan"
                    required={requiresTerminationReason(item.type)}
                    value={item.reason}
                    onChange={(value) => changeItem(item.id, { reason: value })}
                    error={key("reason")}
                    disabled={disabled}
                    placeholder="Cth. Kontrak kerja tidak diperpanjang"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </FieldSet>

      {/* ================= Dokumen dasar penonaktifan ================= */}
      <FieldSet>
        <FieldLegend>Dokumen Dasar Penonaktifan</FieldLegend>
        <Alert variant="info">
          <Info />
          <AlertDescription>
            <p>
              <strong>Wajib</strong> diunggah sebelum usulan bisa diberlakukan (SK / Memo / Nota Dinas, dll.). Pilih jenis{" "}
              <strong>SK</strong> kalau dokumennya berupa SK (penandatangan wajib).
            </p>
          </AlertDescription>
        </Alert>

        <DocumentScopeSection
          scope={values.document_scope}
          onScopeChange={(scope) => setValues((previous) => ({ ...previous, document_scope: scope }))}
          collective={values}
          onCollectiveChange={(document) => setValues((previous) => ({ ...previous, ...document }))}
          items={values.items}
          onItemChange={(itemId, document) => changeItem(itemId, document)}
          labelOf={(item) => employeeOf(item.employee_id)?.name ?? "-"}
          errors={errors}
          required
          disabled={disabled}
          signerOptions={signerOptions}
        />
      </FieldSet>
    </div>
  );
}
