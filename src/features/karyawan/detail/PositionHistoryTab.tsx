"use client";

import { useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { AssignmentPeriodBadge } from "@/features/jabatan-karyawan/AssignmentPeriodBadge";
import { AssignmentStatusBadge } from "@/features/jabatan-karyawan/AssignmentStatusBadge";
import { SupervisorHistorySheet } from "@/features/jabatan-karyawan/SupervisorHistorySheet";
import { BrmLevelBadge } from "@/features/jabatan/BrmLevelBadge";
import { formatDate } from "@/lib/date";
import { formatJobGrade } from "@/lib/position-rules";
import type { AssignmentResource } from "@/types/api/assignment";

import { EmptyText, FileLink } from "./DetailParts";

/**
 * Tab HISTORI JABATAN di detail karyawan: semua penugasan karyawan ini
 * (aktif, akan datang, dan yang sudah selesai), terbaru di atas.
 *
 *   Jabatan & BRM | Status | Tempat Tugas | Atasan | Masa Tugas | Dokumen | [Riwayat Atasan]
 *
 * Penambahan/perubahan jabatan dilakukan lewat Mutasi & Penempatan.
 */
export function PositionHistoryTab({ assignments }: { assignments: AssignmentResource[] }) {
  // Penugasan yang sedang dilihat riwayat atasannya (panel samping). null = panel tertutup.
  const [historyOf, setHistoryOf] = useState<AssignmentResource | null>(null);

  if (assignments.length === 0) {
    return <EmptyText>Belum pernah ditempatkan. Penempatan diatur lewat menu Mutasi &amp; Penempatan.</EmptyText>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-260">
          <TableHeader>
            <TableRow>
              <TableHead>Jabatan</TableHead>
              <TableHead>Job Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tempat Tugas</TableHead>
              <TableHead>Atasan Langsung</TableHead>
              <TableHead>Masa Tugas</TableHead>
              <TableHead>Dokumen</TableHead>
              <TableHead className="w-16">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <p className="font-medium text-fg-heading">{assignment.position.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <BrmLevelBadge level={assignment.position.brm_level} />
                    {assignment.position.division_name && (
                      <span className="typo-body-s text-fg-tertiary">{assignment.position.division_name}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-fg-primary">{formatJobGrade(assignment.position.job_grade)}</TableCell>
                <TableCell>
                  <AssignmentStatusBadge status={assignment.assignment_status} />
                </TableCell>
                <TableCell>
                  <p className="text-fg-primary">{assignment.sub_unit.name}</p>
                  {assignment.placement_objects.length > 0 && (
                    <p className="typo-body-s text-fg-tertiary">
                      {assignment.placement_objects.map((item) => item.name).join(", ")}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {assignment.supervisors.length === 0 ? (
                    <span className="text-fg-tertiary">-</span>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {assignment.supervisors.map((supervisor) => (
                        <li key={supervisor.assignment_id}>
                          <p className="text-fg-primary">{supervisor.employee_name}</p>
                          <p className="typo-body-s text-fg-tertiary">{supervisor.position_title}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
                <TableCell>
                  <AssignmentPeriodBadge {...assignment} />
                </TableCell>
                <TableCell>
                  <DecreeCell assignment={assignment} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setHistoryOf(assignment)}
                    title="Riwayat Atasan"
                    aria-label={`Riwayat atasan ${assignment.position.title}`}
                  >
                    <History />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SupervisorHistorySheet assignment={historyOf} onClose={() => setHistoryOf(null)} />
    </>
  );
}

/**
 * Dokumen dasar penugasan:
 *
 *   2A44/P/2026.10.01-031
 *   SK · 1 Oktober 2026
 *   📄 Lihat dokumen   Lihat usulan mutasi
 */
function DecreeCell({ assignment }: { assignment: AssignmentResource }) {
  const { decree_number, decree_type, decree_date, decree_file, decree_file_url, transfer } = assignment;
  if (!decree_number) return <span className="text-fg-tertiary">-</span>;

  return (
    <div className="flex flex-col gap-0.5">
      <p className="typo-label-m whitespace-nowrap text-fg-primary">{decree_number}</p>
      <p className="typo-body-s text-fg-tertiary">
        {decree_type ?? "Dokumen"}
        {decree_date && ` · ${formatDate(decree_date)}`}
      </p>
      <div className="flex flex-wrap gap-x-3 typo-body-s">
        {decree_file && decree_file_url && <FileLink href={decree_file_url} label="Lihat dokumen" />}
        {/* Penugasan hasil mutasi: link ke usulan mutasinya */}
        {transfer && (
          <Link href={`/dashboard/mutasi/${transfer.id}`} className="font-medium text-fg-brand hover:underline">
            Lihat usulan mutasi
          </Link>
        )}
      </div>
    </div>
  );
}
