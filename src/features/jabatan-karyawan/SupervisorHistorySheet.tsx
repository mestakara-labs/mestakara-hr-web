"use client";

import { ArrowDown } from "lucide-react";
import { Badge } from "@mestakara/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@mestakara/ui/empty";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@mestakara/ui/sheet";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { formatDateTime } from "@/lib/date";
import type { AssignmentResource, AssignmentSupervisor } from "@/types/api/assignment";
import type { SupervisorChangeResource } from "@/types/api/supervisor-change";

import { withStatus } from "./assignment-options";

interface SupervisorHistorySheetProps {
  /** Penugasan yang dilihat riwayatnya. null = panel tertutup. */
  assignment: AssignmentResource | null;
  onClose: () => void;
}

/**
 * Panel samping RIWAYAT ATASAN satu penugasan: setiap perubahan atasan,
 * terbaru di atas.
 *
 *   9 Oktober 2026, 15.15 · Admin SDM          [Manual]
 *   Budi Hidayat (Pengawas Pelayanan I)
 *        ↓
 *   Rina Saepudin (Asisten Operasional I)
 *   "Menyesuaikan pejabat baru"
 */
export function SupervisorHistorySheet({ assignment, onClose }: SupervisorHistorySheetProps) {
  return (
    <Sheet open={assignment !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {assignment && (
          <>
            <SheetHeader>
              <SheetTitle>Riwayat Atasan</SheetTitle>
              <SheetDescription>
                {assignment.employee.name} — {withStatus(assignment.assignment_status, assignment.position.title)}
              </SheetDescription>
            </SheetHeader>

            {/* `key` = data diambil ulang setiap kali panel dibuka untuk penugasan lain. */}
            <HistoryList key={assignment.id} assignmentId={assignment.id} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Daftar perubahan atasan satu penugasan. */
function HistoryList({ assignmentId }: { assignmentId: string }) {
  const { data: history, loading, error } = useApiGet<SupervisorChangeResource[]>(
    `/api/position-assignments/${assignmentId}/supervisor-history`,
  );

  if (loading) return <PageLoading label="Memuat riwayat atasan..." />;
  if (error || !history) return <PageError message={error ?? "Riwayat atasan gagal dimuat."} />;

  if (history.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Belum ada perubahan atasan</EmptyTitle>
          <EmptyDescription>Atasan penugasan ini belum pernah diubah sejak penugasan dibuat.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ol className="flex flex-col gap-3 px-4 pb-6">
      {history.map((change) => (
        <li key={change.id} className="rounded-lg border border-border p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="typo-body-s text-fg-tertiary">
              {formatDateTime(change.changed_at)} · {change.changed_by}
            </p>
            <Badge variant={change.source === "Manual" ? "neutral" : "info"} dot={false}>
              {change.source}
            </Badge>
          </div>

          <SupervisorNames supervisors={change.from} />
          <ArrowDown className="my-1 size-4 text-fg-tertiary" aria-label="diubah menjadi" />
          <SupervisorNames supervisors={change.to} />

          {change.notes && <p className="mt-2 typo-body-s text-fg-secondary">&ldquo;{change.notes}&rdquo;</p>}
        </li>
      ))}
    </ol>
  );
}

/** "Nama (Jabatan)" per atasan, atau "Tanpa atasan". */
function SupervisorNames({ supervisors }: { supervisors: AssignmentSupervisor[] }) {
  if (supervisors.length === 0) return <p className="typo-body-s text-fg-tertiary">Tanpa atasan</p>;

  return (
    <ul className="typo-body-s text-fg-primary">
      {supervisors.map((supervisor) => (
        <li key={supervisor.assignment_id}>
          <span className="font-medium">{supervisor.employee_name}</span>{" "}
          <span className="text-fg-tertiary">({withStatus(supervisor.assignment_status, supervisor.position_title)})</span>
        </li>
      ))}
    </ul>
  );
}
