"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDialog } from "@/components/shared/FormDialog";
import { TextAreaField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { ApiError, apiPost } from "@/lib/http-client";
import { readinessItems } from "@/lib/payroll-rules";
import { requireText } from "@/lib/validation";
import type { PayrollReadiness } from "@/types/api/payroll";

interface LockDialogProps {
  open: boolean;
  period: string;
  periodLabel: string;
  readiness: PayrollReadiness;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Konfirmasi KUNCI PERIODE. Setelah dikunci:
 *   - angka Daftar Upah & penanda tangan dibekukan (potret)
 *   - unggah absensi, koreksi, lembur, rekomendasi DW, dan potongan periode ini tidak bisa diubah
 * Hal yang belum beres di Kesiapan disebutkan lagi, tapi tidak menghalangi.
 */
export function LockPeriodDialog({ open, period, periodLabel, readiness, onClose, onSaved }: LockDialogProps) {
  const problems = readinessItems(readiness).filter((item) => !item.ok);

  async function lock() {
    try {
      const response = await apiPost("/api/payroll/lock", { period });
      toast.success(response.message);
      onSaved();
    } catch (error) {
      toast.error("Periode gagal dikunci", {
        description: error instanceof ApiError ? error.message : "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      onClose();
    }
  }

  return (
    <ConfirmDialog
      open={open}
      icon={Lock}
      tone="warning"
      title={`Kunci Daftar Upah ${periodLabel}?`}
      description={
        <>
          Angka dan penanda tangan akan dibekukan. Absensi, lembur, dan potongan periode ini tidak bisa diubah lagi sampai kuncinya
          dibuka.
          {problems.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-left">
              {problems.map((item) => (
                <li key={item.text}>{item.text}</li>
              ))}
            </ul>
          )}
        </>
      }
      confirmLabel="Ya, Kunci Periode"
      cancelLabel="Periksa Lagi"
      onConfirm={lock}
      onCancel={onClose}
    />
  );
}

interface UnlockDialogProps {
  open: boolean;
  period: string;
  periodLabel: string;
  onClose: () => void;
  onSaved: () => void;
}

/** Dialog BUKA KUNCI: alasan wajib (tercatat di riwayat kunci). Angka akan dihitung ulang dari data terbaru. */
export function UnlockPeriodDialog(props: UnlockDialogProps) {
  if (!props.open) return null;
  return <UnlockDialogContent {...props} />;
}

function UnlockDialogContent({ period, periodLabel, onClose, onSaved }: UnlockDialogProps) {
  const [reason, setReason] = useState("");

  const { submit, clearError, saving, errors, formError } = useFormSubmit<{ reason: string }>({
    validate: (form) => ({ reason: requireText(form.reason, "Alasan") }),
    onSubmit: async (form) => {
      const response = await apiPost("/api/payroll/unlock", { period, reason: form.reason.trim() });
      toast.success(response.message);
      onSaved();
      onClose();
    },
  });

  return (
    <FormDialog
      open
      title={`Buka Kunci Daftar Upah ${periodLabel}`}
      description="Setelah dibuka, angka dihitung ulang dari data terbaru dan absensi, lembur, serta potongan bisa diubah lagi."
      saveLabel={saving ? "Membuka..." : "Buka Kunci"}
      onSave={() => submit({ reason })}
      onClose={onClose}
    >
      {formError && (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <TextAreaField
        id="unlock_reason"
        label="Alasan"
        required
        value={reason}
        onChange={(value) => {
          setReason(value);
          clearError("reason");
        }}
        error={errors.reason}
        disabled={saving}
        placeholder="Cth. Ada koreksi absensi dari Sub Unit Malabar"
        note="tercatat di riwayat kunci periode."
      />
    </FormDialog>
  );
}
