"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mestakara/ui/dialog";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { ApiError, apiPost } from "@/lib/http-client";
import { parsePeriodParam, periodLabel } from "@/lib/period-rules";
import { formatRupiah } from "@/lib/wage-rules";
import type { CopyDeductionsResult } from "@/types/api/payroll";

interface CopyDeductionsDialogProps {
  open: boolean;
  /** Periode tujuan "YYYY-MM" dan namanya */
  period: string;
  periodLabel: string;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Dialog SALIN POTONGAN BULAN LALU:
 *   1. Dibuka -> pratinjau (POST /api/payroll/deductions/copy-previous dengan save: false, TIDAK menyimpan)
 *      "12 karyawan akan disalin dari September 2026 · BPJS Rp 1.200.000 · ..." + daftar namanya
 *   2. [Salin Potongan] -> simpan (save: true)
 * Hanya karyawan yang potongannya bulan ini masih 0 semua; potongan yang sudah diisi tidak ditimpa.
 */
export function CopyDeductionsDialog(props: CopyDeductionsDialogProps) {
  if (!props.open) return null;
  return <CopyDialogContent {...props} />;
}

function CopyDialogContent({ period, periodLabel: label, onClose, onSaved }: CopyDeductionsDialogProps) {
  const [preview, setPreview] = useState<CopyDeductionsResult | null>(null);
  const [busy, setBusy] = useState<"none" | "checking" | "saving">("checking");
  const [error, setError] = useState<string | null>(null);

  // Pratinjau begitu dialog dibuka.
  useEffect(() => {
    // Kalau dialog sudah ditutup sebelum hasil datang, hasilnya diabaikan.
    let isCancelled = false;

    async function check() {
      try {
        const response = await apiPost<CopyDeductionsResult>("/api/payroll/deductions/copy-previous", { period, save: false });
        if (!isCancelled) setPreview(response.data);
      } catch (checkError) {
        if (!isCancelled) setError(checkError instanceof ApiError ? checkError.message : "Pratinjau gagal dimuat.");
      } finally {
        if (!isCancelled) setBusy("none");
      }
    }

    check();
    return () => {
      isCancelled = true;
    };
  }, [period]);

  async function save() {
    setBusy("saving");
    setError(null);
    try {
      const response = await apiPost<CopyDeductionsResult>("/api/payroll/deductions/copy-previous", { period, save: true });
      toast.success(response.message);
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : "Potongan gagal disalin. Silakan coba lagi.");
      setBusy("none");
    }
  }

  // "2026-09" -> "September 2026" (teks aslinya kalau formatnya tidak dikenal).
  const sourcePeriod = preview ? parsePeriodParam(preview.source_period) : null;
  const sourceLabel = sourcePeriod ? periodLabel(sourcePeriod) : (preview?.source_period ?? "");

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && busy === "none" && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salin Potongan Bulan Lalu</DialogTitle>
          <DialogDescription>
            Potongan bulan sebelumnya disalin ke {label}, hanya untuk karyawan yang potongannya bulan ini masih 0. Potongan yang
            sudah diisi tidak ditimpa.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="danger">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {busy === "checking" && (
          <p className="flex items-center gap-2 typo-body-s text-fg-secondary">
            <Spinner /> Memeriksa potongan bulan lalu...
          </p>
        )}
        {preview && preview.employees.length === 0 && (
          <p className="typo-body-s text-fg-secondary">
            Tidak ada yang bisa disalin: tidak ada potongan di {sourceLabel}, atau potongan {label} sudah diisi semua.
          </p>
        )}
        {preview && preview.employees.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-subtle p-3 typo-body-s text-fg-secondary">
            <p>
              <span className="font-medium text-fg-heading">{preview.employees.length} karyawan</span> akan disalin dari{" "}
              {sourceLabel}. BPJS TK/KES {formatRupiah(preview.totals.bpjs)} · PPIP/PPh 21 {formatRupiah(preview.totals.pph21)} ·
              Kebun/Unit {formatRupiah(preview.totals.unit)}
            </p>
            <ul className="max-h-48 overflow-y-auto">
              {preview.employees.map((employee) => (
                <li key={employee.employee_id}>
                  {employee.name} — {formatRupiah(employee.bpjs + employee.pph21 + employee.unit)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy !== "none"}>
            Batal
          </Button>
          <Button type="button" onClick={save} disabled={busy !== "none" || !preview || preview.employees.length === 0}>
            {busy === "saving" && <Spinner />}
            {busy === "saving" ? "Menyalin..." : "Salin Potongan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
