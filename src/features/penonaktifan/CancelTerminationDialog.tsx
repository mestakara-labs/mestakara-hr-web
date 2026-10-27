"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { TextAreaField } from "@/components/shared/FormFields";
import { ApiError, apiPost } from "@/lib/http-client";
import type { TerminationResource } from "@/types/api/employee-termination";

interface CancelTerminationDialogProps {
  /** Usulan Berlaku yang dibatalkan. null = dialog tertutup. */
  termination: TerminationResource | null;
  onClose: () => void;
  onCancelled: () => void;
}

/**
 * Dialog BATALKAN USULAN PENONAKTIFAN (yang sudah Berlaku). Alasan wajib.
 * Karyawannya kembali Aktif: jabatan, keanggotaan regu, dan atasan bawahannya dikembalikan.
 */
export function CancelTerminationDialog({ termination, onClose, onCancelled }: CancelTerminationDialogProps) {
  if (!termination) return null;
  return <CancelTerminationDialogContent key={termination.id} termination={termination} onClose={onClose} onCancelled={onCancelled} />;
}

function CancelTerminationDialogContent({
  termination,
  onClose,
  onCancelled,
}: CancelTerminationDialogProps & { termination: TerminationResource }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!reason.trim()) {
      setError("Alasan Pembatalan wajib diisi");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = await apiPost(`/api/employee-terminations/${termination.id}/cancel`, { reason });
      toast.success(response.message);
      onCancelled();
      onClose();
    } catch (cancelError) {
      // 409 = ditolak (mis. karyawannya sudah diaktifkan kembali); pesannya ditampilkan apa adanya.
      setFormError(cancelError instanceof ApiError ? cancelError.message : "Usulan gagal dibatalkan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog
      open
      title="Batalkan Usulan Penonaktifan"
      description={`Usulan penonaktifan ${termination.items.length} karyawan.`}
      saveLabel={saving ? "Membatalkan..." : "Ya, Batalkan Usulan"}
      onSave={handleSave}
      onClose={onClose}
    >
      <Alert variant="warning">
        <AlertDescription>
          <p>
            Usulan ini <strong>sudah berlaku</strong>. Jika dibatalkan, karyawannya kembali <strong>Aktif</strong>: jabatan
            dan keanggotaan regunya dilanjutkan, dan bawahan yang dialihkan dikembalikan ke atasan semula.
          </p>
        </AlertDescription>
      </Alert>
      {formError && (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <TextAreaField
        id="cancel-reason"
        label="Alasan Pembatalan"
        required
        value={reason}
        onChange={(value) => {
          setReason(value);
          setError(null);
        }}
        error={error ?? undefined}
        disabled={saving}
        placeholder="Cth. Karyawan batal mengundurkan diri"
      />
    </FormDialog>
  );
}
