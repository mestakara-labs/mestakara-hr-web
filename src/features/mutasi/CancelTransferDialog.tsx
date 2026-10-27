"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { TextAreaField } from "@/components/shared/FormFields";
import { ApiError, apiPost } from "@/lib/http-client";
import { TRANSFER_STATUS } from "@/lib/transfer-rules";
import type { TransferResource } from "@/types/api/transfer";

interface CancelTransferDialogProps {
  /** Usulan yang dibatalkan. null = dialog tertutup. */
  transfer: TransferResource | null;
  onClose: () => void;
  onCancelled: () => void;
}

/**
 * Dialog BATALKAN USULAN.
 *   - Menunggu Dokumen -> alasan opsional; tidak ada data yang perlu dipulihkan
 *   - Berlaku          -> alasan WAJIB; penugasan baru dihapus, penugasan lama aktif lagi,
 *                         atasan yang dialihkan dikembalikan
 */
export function CancelTransferDialog({ transfer, onClose, onCancelled }: CancelTransferDialogProps) {
  if (!transfer) return null;
  return <CancelTransferDialogContent key={transfer.id} transfer={transfer} onClose={onClose} onCancelled={onCancelled} />;
}

function CancelTransferDialogContent({
  transfer,
  onClose,
  onCancelled,
}: CancelTransferDialogProps & { transfer: TransferResource }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEffective = transfer.status === TRANSFER_STATUS.effective;

  async function handleSave() {
    if (isEffective && !reason.trim()) {
      setError("Alasan Pembatalan wajib diisi");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const response = await apiPost(`/api/transfers/${transfer.id}/cancel`, { reason });
      toast.success(response.message);
      onCancelled();
      onClose();
    } catch (cancelError) {
      // 409 = pembatalan ditolak (mis. karyawannya sudah dimutasi lagi); pesannya ditampilkan apa adanya.
      setFormError(cancelError instanceof ApiError ? cancelError.message : "Usulan gagal dibatalkan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog
      open
      title="Batalkan Usulan Mutasi"
      description={`Usulan ${transfer.decree_number ?? ""} (${transfer.type}, ${transfer.items.length} karyawan)`}
      saveLabel={saving ? "Membatalkan..." : "Ya, Batalkan Usulan"}
      onSave={handleSave}
      onClose={onClose}
    >
      <Alert variant={isEffective ? "warning" : "info"}>
        <AlertDescription>
          {isEffective ? (
            <p>
              Usulan ini <strong>sudah berlaku</strong>. Jika dibatalkan, jabatan baru dari usulan ini dihapus, jabatan
              lama karyawan diaktifkan lagi, dan atasan yang dialihkan otomatis dikembalikan.
            </p>
          ) : (
            <p>Usulan ini belum berlaku, jadi tidak ada jabatan karyawan yang berubah.</p>
          )}
        </AlertDescription>
      </Alert>

      {formError && (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <TextAreaField
        id="cancel_reason"
        label="Alasan Pembatalan"
        required={isEffective}
        value={reason}
        onChange={(value) => {
          setReason(value);
          setError(null);
        }}
        error={error ?? undefined}
        disabled={saving}
        placeholder="Cth. Terdapat kesalahan nama karyawan pada SK"
      />
    </FormDialog>
  );
}
