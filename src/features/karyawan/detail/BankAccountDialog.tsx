"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { DateField, TextAreaField, TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { toDateText } from "@/lib/date";
import { apiPost } from "@/lib/http-client";
import { requireText } from "@/lib/validation";
import type { BankAccountPayload, CurrentBankAccount } from "@/types/api/wage";

interface BankAccountDialogProps {
  open: boolean;
  employeeId: string;
  employeeName: string;
  /** Rekening yang berlaku sekarang (untuk isian awal). null = belum ada. */
  current: CurrentBankAccount | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Dialog UBAH REKENING BANK. Simpan = menambah catatan riwayat baru; rekening lama tetap tersimpan.
 *
 *   Nama Bank [BRI]   No. Rekening [224501022580505]   Atas Nama [JEJEN JAINAL]
 *   Berlaku Mulai [25 Okt 2026]   Keterangan [...]
 */
export function BankAccountDialog(props: BankAccountDialogProps) {
  if (!props.open) return null;
  // Dibuat ulang setiap kali dibuka, supaya isian diisi ulang dari rekening yang berlaku.
  return <BankAccountDialogContent {...props} />;
}

function BankAccountDialogContent({ employeeId, employeeName, current, onClose, onSaved }: BankAccountDialogProps) {
  const [values, setValues] = useState<BankAccountPayload>({
    bank_name: current?.bank_name ?? "",
    account_number: current?.account_number ?? "",
    account_holder: current?.account_holder ?? employeeName,
    effective_date: toDateText(new Date()),
    notes: "",
  });

  const { submit, clearError, saving, errors, formError } = useFormSubmit<BankAccountPayload>({
    validate: (form) => ({
      bank_name: requireText(form.bank_name, "Nama Bank"),
      account_number: requireText(form.account_number, "No. Rekening"),
      account_holder: requireText(form.account_holder, "Atas Nama"),
      effective_date: requireText(form.effective_date, "Berlaku Mulai"),
    }),
    onSubmit: async (form) => {
      await apiPost(`/api/employees/${employeeId}/bank-accounts`, form);
      toast.success("Rekening bank berhasil disimpan");
      onSaved();
      onClose();
    },
  });

  /** Ubah satu isian, sekaligus hapus pesan error isian itu. */
  function changeValue(key: keyof BankAccountPayload, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  return (
    <FormDialog
      open
      title={current ? "Ubah Rekening Bank" : "Isi Rekening Bank"}
      description="Rekening lama tetap tersimpan di riwayat."
      saveLabel={saving ? "Menyimpan..." : "Simpan Rekening"}
      onSave={() => submit(values)}
      onClose={onClose}
    >
      {formError && (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          id="bank_name"
          label="Nama Bank"
          required
          value={values.bank_name}
          onChange={(value) => changeValue("bank_name", value)}
          error={errors.bank_name}
          disabled={saving}
          placeholder="Cth. BRI"
        />
        <TextField
          id="account_number"
          label="No. Rekening"
          required
          inputMode="numeric"
          value={values.account_number}
          // Angka saja; disimpan sebagai teks supaya 0 di depan tidak hilang.
          onChange={(value) => changeValue("account_number", value.replace(/\D/g, ""))}
          error={errors.account_number}
          disabled={saving}
          placeholder="Cth. 224501022580505"
        />
      </div>
      <TextField
        id="account_holder"
        label="Atas Nama"
        required
        value={values.account_holder}
        onChange={(value) => changeValue("account_holder", value)}
        error={errors.account_holder}
        disabled={saving}
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
          placeholder="Cth. Pindah ke rekening BRI payroll"
          note="opsional."
        />
      </div>
    </FormDialog>
  );
}
