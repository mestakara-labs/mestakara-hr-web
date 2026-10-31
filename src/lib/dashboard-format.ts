/**
 * CARA MENULIS ANGKA di Dashboard & Analitik SDM, menurut satuannya.
 *
 *   formatValue(805838050, "rupiah")  -> "Rp 805.838.050"
 *   formatCompact(805838050, "rupiah") -> "Rp 805,8 jt"   (untuk sumbu grafik & kartu)
 *   formatValue(92.4, "persen")       -> "92,4%"
 *   formatValue(1234, "jam")          -> "1.234 jam"
 */
import type { DashboardUnit } from "@/types/api/dashboard";

const SUFFIX: Partial<Record<DashboardUnit, string>> = { orang: " orang", jam: " jam", hari: " hari" };

/** Angka lengkap berpemisah ribuan + satuannya. */
export function formatValue(value: number, unit: DashboardUnit): string {
  if (unit === "rupiah") return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
  if (unit === "persen") return `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}${SUFFIX[unit] ?? ""}`;
}

/** Angka ringkas untuk sumbu grafik: rupiah jadi rb / jt / M; satuan lain tanpa akhiran. */
export function formatCompact(value: number, unit: DashboardUnit): string {
  if (unit === "persen") return `${value.toLocaleString("id-ID", { maximumFractionDigits: 0 })}%`;
  if (unit !== "rupiah") return value.toLocaleString("id-ID", { maximumFractionDigits: 1 });

  const abs = Math.abs(value);
  const short = (amount: number, suffix: string) => `Rp ${amount.toLocaleString("id-ID", { maximumFractionDigits: 1 })} ${suffix}`;
  if (abs >= 1e9) return short(value / 1e9, "M");
  if (abs >= 1e6) return short(value / 1e6, "jt");
  if (abs >= 1e3) return short(value / 1e3, "rb");
  return `Rp ${value.toLocaleString("id-ID")}`;
}

/** Bagian dari total dalam persen: (25, 200) -> "12,5%"; total 0 -> "0%". */
export function formatShare(value: number, total: number): string {
  return `${(total === 0 ? 0 : (value / total) * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
}
