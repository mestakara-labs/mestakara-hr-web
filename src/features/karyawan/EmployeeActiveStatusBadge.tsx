import { Badge, type BadgeProps } from "@mestakara/ui/badge";

/** Warna badge status kepegawaian karyawan. */
const VARIANT_BY_STATUS: Record<string, BadgeProps["variant"]> = {
  "Belum Aktif": "warning",
  Aktif: "success",
  Nonaktif: "neutral",
};

/** Status kepegawaian berwarna: "Belum Aktif", "Aktif", atau "Nonaktif". */
export function EmployeeActiveStatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANT_BY_STATUS[status] ?? "neutral"}>{status}</Badge>;
}
