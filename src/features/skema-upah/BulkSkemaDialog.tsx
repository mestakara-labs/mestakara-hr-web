"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDialog } from "@/components/shared/FormDialog";
import { DateField, TextAreaField, type SelectOption } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost } from "@/lib/http-client";
import { requireText } from "@/lib/validation";
import { checkWageScheme } from "@/lib/wage-rules";
import type { WageEmployeeResource, WageSchemeBulkPayload } from "@/types/api/wage";

import {
  BULK_FIELDS,
  NO_BULK_FIELDS,
  toBulkFields,
  toSkemaForm,
  type BulkField,
  type SkemaFormValues,
} from "./skema-upah-form-values";
import { WageSchemeFields } from "./WageSchemeFields";

interface BulkSkemaDialogProps {
  /** Karyawan yang dipilih. Kosong = dialog tertutup. */
  targets: WageEmployeeResource[];
  payrollGroupOptions: SelectOption[];
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Dialog UBAH SKEMA SEKALIGUS untuk karyawan yang dicentang di tabel:
 *
 *   ┌ Ubah Skema Upah (25 karyawan) ─────────────────── × ┐
 *   │ ☑ Ubah Gaji Pokok   [2.375.000]                       │
 *   │ ☐ Ubah HKE          [25]   (tidak dicentang = tetap)  │
 *   │ ...                                                   │
 *   │ Berlaku Mulai [1 Okt 2026]   Keterangan [...]         │
 *   │                                    [Batal] [Simpan]   │
 *   └───────────────────────────────────────────────────────┘
 *
 * Hanya isian yang dicentang yang diubah; isian lain disalin dari skema masing-masing karyawan.
 * Karyawan yang BELUM punya skema wajib diberi Jenis Upah & Gaji Pokok.
 */
export function BulkSkemaDialog(props: BulkSkemaDialogProps) {
  if (props.targets.length === 0) return null;
  // `key` = isian kembali kosong setiap kali dialog dibuka untuk pilihan karyawan lain.
  return <BulkSkemaDialogContent key={props.targets.map((target) => target.id).join(",")} {...props} />;
}

function BulkSkemaDialogContent({ targets, payrollGroupOptions, onClose, onSaved }: BulkSkemaDialogProps) {
  const [values, setValues] = useState<SkemaFormValues>(() => toSkemaForm(null));
  const [enabled, setEnabled] = useState<Record<BulkField, boolean>>(NO_BULK_FIELDS);
  const [isConfirming, setIsConfirming] = useState(false);

  const withoutScheme = targets.filter((target) => target.wage_scheme === null).length;
  const enabledLabels = BULK_FIELDS.filter((field) => enabled[field.key]).map((field) => field.label);

  const { submit, check, clearError, saving, errors, formError } = useFormSubmit<SkemaFormValues>({
    validate: (form) => {
      // Hanya isian yang dicentang yang diperiksa.
      const all = checkWageScheme(form);
      return {
        wage_type:
          enabledLabels.length === 0
            ? "Centang minimal satu isian yang ingin diubah"
            : withoutScheme > 0 && !enabled.wage_type
              ? `${withoutScheme} karyawan belum punya skema: Jenis Upah wajib diubah`
              : enabled.wage_type ? all.wage_type : undefined,
        base_salary:
          withoutScheme > 0 && !enabled.base_salary
            ? `${withoutScheme} karyawan belum punya skema: Gaji Pokok wajib diubah`
            : enabled.base_salary ? all.base_salary : undefined,
        working_days: enabled.working_days ? all.working_days : undefined,
        cap_days: enabled.cap ? all.cap_days : undefined,
        meal_allowance_per_day: enabled.meal ? all.meal_allowance_per_day : undefined,
        effective_date: requireText(form.effective_date, "Berlaku Mulai"),
      };
    },
    onSubmit: async (form) => {
      const payload: WageSchemeBulkPayload = {
        employee_ids: targets.map((target) => target.id),
        effective_date: form.effective_date,
        notes: form.notes.trim(),
        fields: toBulkFields(form, enabled),
      };
      const response = await apiPost("/api/wage-schemes/bulk", payload);

      toast.success(response.message);
      onSaved();
      onClose();
    },
  });

  /** Ubah satu isian, sekaligus hapus pesan error isian itu. */
  function changeValue<K extends keyof SkemaFormValues>(key: K, value: SkemaFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  /** Centang / lepas "Ubah ..." satu kelompok isian. */
  function toggleField(field: BulkField, isOn: boolean) {
    setEnabled((previous) => ({ ...previous, [field]: isOn }));
    clearError("wage_type");
  }

  return (
    <>
      <FormDialog
        open
        title={`Ubah Skema Upah (${targets.length} karyawan)`}
        description="Centang isian yang ingin diubah. Isian yang tidak dicentang tetap seperti skema masing-masing karyawan."
        saveLabel={saving ? "Menyimpan..." : "Simpan"}
        onSave={() => check(values) && setIsConfirming(true)}
        onClose={onClose}
      >
        {formError && (
          <Alert variant="danger">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        {withoutScheme > 0 && (
          <Alert variant="warning">
            <AlertDescription>
              {withoutScheme} dari {targets.length} karyawan belum punya skema upah. Untuk mereka, Jenis Upah dan Gaji
              Pokok wajib diubah; isian lain yang tidak dicentang memakai nilai bawaan.
            </AlertDescription>
          </Alert>
        )}

        <WageSchemeFields
          values={values}
          onChange={changeValue}
          errors={errors}
          disabled={saving}
          payrollGroupOptions={payrollGroupOptions}
          bulk={{ enabled, onToggle: toggleField }}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <DateField
            id="effective_date"
            label="Berlaku Mulai"
            required
            value={values.effective_date}
            onChange={(value) => changeValue("effective_date", value)}
            error={errors.effective_date}
            disabled={saving}
          />
          <TextAreaField
            id="notes"
            label="Keterangan"
            value={values.notes}
            onChange={(value) => changeValue("notes", value)}
            error={errors.notes}
            disabled={saving}
            placeholder="Cth. Kenaikan Gaji Pokok Casual Gunung Mas"
            note="opsional."
          />
        </div>
      </FormDialog>

      {/* Pop-up konfirmasi sebelum data dikirim */}
      <ConfirmDialog
        open={isConfirming}
        icon={CircleHelp}
        tone="info"
        title="Simpan perubahan skema upah?"
        description={
          <>
            <p>
              Skema upah <strong>{targets.length} karyawan</strong> akan diubah:
            </p>
            <p className="mt-2 font-medium text-fg-primary">{enabledLabels.join(", ")}</p>
          </>
        }
        cancelLabel="Periksa Lagi"
        confirmLabel="Ya, Simpan"
        onCancel={() => setIsConfirming(false)}
        onConfirm={() => {
          setIsConfirming(false);
          submit(values);
        }}
      />
    </>
  );
}
