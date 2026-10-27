/**
 * ATURAN TAMPILAN LEMBUR DW OTOMATIS (Tahap 3). Perhitungannya di backend:
 *   Target = hari DW × Rp/hari;  Selisih = Upah Lembur DW − Target
 *   "Sesuai" = selisihnya tidak lebih dari upah 30 menit lembur (tarif per jam × 2 × 0,5)
 */
import { formatRupiah } from "@/lib/wage-rules";
import type { DwTargetStatus } from "@/types/api/dw-overtime";

/** Label & warna badge setiap status. */
export const DW_TARGET_STATUSES: Record<DwTargetStatus, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  sesuai: { label: "Sesuai", variant: "success" },
  kurang: { label: "Kurang", variant: "warning" },
  lebih: { label: "Lebih", variant: "info" },
  belum_ada: { label: "Belum ada lembur", variant: "danger" },
  skema_belum_diatur: { label: "Skema belum diatur", variant: "neutral" },
};

/** Selisih bertanda: 12500 -> "+Rp 12.500", -4000 -> "−Rp 4.000", 0 -> "Rp 0". */
export function formatDifference(amount: number): string {
  if (amount === 0) return formatRupiah(0);
  return `${amount > 0 ? "+" : "−"}${formatRupiah(Math.abs(amount))}`;
}
