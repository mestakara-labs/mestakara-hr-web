import type { ReactNode } from "react";
import { ArrowRight, Briefcase, CalendarDays, UserRound, type LucideIcon } from "lucide-react";

import { formatDate } from "@/lib/date";
import type { AssignmentSupervisor } from "@/types/api/assignment";
import type { TerminationImpact } from "@/types/api/employee-termination";

/** "Rina (Manager), Budi (Asisten)", atau "Tanpa atasan". */
function supervisorNames(supervisors: AssignmentSupervisor[]): string {
  if (supervisors.length === 0) return "Tanpa atasan";
  return supervisors.map((supervisor) => `${supervisor.employee_name} (${supervisor.position_title})`).join(", ");
}

/**
 * DAMPAK PENONAKTIFAN satu karyawan (hanya dilihat):
 *
 *   💼 Jabatan diakhiri     Definitif Asisten Verifikasi — Kantor Induk · s.d. 31 Okt 2026
 *   👤 Bawahan dialihkan    Agus (Admin I Verifikasi): Euis → Rina (Manager)
 *   📅 Regu ditinggalkan    House Keeping Gunung Mas · terakhir 31 Okt 2026
 */
export function TerminationImpactList({ impact }: { impact: TerminationImpact }) {
  const isEmpty =
    impact.ended_assignments.length === 0 && impact.subordinates.length === 0 && impact.memberships.length === 0;
  if (isEmpty) return <p className="typo-body-s text-fg-tertiary">Tidak ada jabatan, bawahan, atau regu yang terdampak.</p>;

  return (
    <div className="flex flex-col gap-3 typo-body-s">
      <ImpactGroup icon={Briefcase} title="Jabatan diakhiri" count={impact.ended_assignments.length}>
        {impact.ended_assignments.map((item) => (
          <li key={item.assignment_id}>
            <span className="text-fg-primary">
              {item.assignment_status} {item.position_title}
            </span>{" "}
            <span className="text-fg-tertiary">
              — {item.sub_unit_name} · s.d. {formatDate(item.end_date)}
            </span>
          </li>
        ))}
      </ImpactGroup>

      <ImpactGroup icon={UserRound} title="Bawahan dialihkan ke atasan berikutnya" count={impact.subordinates.length}>
        {impact.subordinates.map((item) => (
          <li key={item.assignment_id}>
            <span className="text-fg-primary">{item.employee_name}</span>{" "}
            <span className="text-fg-tertiary">({item.position_title})</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1 text-fg-secondary">
              {supervisorNames(item.from)}
              <ArrowRight className="size-3.5 shrink-0" />
              <strong className="font-medium text-fg-heading">{supervisorNames(item.to)}</strong>
            </span>
          </li>
        ))}
      </ImpactGroup>

      <ImpactGroup icon={CalendarDays} title="Keluar dari regu kerja" count={impact.memberships.length}>
        {impact.memberships.map((item) => (
          <li key={item.member_id}>
            <span className="text-fg-primary">{item.group_name}</span>{" "}
            <span className="text-fg-tertiary">· tanggal terakhir {formatDate(item.end_date)}</span>
          </li>
        ))}
      </ImpactGroup>
    </div>
  );
}

/** Satu kelompok dampak; tidak tampil kalau kosong. */
function ImpactGroup({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: LucideIcon;
  title: string;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-fg-tertiary" />
      <div className="min-w-0">
        <p className="typo-label-m text-fg-heading">
          {title} ({count})
        </p>
        <ul className="mt-1 flex flex-col gap-1.5">{children}</ul>
      </div>
    </div>
  );
}
