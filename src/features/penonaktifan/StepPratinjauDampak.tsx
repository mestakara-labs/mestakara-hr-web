"use client";

import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { formatDate } from "@/lib/date";
import type { TerminationPreviewResource } from "@/types/api/employee-termination";

import type { PenonaktifanData, PenonaktifanFormValues } from "./penonaktifan-form-values";
import { TerminationImpactList } from "./TerminationImpactList";

interface StepPratinjauDampakProps {
  values: PenonaktifanFormValues;
  data: PenonaktifanData;
  /** Hasil useTerminationPreview (dihitung di wizard supaya dipakai juga di langkah Tinjau) */
  preview: TerminationPreviewResource | null;
  previewError: string | null;
}

/**
 * LANGKAH 3 — PRATINJAU DAMPAK (hanya dilihat, tidak ada yang diubah di sini):
 *
 *   Asep Firmansyah · Mengundurkan Diri · nonaktif mulai 1 Nov 2026
 *     💼 Jabatan diakhiri · 👤 Bawahan dialihkan ke atasan berikutnya · 📅 Keluar dari regu kerja
 */
export function StepPratinjauDampak({ values, data, preview, previewError }: StepPratinjauDampakProps) {
  if (previewError) return <PageError message={previewError} />;
  if (!preview) return <PageLoading label="Menghitung dampak penonaktifan..." />;

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        <Info />
        <AlertDescription>
          <p>
            Perubahan di bawah ini terjadi <strong>otomatis</strong> saat usulan berlaku, dan semuanya dikembalikan kalau
            usulan dibatalkan. Akun login karyawan juga dinonaktifkan pada TMT nonaktif.
          </p>
        </AlertDescription>
      </Alert>

      {values.items.map((item) => {
        const employee = data.employees.find((entry) => entry.id === item.employee_id);
        const impact = preview[item.id];

        return (
          <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div>
              <p className="typo-label-m text-fg-heading">{employee?.name ?? "-"}</p>
              <p className="typo-body-s text-fg-tertiary">
                {item.type} · nonaktif mulai {formatDate(item.effective_date)}
              </p>
            </div>
            {impact ? <TerminationImpactList impact={impact} /> : <p className="typo-body-s text-fg-tertiary">-</p>}
          </div>
        );
      })}
    </div>
  );
}
