import { Badge, type BadgeProps } from "@mestakara/ui/badge";

/** Warna badge setiap status jadwal. "Proyeksi" = belum dibuat, hanya perkiraan. */
const VARIANT_BY_STATUS: Record<string, BadgeProps["variant"]> = {
  Proyeksi: "outline",
  Draf: "warning",
  Terbit: "success",
  Terkunci: "neutral",
};

/** Label status jadwal berwarna, mis. "Terbit". */
export function PeriodStatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANT_BY_STATUS[status] ?? "neutral"}>{status}</Badge>;
}
