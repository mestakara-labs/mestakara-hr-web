import { Badge, type BadgeProps } from "@mestakara/ui/badge";

/** Warna badge setiap status usulan Penambahan / Penonaktifan. */
const VARIANT_BY_STATUS: Record<string, BadgeProps["variant"]> = {
  Draf: "warning",
  Berlaku: "success",
  Dibatalkan: "neutral",
};

/** Label status usulan berwarna, mis. "Berlaku". */
export function ActivationStatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANT_BY_STATUS[status] ?? "neutral"}>{status}</Badge>;
}
