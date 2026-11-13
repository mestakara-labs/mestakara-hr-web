/**
 * Bagian pelengkap SeriesChart: LEGENDA dan TOOLTIP.
 * Dibuat sendiri (bukan bawaan Recharts) supaya tetap rapi walaupun serinya banyak (mis. "Pisah per" Objek Penempatan).
 */
import { formatValue } from "@/lib/dashboard-format";
import type { DashboardUnit } from "@/types/api/dashboard";

/** Satu seri untuk legenda: nama + warnanya. */
export interface LegendItem {
  key: string;
  label: string;
  color: string;
}

/**
 * Legenda di BAWAH grafik (di luar area grafik, jadi tidak memakan tinggi grafik):
 *
 *   ● Tetap  ● PKWT  ● Casual  ● Daily Worker  ● ...
 *
 * Kalau serinya sangat banyak, daftar ini bisa digulir sendiri (tinggi maksimum ±4 baris).
 */
export function SeriesLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex max-h-24 flex-wrap justify-center gap-x-4 gap-y-1 overflow-y-auto px-2">
      {items.map((item) => (
        <li key={item.key} className="flex max-w-56 items-center gap-1.5 typo-body-s text-fg-secondary">
          <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="truncate" title={item.label}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Berapa baris seri paling banyak yang ditulis di tooltip; sisanya diringkas "+N lainnya". */
const MAX_TOOLTIP_ROWS = 10;

/** Isian yang dikirim Recharts ke tooltip untuk setiap seri. */
interface TooltipEntry {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
}

interface SeriesTooltipProps {
  /** Diisi Recharts: true kalau kursor sedang di atas grafik */
  active?: boolean;
  /** Diisi Recharts: nilai setiap seri di kategori yang ditunjuk */
  payload?: TooltipEntry[];
  /** Diisi Recharts: nama kategori (lengkap, tidak dipotong) */
  label?: string | number;
  /** Nama seri per kunci, mis. { s0: "Tetap", s1: "PKWT" } */
  seriesLabels: Record<string, string>;
  unit: DashboardUnit;
}

/**
 * Tooltip saat kursor di atas kategori:
 *
 *   ┌ Agrowisata Gunung Mas ────┐
 *   │ ■ Tetap            40     │
 *   │ ■ PKWT             10     │
 *   │ +3 lainnya                │
 *   │ Total              58     │   <- hanya kalau serinya lebih dari satu
 *   └───────────────────────────┘
 *
 * Seri bernilai 0 tidak ditulis, supaya tooltip tidak terlalu panjang.
 */
export function SeriesTooltip({ active, payload, label, seriesLabels, unit }: SeriesTooltipProps) {
  if (!active || !payload?.length) return null;

  const entries = payload.filter((entry) => Number(entry.value ?? 0) !== 0);
  const shown = entries.slice(0, MAX_TOOLTIP_ROWS);
  const hiddenCount = entries.length - shown.length;
  const total = payload.reduce((sum, entry) => sum + Number(entry.value ?? 0), 0);

  return (
    <div className="flex max-w-72 min-w-44 flex-col gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 typo-body-s shadow-lg">
      <p className="font-medium text-fg-heading">{label}</p>

      {shown.map((entry) => (
        <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-1.5 text-fg-secondary">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="truncate">{seriesLabels[String(entry.dataKey)]}</span>
          </span>
          <span className="font-medium whitespace-nowrap text-fg-primary">{formatValue(Number(entry.value), unit)}</span>
        </div>
      ))}

      {entries.length === 0 && <p className="text-fg-tertiary">Tidak ada data</p>}
      {hiddenCount > 0 && <p className="text-fg-tertiary">+{hiddenCount} lainnya</p>}

      {payload.length > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-border pt-1.5">
          <span className="text-fg-secondary">Total</span>
          <span className="font-medium whitespace-nowrap text-fg-heading">{formatValue(total, unit)}</span>
        </div>
      )}
    </div>
  );
}
