/**
 * Level jabatan BRM. BRM-1 = pimpinan utama (Manager), makin besar angkanya makin ke bawah.
 *
 * Di SK level ini masih ditulis sebagai "Strata" dengan urutan terbalik:
 *   BRM-1 = Strata 6, BRM-2 = Strata 5, ... , BRM-6 = Strata 1.
 *
 * `color` dipakai untuk garis warna di bawah kartu, badge, legenda, dan minimap.
 * Warnanya diambil dari palet @mestakara/ui, mengikuti pasangan warna di SK
 * (oranye, hijau, biru — versi tua untuk level atas, versi muda untuk level bawah).
 */
export interface BrmLevelInfo {
  label: string;
  /** Contoh jabatan pada level ini */
  examples: string;
  color: string;
}

export const BRM_LEVELS: Record<number, BrmLevelInfo> = {
  1: { label: "BRM-1", examples: "Manager", color: "var(--color-orange-600)" },
  2: { label: "BRM-2", examples: "Asisten Manager", color: "var(--color-green-600)" },
  3: { label: "BRM-3", examples: "Asisten", color: "var(--color-sky-700)" },
  4: { label: "BRM-4", examples: "Admin I, Pengawas, Mandor I", color: "var(--color-orange-300)" },
  5: { label: "BRM-5", examples: "Admin, Penanggung Jawab, Mandor", color: "var(--color-green-300)" },
  6: { label: "BRM-6", examples: "Pelaksana, Karyawan", color: "var(--color-sky-500)" },
};

/** Urutan level dari pimpinan utama ke bawah, untuk legenda. */
export const BRM_LEVEL_ORDER = [1, 2, 3, 4, 5, 6];

/** Ambil info level BRM. Level yang tidak dikenal memakai warna abu-abu. */
export function getBrmLevel(level: number): BrmLevelInfo {
  return BRM_LEVELS[level] ?? { label: `BRM-${level}`, examples: "", color: "var(--color-neutral-400)" };
}
