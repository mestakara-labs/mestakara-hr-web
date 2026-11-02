"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { SelectField, TextAreaField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { SOURCE_LABELS, type AttendanceCodeInfo } from "@/lib/attendance-rules";
import { formatDate, formatDayName } from "@/lib/date";
import { apiPut } from "@/lib/http-client";
import { requireText } from "@/lib/validation";
import type { AttendanceCorrectionPayload, AttendanceDayDetail } from "@/types/api/attendance";

/** Tanggal yang dikoreksi. */
export interface CorrectionTarget {
  employeeId: string;
  employeeName: string;
  day: AttendanceDayDetail;
}

interface AttendanceCorrectionDialogProps {
  /** null = dialog tertutup */
  target: CorrectionTarget | null;
  /** Kode yang boleh dipilih (karyawan Daily Worker: tanpa DW) */
  codes: AttendanceCodeInfo[];
  onClose: () => void;
  onSaved: () => void;
}

/** Isian dialog: kode "" = kosongkan (tidak masuk). */
interface CorrectionFormValues {
  status_code: string;
  reason: string;
}

/**
 * Dialog KOREKSI MANUAL kode satu tanggal:
 *
 *   ┌ Koreksi Absensi — Asep · Senin, 5 Oktober 2026 ─────────── × ┐
 *   │ Kode sekarang: K (dari Excel)                                 │
 *   │ Kode Baru [S — Sakit ▾]      (pilihan kosong = tidak masuk)   │
 *   │ Alasan *  [Surat dokter menyusul]                             │
 *   │                                           [Batal] [Simpan]    │
 *   └───────────────────────────────────────────────────────────────┘
 *
 * Koreksi manual punya prioritas TERTINGGI: tidak tertimpa unggah Excel maupun aplikasi mobile.
 * Setiap koreksi tercatat di jejak perubahan.
 */
export function AttendanceCorrectionDialog(props: AttendanceCorrectionDialogProps) {
  if (!props.target) return null;
  // `key` = isian diisi ulang setiap kali dibuka untuk tanggal lain.
  return <CorrectionDialogContent key={props.target.day.date} {...props} target={props.target} />;
}

function CorrectionDialogContent({
  target,
  codes,
  onClose,
  onSaved,
}: AttendanceCorrectionDialogProps & { target: CorrectionTarget }) {
  const { day } = target;
  const [values, setValues] = useState<CorrectionFormValues>({ status_code: day.status_code ?? "", reason: "" });

  const { submit, clearError, saving, errors, formError } = useFormSubmit<CorrectionFormValues>({
    validate: (form) => ({
      status_code: form.status_code === (day.status_code ?? "") ? "Pilih kode yang berbeda dari kode sekarang" : undefined,
      reason: requireText(form.reason, "Alasan"),
    }),
    onSubmit: async (form) => {
      const payload: AttendanceCorrectionPayload = {
        date: day.date,
        status_code: form.status_code || null,
        reason: form.reason.trim(),
      };
      await apiPut(`/api/employees/${target.employeeId}/attendance`, payload);

      toast.success(`Absensi ${target.employeeName} tanggal ${formatDate(day.date)} berhasil dikoreksi`);
      onSaved();
      onClose();
    },
  });

  /** Ubah satu isian, sekaligus hapus pesan error isian itu. */
  function changeValue(key: keyof CorrectionFormValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  const currentText = day.status_code
    ? `${day.status_code}${day.source ? ` (dari ${SOURCE_LABELS[day.source]})` : ""}`
    : "kosong (tidak masuk)";

  return (
    <FormDialog
      open
      title={`Koreksi Absensi — ${target.employeeName}`}
      description={`${formatDayName(day.date)}, ${formatDate(day.date)}. Kode sekarang: ${currentText}.`}
      saveLabel={saving ? "Menyimpan..." : "Simpan Koreksi"}
      onSave={() => submit(values)}
      onClose={onClose}
    >
      {formError && (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <SelectField
        id="status_code"
        label="Kode Baru"
        options={codes.map(({ code, label }) => ({ value: code, label: `${code} — ${label}` }))}
        emptyLabel="Kosong (tidak masuk)"
        value={values.status_code}
        onChange={(value) => changeValue("status_code", value)}
        error={errors.status_code}
        disabled={saving}
        note="hanya K yang dibayar."
      />
      <TextAreaField
        id="reason"
        label="Alasan"
        required
        value={values.reason}
        onChange={(value) => changeValue("reason", value)}
        error={errors.reason}
        disabled={saving}
        placeholder="Cth. Salah input di file Excel; seharusnya Sakit"
        note="koreksi manual tidak akan tertimpa unggahan Excel maupun aplikasi mobile."
      />
    </FormDialog>
  );
}
