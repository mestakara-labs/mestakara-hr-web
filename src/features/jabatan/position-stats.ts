/**
 * Hitungan untuk kartu statistik di halaman Jabatan.
 *
 * Yang dihitung adalah JABATAN, bukan orang. Contoh: "Admin Tata Buku" yang
 * dipegang 4 orang tetap dihitung 1 jabatan.
 */
import type { StatItem } from "@/components/shared/StatBarList";
import { BRM_LEVEL_ORDER, getBrmLevel } from "@/features/organisasi/brm-level";
import type { DivisionResource } from "@/types/api/division";
import type { PositionResource } from "@/types/api/organization";

/**
 * Jumlah jabatan di setiap level BRM, urut dari BRM-1 sampai BRM-6.
 *
 *   [{ label: "BRM-1", count: 1 }, { label: "BRM-2", count: 8 }, ...]
 */
export function countByBrmLevel(positions: PositionResource[]): StatItem[] {
  return BRM_LEVEL_ORDER.map((level) => ({
    label: getBrmLevel(level).label,
    count: positions.filter((position) => position.brm_level === level).length,
    color: getBrmLevel(level).color,
  }));
}

/**
 * Jumlah jabatan di setiap bidang, urut sesuai master Bidang.
 * Bidang yang belum punya jabatan tetap ditampilkan dengan jumlah 0.
 *
 *   [{ label: "Administrasi & Keuangan", count: 15 }, ...]
 */
export function countByDivision(
  positions: PositionResource[],
  divisions: DivisionResource[],
): StatItem[] {
  return divisions.map((division) => ({
    label: division.name,
    count: positions.filter((position) => position.division_id === division.id).length,
  }));
}

/** Jumlah jabatan tanpa bidang (biasanya hanya Manager / BRM-1). */
export function countWithoutDivision(positions: PositionResource[]): number {
  return positions.filter((position) => position.division_id === null).length;
}
