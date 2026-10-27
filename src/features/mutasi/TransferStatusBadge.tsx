import { Badge, type BadgeProps } from "@mestakara/ui/badge";

/** Warna badge setiap status usulan mutasi. */
const VARIANT_BY_STATUS: Record<string, BadgeProps["variant"]> = {
  Draf: "neutral",
  "Menunggu Dokumen": "warning",
  Berlaku: "success",
  Dibatalkan: "danger",
};

/** Label status usulan mutasi berwarna, mis. "Menunggu Dokumen". */
export function TransferStatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANT_BY_STATUS[status] ?? "neutral"}>{status}</Badge>;
}
