import { Badge, type BadgeProps } from "@mestakara/ui/badge";

/**
 * Warna badge setiap kategori pensiun (lihat RETIREMENT_PERIODS):
 *   merah tua = sudah pensiun, merah = ≤ 3 bulan, kuning = ≤ 1 tahun, biru = ≤ 2 tahun, abu-abu = > 2 tahun.
 */
const VARIANT_BY_PERIOD: Record<string, BadgeProps["variant"]> = {
  "Sudah Pensiun": "danger",
  "≤ 1 bulan": "danger",
  "> 1 ≤ 3 bulan": "danger",
  "> 3 ≤ 6 bulan": "warning",
  "> 6 bulan ≤ 1 tahun": "warning",
  "> 1 ≤ 2 tahun": "info",
  "> 2 tahun": "neutral",
};

/** Label kategori pensiun berwarna, mis. "> 3 ≤ 6 bulan". "Sudah Pensiun" dibuat merah pekat. */
export function RetirementStatusBadge({ period }: { period: string }) {
  return (
    <Badge
      variant={VARIANT_BY_PERIOD[period] ?? "neutral"}
      dot={false}
      className={period === "Sudah Pensiun" ? "border-transparent bg-danger text-fg-on-brand" : undefined}
    >
      {period}
    </Badge>
  );
}
