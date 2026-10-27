import { Badge, type BadgeProps } from "@mestakara/ui/badge";

import { getAssignmentStatusLabel } from "@/lib/assignment-rules";

/** Warna badge setiap status jabatan. */
const VARIANT_BY_STATUS: Record<string, BadgeProps["variant"]> = {
  Definitif: "success",
  Penugasan: "info",
  Pj: "brand",
  Plt: "warning",
  Plh: "outline",
  Ptr: "premium",
};

/** Label status jabatan berwarna, mis. "Plt". Arahkan kursor untuk melihat kepanjangannya. */
export function AssignmentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT_BY_STATUS[status] ?? "neutral"} dot={false} title={getAssignmentStatusLabel(status)}>
      {status}
    </Badge>
  );
}
