"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import type { StatusDocumentFormValues } from "@/features/penambahan/StatusDocumentFields";
import { DOCUMENT_SCOPE } from "@/lib/activation-rules";
import { formatDate } from "@/lib/date";
import { formatJobGrade } from "@/lib/position-rules";
import type { TerminationImpact, TerminationPreviewResource } from "@/types/api/employee-termination";

import type { PenonaktifanData, PenonaktifanFormValues } from "./penonaktifan-form-values";

/** "SK No. 812/SDM/2026 · 1 Oktober 2026". */
function documentText(document: StatusDocumentFormValues): string {
  const date = document.document_date ? ` · ${formatDate(document.document_date)}` : "";
  return `${document.document_type || "Dokumen"} No. ${document.document_number || "-"}${date}`;
}

/** "1 jabatan · 2 bawahan · 1 regu", atau "Tidak ada". */
export function impactText(impact: TerminationImpact | undefined | null): string {
  if (!impact) return "-";
  const parts = [
    impact.ended_assignments.length > 0 && `${impact.ended_assignments.length} jabatan`,
    impact.subordinates.length > 0 && `${impact.subordinates.length} bawahan`,
    impact.memberships.length > 0 && `${impact.memberships.length} regu`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Tidak ada";
}

interface StepTinjauPenonaktifanProps {
  values: PenonaktifanFormValues;
  data: PenonaktifanData;
  preview: TerminationPreviewResource | null;
}

/**
 * LANGKAH 4 — TINJAU & SIMPAN: ringkasan sebelum usulan diberlakukan.
 *
 *   Dokumen: Kolektif — SK No. 812/SDM/2026 · 1 Oktober 2026
 *   No | Karyawan | Jenis | TMT Nonaktif | Keterangan | Dokumen (per orang) | Dampak
 */
export function StepTinjauPenonaktifan({ values, data, preview }: StepTinjauPenonaktifanProps) {
  const isCollective = values.document_scope === DOCUMENT_SCOPE.collective;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-subtle p-4 typo-body-m">
        <p className="text-fg-secondary">
          Dokumen dasar: <strong className="text-fg-heading">{values.document_scope}</strong>
          {isCollective && <> — {documentText(values)}</>}
        </p>
        <p className="mt-1 text-fg-secondary">
          Jumlah karyawan: <strong className="text-fg-heading">{values.items.length} orang</strong>
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-240">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Karyawan</TableHead>
              <TableHead>Job Grade</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>TMT Nonaktif</TableHead>
              <TableHead>Keterangan</TableHead>
              {!isCollective && <TableHead>Dokumen</TableHead>}
              <TableHead>Dampak</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {values.items.map((item, index) => {
              const employee = data.employees.find((entry) => entry.id === item.employee_id);
              const description = [item.destination_unit && `Ke ${item.destination_unit}`, item.reason].filter(Boolean).join(" · ");

              return (
                <TableRow key={item.id}>
                  <TableCell className="text-fg-tertiary">{index + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium text-fg-heading">{employee?.name ?? "-"}</p>
                    <p className="typo-body-s text-fg-tertiary">{employee?.position?.title ?? "Belum ditempatkan"}</p>
                  </TableCell>
                  <TableCell className="text-fg-primary">{formatJobGrade(employee?.position?.job_grade)}</TableCell>
                  <TableCell className="text-fg-primary">{item.type}</TableCell>
                  <TableCell className="whitespace-nowrap text-fg-primary">{formatDate(item.effective_date)}</TableCell>
                  <TableCell className="max-w-72 whitespace-normal text-fg-secondary">{description || "-"}</TableCell>
                  {!isCollective && <TableCell className="text-fg-secondary">{documentText(item)}</TableCell>}
                  <TableCell className="text-fg-secondary">{impactText(preview?.[item.id])}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
