"use client";

import type { Dispatch, SetStateAction } from "react";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { FieldLegend, FieldSet } from "@mestakara/ui/field";

import { DateField, SelectField, TextField } from "@/components/shared/FormFields";
import { toSignerOptions } from "@/features/jabatan-karyawan/assignment-options";
import {
  ACTIVATION_TYPE,
  ACTIVATION_TYPE_OPTIONS,
  allowedActivationTypes,
} from "@/lib/activation-rules";
import { formatDate } from "@/lib/date";

import {
  itemErrorKey,
  type PenambahanData,
  type PenambahanFormValues,
  type PenambahanItemValues,
  type StepErrors,
} from "./penambahan-form-values";
import { DocumentScopeSection } from "./DocumentScopeSection";

interface StepDasarDokumenProps {
  values: PenambahanFormValues;
  setValues: Dispatch<SetStateAction<PenambahanFormValues>>;
  errors: StepErrors;
  disabled: boolean;
  data: PenambahanData;
}

/**
 * LANGKAH 2 — DASAR PENAMBAHAN & DOKUMEN
 *
 *   Dasar Penambahan
 *     Samakan untuk semua: [Penerimaan Baru] [Mutasi Masuk] [Pengaktifan Kembali]
 *     Per karyawan: Dasar [▾] · TMT Aktif [📅] · Unit Asal (Mutasi Masuk)
 *   Dokumen Dasar Penambahan (opsional, sangat disarankan)
 *     ○ Kolektif  ○ Per Orang
 *     Jenis · Nomor · Tanggal · File · Penandatangan (wajib kalau SK)
 */
export function StepDasarDokumen({ values, setValues, errors, disabled, data }: StepDasarDokumenProps) {
  const signerOptions = toSignerOptions(data.assignments);
  const employeeOf = (employeeId: string) => data.employees.find((entry) => entry.id === employeeId);

  function changeItem(itemId: string, changes: Partial<PenambahanItemValues>) {
    setValues((previous) => ({
      ...previous,
      items: previous.items.map((item) => (item.id === itemId ? { ...item, ...changes } : item)),
    }));
  }

  /** "Samakan untuk semua": jenis yang sama untuk setiap karyawan yang boleh memakainya. */
  function applyTypeToAll(type: string) {
    setValues((previous) => ({
      ...previous,
      items: previous.items.map((item) =>
        allowedActivationTypes(employeeOf(item.employee_id)?.active_status ?? "").includes(type) ? { ...item, type } : item,
      ),
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
      {/* ================= Dasar penambahan per karyawan ================= */}
      <FieldSet>
        <FieldLegend>Dasar Penambahan</FieldLegend>
        <div className="flex flex-wrap items-center gap-2 typo-body-s text-fg-secondary">
          Samakan untuk semua:
          {ACTIVATION_TYPE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyTypeToAll(option.value)}
              disabled={disabled}
              title={option.description}
            >
              {option.value}
            </Button>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={applyFirstDateToAll} disabled={disabled || !values.items[0]?.effective_date}>
            Samakan TMT dengan baris pertama
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {values.items.map((item) => {
            const employee = employeeOf(item.employee_id);
            const key = (field: string) => errors[itemErrorKey(item.id, field)];

            return (
              <div key={item.id} className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="md:col-span-3">
                  <p className="typo-label-m text-fg-heading">{employee?.name ?? "-"}</p>
                  <p className="typo-body-s text-fg-tertiary">
                    {employee?.employment_status} · {employee?.active_status}
                    {employee?.hire_date && ` · Tanggal Masuk ${formatDate(employee.hire_date)}`}
                  </p>
                </div>
                <SelectField
                  id={`${item.id}-type`}
                  label="Dasar Penambahan"
                  required
                  options={allowedActivationTypes(employee?.active_status ?? "")}
                  value={item.type}
                  onChange={(value) => changeItem(item.id, { type: value })}
                  error={key("type")}
                  disabled={disabled}
                />
                <DateField
                  id={`${item.id}-effective-date`}
                  label="TMT Aktif"
                  required
                  value={item.effective_date}
                  onChange={(value) => changeItem(item.id, { effective_date: value })}
                  error={key("effective_date")}
                  disabled={disabled}
                  placeholder="Pilih tanggal mulai aktif"
                  fromYear={2000}
                  note="tanggal mulai aktif di unit ini; tidak boleh sebelum Tanggal Masuk."
                />
                {item.type === ACTIVATION_TYPE.transferIn && (
                  <TextField
                    id={`${item.id}-origin-unit`}
                    label="Unit Asal"
                    required
                    value={item.origin_unit}
                    onChange={(value) => changeItem(item.id, { origin_unit: value })}
                    error={key("origin_unit")}
                    disabled={disabled}
                    placeholder="Cth. PTPN I Regional 1"
                  />
                )}
              </div>
            );
          })}
        </div>
      </FieldSet>

      {/* ================= Dokumen dasar penambahan ================= */}
      <FieldSet>
        <FieldLegend>Dokumen Dasar Penambahan</FieldLegend>
        <Alert variant="info">
          <Info />
          <AlertDescription>
            <p>
              Opsional, namun sangat disarankan sebagai dasar penambahan karyawan. Pilih jenis <strong>SK</strong> kalau
              dokumennya berupa SK (penandatangan wajib). Dokumen juga bisa diunggah nanti dari halaman detail usulan.
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
          disabled={disabled}
          signerOptions={signerOptions}
        />
      </FieldSet>
    </div>
  );
}
