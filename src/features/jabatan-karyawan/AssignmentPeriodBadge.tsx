import { Badge } from "@mestakara/ui/badge";

import { formatDate } from "@/lib/date";

/** Warna badge setiap masa tugas. */
const PERIOD_VARIANT = { Aktif: "success", "Akan Datang": "info", Selesai: "neutral" } as const;

interface AssignmentPeriodBadgeProps {
  /** "Aktif", "Akan Datang", atau "Selesai" */
  period: string;
  start_date: string;
  /** null = belum ada TMT selesai (ditulis "sekarang") */
  end_date: string | null;
}

/**
 * Masa tugas sebuah penugasan:
 *
 *   [Aktif]
 *   9 November 2023 – sekarang
 */
export function AssignmentPeriodBadge({ period, start_date, end_date }: AssignmentPeriodBadgeProps) {
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={PERIOD_VARIANT[period as keyof typeof PERIOD_VARIANT] ?? "neutral"}>{period}</Badge>
      <p className="typo-body-s whitespace-nowrap text-fg-tertiary">
        {formatDate(start_date)} – {end_date ? formatDate(end_date) : "sekarang"}
      </p>
    </div>
  );
}
