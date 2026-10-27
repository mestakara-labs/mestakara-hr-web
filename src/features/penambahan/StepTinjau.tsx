"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { DOCUMENT_SCOPE } from "@/lib/activation-rules";
import { formatDate } from "@/lib/date";
import { formatJobGrade } from "@/lib/position-rules";

import type { PenambahanData, PenambahanFormValues } from "./penambahan-form-values";
import type { StatusDocumentFormValues } from "./StatusDocumentFields";

/** "SK No. 812/SDM/2026 · 1 Oktober 2026", atau "Belum ada" kalau kosong. */
function documentText(document: StatusDocumentFormValues): string {
  if (!document.document_type && !document.document_file) return "Belum ada";
  const date = document.document_date ? ` · ${formatDate(document.document_date)}` : "";
  return `${document.document_type || "Dokumen"} No. ${document.document_number || "-"}${date}`;
}

/**
 * LANGKAH 4 — TINJAU & SIMPAN: ringkasan sebelum usulan diberlakukan.
 *
 *   Dokumen: Kolektif — SK No. 812/SDM/2026 · 1 Oktober 2026
 *   No | Karyawan | Dasar Penambahan | TMT Aktif | Dokumen (per orang) | Penempatan
 */
export function StepTinjau({ values, data }: { values: PenambahanFormValues; data: PenambahanData }) {
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
              <TableHead>Dasar Penambahan</TableHead>
              <TableHead>TMT Aktif</TableHead>
              {!isCollective && <TableHead>Dokumen</TableHead>}
              <TableHead>Penempatan</TableHead>
              <TableHead>Job Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {values.items.map((item, index) => {
              const employee = data.employees.find((entry) => entry.id === item.employee_id);
              const position = data.positions.find((entry) => entry.id === item.position_id);
              const subUnit = data.subUnits.find((entry) => entry.id === item.sub_unit_id);

              return (
                <TableRow key={item.id}>
                  <TableCell className="text-fg-tertiary">{index + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium text-fg-heading">{employee?.name ?? "-"}</p>
                    <p className="typo-body-s text-fg-tertiary">{employee?.employment_status}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-fg-primary">{item.type}</p>
                    {item.origin_unit && <p className="typo-body-s text-fg-tertiary">dari {item.origin_unit}</p>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-fg-primary">{formatDate(item.effective_date)}</TableCell>
                  {!isCollective && <TableCell className="text-fg-secondary">{documentText(item)}</TableCell>}
                  <TableCell>
                    {item.has_placement ? (
                      <>
                        <p className="text-fg-primary">
                          {item.assignment_status} {position?.title ?? "-"}
                        </p>
                        <p className="typo-body-s text-fg-tertiary">{subUnit?.name ?? "-"}</p>
                      </>
                    ) : (
                      <span className="text-fg-tertiary">Belum ditempatkan</span>
                    )}
                  </TableCell>
                  <TableCell className="text-fg-primary">
                    {formatJobGrade(item.has_placement ? position?.job_grade : null)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
