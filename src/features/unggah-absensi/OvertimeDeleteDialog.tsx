"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { TextAreaField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiDelete } from "@/lib/http-client";
import { formatDate } from "@/lib/date";
import { requireText } from "@/lib/validation";
import type { OvertimeEntryRow } from "@/types/api/attendance";

interface OvertimeDeleteDialogProps {
  /** Baris yang dihapus. null = dialog tertutup. */
  target: OvertimeEntryRow | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Dialog HAPUS SATU BARIS LEMBUR, alasan wajib (tercatat di jejak perubahan):
 *
 *   Hapus Lembur — A. Rohman · 8 Oktober 2026, 17:00–18:30
 *   Alasan * [.....]                         [Batal] [Hapus Baris]
 *
 * Alasan dikirim di alamat (?reason=) karena permintaan DELETE tidak membawa isi.
 */
export function OvertimeDeleteDialog(props: OvertimeDeleteDialogProps) {
  if (!props.target) return null;
  return <OvertimeDeleteDialogContent key={props.target.id} {...props} target={props.target} />;
}

function OvertimeDeleteDialogContent({ target, onClose, onSaved }: OvertimeDeleteDialogProps & { target: OvertimeEntryRow }) {
  const [reason, setReason] = useState("");

  const { submit, clearError, saving, errors, formError } = useFormSubmit<{ reason: string }>({
    validate: (form) => ({ reason: requireText(form.reason, "Alasan") }),
    onSubmit: async (form) => {
      const response = await apiDelete(`/api/overtime-entries/${target.id}?${new URLSearchParams({ reason: form.reason.trim() })}`);
      toast.success(response.message);
      onSaved();
      onClose();
    },
  });

  return (
    <FormDialog
      open
      title={`Hapus Lembur — ${target.employee.name}`}
      description={`${formatDate(target.date)}, ${target.start_time}–${target.end_time}. Baris yang dihapus tidak ikut dihitung di Daftar Upah.`}
      saveLabel={saving ? "Menghapus..." : "Hapus Baris"}
      onSave={() => submit({ reason })}
      onClose={onClose}
    >
      {formError && (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <TextAreaField
        id="delete_reason"
        label="Alasan"
        required
        value={reason}
        onChange={(value) => {
          setReason(value);
          clearError("reason");
        }}
        error={errors.reason}
        disabled={saving}
        placeholder="Cth. Lembur dibatalkan, tidak ada SPKL"
        note="tercatat di jejak perubahan."
      />
    </FormDialog>
  );
}
