"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { FieldLegend, FieldSet } from "@mestakara/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { withStatus } from "@/features/jabatan-karyawan/assignment-options";
import { formatDate } from "@/lib/date";
import { formatJobGrade } from "@/lib/position-rules";
import { formatSigner, SIGNER_SOURCE, type SignerValues } from "@/lib/signer-rules";
import { DOCUMENT_MODE, toStatusDocument } from "@/lib/transfer-rules";
import type { TransferPreviewResource } from "@/types/api/transfer";

import type { MutasiFormValues, WizardData } from "./mutasi-form-values";
import { SupervisorChangeList } from "./SupervisorChangeList";

interface StepTinjauProps {
  values: MutasiFormValues;
  data: WizardData;
  /** Perkiraan perubahan atasan dari server. null = sedang dihitung. */
  preview: TransferPreviewResource | null;
}

/**
 * LANGKAH 4 — TINJAU & SIMPAN (hanya menampilkan, tidak ada isian)
 *
 *   Ringkasan usulan       jenis, TMT, dokumen dasar, nomor & tanggal SK, penandatangan, cara dokumen
 *   Perubahan jabatan      tabel: karyawan | dari | ke | tempat | atasan
 *   Perubahan atasan       bawahan yang atasannya dialihkan otomatis
 */
export function StepTinjau({ values, data, preview }: StepTinjauProps) {
  const nameOf = (employeeId: string) => data.employees.find((item) => item.id === employeeId)?.name ?? "-";
  const fromGrade = (assignmentId: string) => data.assignments.find((item) => item.id === assignmentId)?.position.job_grade;
  const assignmentLabel = (assignmentId: string) => {
    const assignment = data.assignments.find((item) => item.id === assignmentId);
    return assignment ? withStatus(assignment.assignment_status, assignment.position.title) : "-";
  };
  /** Isian penandatangan -> "Nama, Jabatan — Asal" (Unit: diambil dari penugasannya). */
  const signerText = (signer: SignerValues) => {
    if (!signer.signer_source) return "-";
    if (signer.signer_source !== SIGNER_SOURCE.unit) {
      return formatSigner({ name: signer.signer_name, position_title: signer.signer_position, source: signer.signer_source });
    }
    const assignment = data.assignments.find((item) => item.id === signer.signer_assignment_id);
    return assignment
      ? formatSigner({ name: assignment.employee.name, position_title: assignment.position.title, source: SIGNER_SOURCE.unit })
      : "-";
  };
  const basisSigner = toStatusDocument(values);

  return (
    <div className="flex flex-col gap-6">
      <Alert variant={values.document_mode === DOCUMENT_MODE.upload ? "success" : "warning"}>
        <Info />
        <AlertDescription>
          {values.document_mode === DOCUMENT_MODE.upload ? (
            <p>
              Scan SK sudah diunggah. Setelah disimpan, usulan <strong>langsung berlaku</strong>: jabatan baru dibuat,
              jabatan lama diakhiri, dan atasan dialihkan otomatis.
            </p>
          ) : (
            <p>
              Setelah disimpan, usulan berstatus <strong>Menunggu Dokumen</strong>. Penugasan baru{" "}
              <strong>belum berlaku</strong> sampai scan SK yang ditandatangani diunggah.
            </p>
          )}
        </AlertDescription>
      </Alert>

      {/* Ringkasan */}
      <FieldSet>
        <FieldLegend>Ringkasan Usulan</FieldLegend>
        <dl className="grid gap-x-6 gap-y-2 rounded-lg border border-border p-4 typo-body-s sm:grid-cols-[auto_1fr]">
          <SummaryRow label="Jenis Mutasi">{values.type}</SummaryRow>
          <SummaryRow label="TMT Berlaku">{formatDate(values.effective_date) || "-"}</SummaryRow>
          <SummaryRow label="Dokumen Dasar">
            {values.basis_document_file ? (
              <>
                {values.basis_document_type} No. {values.basis_document_number}, {formatDate(values.basis_document_date)}
                {basisSigner.signer_source && (
                  <span className="block text-fg-tertiary">Ditandatangani {signerText(basisSigner)}</span>
                )}
              </>
            ) : (
              <span className="text-fg-warning">Tidak diunggah</span>
            )}
          </SummaryRow>
          <SummaryRow label="Nomor SK">{values.decree_number || "-"}</SummaryRow>
          <SummaryRow label="Tanggal SK">{formatDate(values.decree_date) || "-"}</SummaryRow>
          <SummaryRow label="Penandatangan SK">{signerText(values)}</SummaryRow>
          <SummaryRow label="Dokumen">
            {values.document_mode === DOCUMENT_MODE.upload ? "Scan SK diunggah" : "SK dibuat dari template"}
          </SummaryRow>
          {values.notes && <SummaryRow label="Keterangan">{values.notes}</SummaryRow>}
        </dl>
      </FieldSet>

      {/* Perubahan jabatan. min-w-0: tabel yang lebar digeser di dalam kotaknya, bukan melebarkan halaman. */}
      <FieldSet className="min-w-0">
        <FieldLegend>Perubahan Jabatan ({values.items.length} karyawan)</FieldLegend>
        <div className="overflow-hidden rounded-lg border border-border">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Dari</TableHead>
                <TableHead>Ke</TableHead>
                <TableHead>Job Grade</TableHead>
                <TableHead>Tempat Tugas</TableHead>
                <TableHead>Atasan Langsung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {values.items.map((item) => {
                const position = data.positions.find((entry) => entry.id === item.position_id);
                const subUnit = data.subUnits.find((entry) => entry.id === item.sub_unit_id)?.name ?? "-";
                const objects = data.placementObjects
                  .filter((entry) => item.placement_object_ids.includes(entry.id))
                  .map((entry) => entry.name)
                  .join(", ");

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-fg-heading">{nameOf(item.employee_id)}</TableCell>
                    <TableCell className="text-fg-secondary">
                      {item.from_assignment_id ? assignmentLabel(item.from_assignment_id) : "Belum memiliki jabatan"}
                    </TableCell>
                    <TableCell className="text-fg-heading">
                      {withStatus(item.assignment_status, position?.title ?? "-")}
                      {item.end_date && (
                        <p className="typo-body-s text-fg-tertiary">s.d. {formatDate(item.end_date)}</p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-fg-primary">
                      {item.from_assignment_id ? `${formatJobGrade(fromGrade(item.from_assignment_id))} → ` : ""}
                      {formatJobGrade(position?.job_grade)}
                    </TableCell>
                    <TableCell className="text-fg-secondary">{objects ? `${subUnit} · ${objects}` : subUnit}</TableCell>
                    <TableCell className="text-fg-secondary">
                      {item.supervisor_assignment_ids.map((id) => {
                        const supervisor = data.assignments.find((entry) => entry.id === id);
                        return <p key={id}>{supervisor?.employee.name ?? "-"}</p>;
                      })}
                      {item.supervisor_assignment_ids.length === 0 && "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </FieldSet>

      {/* Perubahan atasan otomatis */}
      <FieldSet>
        <FieldLegend>Perubahan Atasan Otomatis</FieldLegend>
        {preview ? (
          <SupervisorChangeList
            changes={preview.supervisor_changes}
            emptyText="Tidak ada bawahan yang atasannya berubah karena usulan ini."
          />
        ) : (
          <p className="typo-body-s text-fg-tertiary">Menghitung perubahan atasan...</p>
        )}
      </FieldSet>
    </div>
  );
}

/** Satu baris ringkasan: "Label   isi". */
function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-fg-tertiary">{label}</dt>
      <dd className="font-medium text-fg-primary">{children}</dd>
    </>
  );
}
