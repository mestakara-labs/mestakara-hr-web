import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "cn";

import { formatValue } from "@/lib/dashboard-format";
import type { KpiData } from "@/types/api/dashboard";

/**
 * Isi kartu ANGKA (KPI):
 *
 *   805.838.050                       angka utama
 *   ▲ 4,2% dibanding rentang sebelumnya
 *   masuk 12 · keluar 3               catatan (opsional)
 *   Tetap 120 · PKWT 30 · ...         rincian (opsional)
 *
 * `goodWhenUp` = naik itu baik (hijau) atau buruk (merah), mis. mangkir naik = buruk.
 */
export function KpiTile({ data, goodWhenUp = true }: { data: KpiData; goodWhenUp?: boolean }) {
  const change = data.change_percent;
  const isUp = change !== null && change > 0;
  const isGood = change === null || change === 0 ? null : isUp === goodWhenUp;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="typo-h2 text-fg-brand">{formatValue(data.value, data.unit)}</p>

      {change !== null && (
        <p
          className={cn(
            "flex items-center gap-1 typo-body-s",
            isGood === null && "text-fg-tertiary",
            isGood === true && "text-fg-success",
            isGood === false && "text-fg-danger",
          )}
        >
          {isUp ? <ArrowUpRight className="size-4" /> : change < 0 && <ArrowDownRight className="size-4" />}
          {Math.abs(change).toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dibanding rentang sebelumnya
        </p>
      )}

      {data.note && <p className="typo-body-s text-fg-secondary">{data.note}</p>}

      {data.breakdown && data.breakdown.length > 0 && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 typo-body-s text-fg-secondary">
          {data.breakdown.map((item) => (
            <li key={item.key}>
              {item.label} <span className="font-medium text-fg-primary">{formatValue(item.value, data.unit)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
