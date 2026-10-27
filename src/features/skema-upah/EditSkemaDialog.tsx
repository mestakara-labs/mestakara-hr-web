"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { DateField, TextAreaField, type SelectOption } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost } from "@/lib/http-client";
import { requireText } from "@/lib/validation";
import { checkWageScheme } from "@/lib/wage-rules";
import type { WageEmployeeResource, WageSchemePayload } from "@/types/api/wage";

import { toSchemeValues, toSkemaForm, type SkemaFormValues } from "./skema-upah-form-values";
import { WageSchemeFields } from "./WageSchemeFields";

interface EditSkemaDialogProps {
  /** Karyawan yang skemanya diubah. null = dialog tertutup. */
  target: WageEmployeeResource | null;
  payrollGroupOptions: SelectOption[];
  onClose: () => void;
  /** Dipanggil setelah berhasil disimpan (untuk memuat ulang tabel) */
  onSaved: () => void;
}

/**
 * Dialog UBAH SKEMA UPAH satu karyawan:
 *
 *   ┌ Ubah Skema Upah — Asep Saepudin ─────────────── × ┐
 *   │ isian skema (WageSchemeFields)                      │
 *   │ Berlaku Mulai [1 Okt 2026]   Keterangan [...]       │
 *   │                                 [Batal] [Simpan]    │
 *   └─────────────────────────────────────────────────────┘
 *
 * Simpan = menambah catatan riwayat baru; skema lama tetap tersimpan di Riwayat.
 */
export function EditSkemaDialog(props: EditSkemaDialogProps) {
  if (!props.target) return null;
  // `key` = isian diisi ulang setiap kali dialog dibuka untuk karyawan lain.
  return <EditSkemaDialogContent key={props.target.id} {...props} target={props.target} />;
}

function EditSkemaDialogContent({
  target,
  payrollGroupOptions,
  onClose,
  onSaved,
}: EditSkemaDialogProps & { target: WageEmployeeResource }) {
  const [values, setValues] = useState<SkemaFormValues>(() => toSkemaForm(target.wage_scheme));

  const { submit, clearError, saving, errors, formError } = useFormSubmit<SkemaFormValues>({
    validate: (form) => ({
      ...checkWageScheme(form),
      effective_date: requireText(form.effective_date, "Berlaku Mulai"),
    }),
    onSubmit: async (form) => {
      const payload: WageSchemePayload = {
        ...toSchemeValues(form),
        effective_date: form.effective_date,
        notes: form.notes.trim(),
      };
      await apiPost(`/api/employees/${target.id}/wage-schemes`, payload);

      toast.success(`Skema upah ${target.name} berhasil disimpan`);
      onSaved();
      onClose();
    },
  });

  /** Ubah satu isian, sekaligus hapus pesan error isian itu. */
  function changeValue<K extends keyof SkemaFormValues>(key: K, value: SkemaFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  return (
    <FormDialog
      open
      title={`${target.wage_scheme ? "Ubah" : "Atur"} Skema Upah — ${target.name}`}
      description="Perubahan disimpan sebagai riwayat baru; skema lama tetap tersimpan dan tetap dipakai untuk periode sebelumnya."
      saveLabel={saving ? "Menyimpan..." : "Simpan Skema"}
      onSave={() => submit(values)}
      onClose={onClose}
    >
      {formError && (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <WageSchemeFields
        values={values}
        onChange={changeValue}
        errors={errors}
        disabled={saving}
        payrollGroupOptions={payrollGroupOptions}
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
          note="skema ini dipakai untuk perhitungan upah mulai tanggal ini."
        />
        <TextAreaField
          id="notes"
          label="Keterangan"
          value={values.notes}
          onChange={(value) => changeValue("notes", value)}
          error={errors.notes}
          disabled={saving}
          placeholder="Cth. Penyesuaian UMK 2026"
          note="opsional."
        />
      </div>
    </FormDialog>
  );
}
