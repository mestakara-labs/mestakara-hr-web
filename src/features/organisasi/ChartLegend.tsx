import { BRM_LEVEL_ORDER, getBrmLevel } from "./brm-level";

/** Keterangan di pojok bagan: warna setiap level BRM. */
export function ChartLegend() {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-1 rounded-lg border border-border bg-surface/95 p-3 shadow-sm typo-body-s text-fg-secondary">
      {BRM_LEVEL_ORDER.map((level) => (
        <span key={level} className="flex items-center gap-1.5">
          <span className="size-3 rounded-xs" style={{ backgroundColor: getBrmLevel(level).color }} />
          {getBrmLevel(level).label}
        </span>
      ))}
    </div>
  );
}
