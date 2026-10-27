"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPut } from "@/lib/http-client";
import { formatRupiah, parseRupiah, toRupiahText } from "@/lib/wage-rules";
import type { PayrollDeductionPayload, PayrollDeductions, PayrollRow } from "@/types/api/payroll";

interface DeductionDialogProps {
  /** Karyawan yang diubah: satu = ubah biasa, lebih dari satu = ubah sekaligus. Kosong = dialog tertutup. */
  targets: PayrollRow[];
  period: string;
  onClose: () => void;
  onSaved: () => void;
}

/** Tiga isian potongan beserta labelnya. */
const DEDUCTION_FIELDS: { key: keyof PayrollDeductions; label: string }[] = [
  { key: "bpjs", label: "Potongan BPJS TK/KES" },
  { key: "pph21", label: "Potongan PPIP/PPh 21" },
  { key: "unit", label: "Potongan Kebun/Unit" },
];

type DeductionFormValues = Record<keyof PayrollDeductions, string>;

/**
 * Dialog UBAH POTONGAN:
 *   - satu karyawan  : ketiga isian terisi potongan sekarang; Upah Diterima dihitung ulang di bawah
 *   - ubah sekaligus : isian kosong = TIDAK diubah; yang diisi berlaku untuk semua karyawan terpilih
 * Potongan tidak boleh melebihi Jumlah Upah & Tunjangan (diperiksa server).
 */
export function DeductionDialog(props: DeductionDialogProps) {
  if (props.targets.length === 0) return null;
  // `key` = isian diisi ulang setiap kali dibuka untuk karyawan lain.
  return <DeductionDialogContent key={props.targets.map((row) => row.employee_id).join()} {...props} />;
}

function DeductionDialogContent({ targets, period, onClose, onSaved }: DeductionDialogProps) {
  const single = targets.length === 1 ? targets[0] : null;
  const [values, setValues] = useState<DeductionFormValues>({
    bpjs: single ? toRupiahText(single.deductions.bpjs) : "",
    pph21: single ? toRupiahText(single.deductions.pph21) : "",
    unit: single ? toRupiahText(single.deductions.unit) : "",
  });

  const { submit, clearError, saving, errors, formError } = useFormSubmit<DeductionFormValues>({
    validate: (form) => ({
      bpjs: single && form.bpjs === "" ? "Wajib diisi (0 kalau tidak ada)" : undefined,
      pph21: single && form.pph21 === "" ? "Wajib diisi (0 kalau tidak ada)" : undefined,
      unit:
        single && form.unit === ""
          ? "Wajib diisi (0 kalau tidak ada)"
          : !single && DEDUCTION_FIELDS.every(({ key }) => form[key] === "")
            ? "Isi minimal satu potongan"
            : undefined,
    }),
    onSubmit: async (form) => {
      const payload: PayrollDeductionPayload = { period, employee_ids: targets.map((row) => row.employee_id) };
      // Ubah sekaligus: isian kosong tidak dikirim (tidak diubah).
      for (const { key } of DEDUCTION_FIELDS) {
        const amount = parseRupiah(form[key]);
        if (amount !== null) payload[key] = amount;
      }
      await apiPut("/api/payroll/deductions", payload);

      toast.success(single ? `Potongan ${single.name} berhasil disimpan` : `Potongan ${targets.length} karyawan berhasil disimpan`);
      onSaved();
      onClose();
    },
  });

  /** Ubah satu isian (dirapikan berpemisah ribuan), sekaligus hapus pesan error-nya. */
  function changeValue(key: keyof PayrollDeductions, text: string) {
    setValues((previous) => ({ ...previous, [key]: toRupiahText(parseRupiah(text)) }));
    clearError(key);
  }

  // Satu karyawan: tampilkan Upah Diterima setelah potongan baru.
  const newTotal = DEDUCTION_FIELDS.reduce((total, { key }) => total + (parseRupiah(values[key]) ?? 0), 0);

  return (
    <FormDialog
      open
      title={single ? `Ubah Potongan — ${single.name}` : `Ubah Potongan ${targets.length} Karyawan`}
      description={
        single
          ? `Jumlah Upah & Tunjangan ${formatRupiah(single.gross)}.`
          : "Isian yang dikosongkan tidak diubah. Yang diisi berlaku untuk semua karyawan terpilih."
      }
      saveLabel={saving ? "Menyimpan..." : "Simpan Potongan"}
      onSave={() => submit(values)}
      onClose={onClose}
    >
      {formError && (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {DEDUCTION_FIELDS.map(({ key, label }) => (
        <TextField
          key={key}
          id={`deduction-${key}`}
          label={`${label} (Rp)`}
          required={single !== null}
          inputMode="numeric"
          value={values[key]}
          onChange={(text) => changeValue(key, text)}
          error={errors[key]}
          disabled={saving}
          placeholder={single ? "0" : "Kosong = tidak diubah"}
        />
      ))}

      {single && (
        <p className="typo-body-s text-fg-secondary">
          Potongan {formatRupiah(newTotal)} · Upah Diterima menjadi{" "}
          <span className="font-medium text-fg-heading">{formatRupiah(single.gross - newTotal)}</span>
        </p>
      )}
    </FormDialog>
  );
}
