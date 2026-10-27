"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { TextAreaField } from "@/components/shared/FormFields";
import { ApiError, apiPost } from "@/lib/http-client";
import type { ActivationResource } from "@/types/api/employee-activation";

interface CancelActivationDialogProps {
  /** Usulan Berlaku yang dibatalkan. null = dialog tertutup. */
  activation: ActivationResource | null;
  onClose: () => void;
  onCancelled: () => void;
}

/**
 * Dialog BATALKAN USULAN PENAMBAHAN (yang sudah Berlaku). Alasan wajib.
 * Karyawannya kembali Belum Aktif (atau Nonaktif), dan penugasan yang dibuat usulan ini dihapus.
 */
export function CancelActivationDialog({ activation, onClose, onCancelled }: CancelActivationDialogProps) {
  if (!activation) return null;
  return <CancelActivationDialogContent key={activation.id} activation={activation} onClose={onClose} onCancelled={onCancelled} />;
}

function CancelActivationDialogContent({
  activation,
  onClose,
  onCancelled,
}: CancelActivationDialogProps & { activation: ActivationResource }) {
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
      const response = await apiPost(`/api/employee-activations/${activation.id}/cancel`, { reason });
      toast.success(response.message);
      onCancelled();
      onClose();
    } catch (cancelError) {
      // 409 = ditolak (mis. karyawannya sudah dimutasi lagi); pesannya ditampilkan apa adanya.
      setFormError(cancelError instanceof ApiError ? cancelError.message : "Usulan gagal dibatalkan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog
      open
      title="Batalkan Usulan Penambahan"
      description={`Usulan penambahan ${activation.items.length} karyawan.`}
      saveLabel={saving ? "Membatalkan..." : "Ya, Batalkan Usulan"}
      onSave={handleSave}
      onClose={onClose}
    >
      <Alert variant="warning">
        <AlertDescription>
          <p>
            Usulan ini <strong>sudah berlaku</strong>. Jika dibatalkan, karyawannya kembali <strong>Belum Aktif</strong>{" "}
            (atau Nonaktif untuk karyawan yang kembali), dan jabatan yang dibuat dari usulan ini dihapus. Data karyawannya
            tetap tersimpan.
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
        placeholder="Cth. Calon karyawan mengundurkan diri sebelum mulai bekerja"
      />
    </FormDialog>
  );
}
