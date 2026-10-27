/**
 * Menghitung posisi x/y setiap kotak jabatan di bagan.
 *
 * Aturannya hanya dua:
 *
 *  1. POSISI TEGAK (y) = LEVEL BRM.
 *     Setiap level BRM punya satu baris sendiri, jadi semua jabatan dengan level
 *     yang sama selalu sejajar mendatar.
 *
 *        Baris BRM-1            [Manager]
 *        Baris BRM-2   [AM]  [AM]  [AM]  [AM] ...
 *        Baris BRM-3   [Asisten] [Asisten] ...
 *
 *  2. POSISI MENDATAR (x) = BAGAN POHON.
 *     Bawahan berjejer ke samping di bawah atasannya, dan atasan diletakkan
 *     di tengah-tengah semua bawahannya.
 *
 * Selain posisi kotak, file ini juga menghitung TINGGI JALUR GARIS di celah
 * antar baris (lihat OrgChartEdge.tsx):
 *
 *        [Atasan]
 *           │
 *     ┌─────┴─────┐    <- jalur garis, tepat di tengah celah antar baris
 *  [Bawahan]  [Bawahan]
 */
import { NODE_WIDTH } from "./node-size";

/** Jarak mendatar antar kotak (px). */
const COLUMN_GAP = 32;
/** Jarak tegak antar baris BRM (px). */
const ROW_GAP = 96;

interface LayoutInput {
  /** Jabatan paling atas (tanpa atasan) */
  rootIds: string[];
  /** Bawahan langsung yang TAMPIL dari setiap jabatan */
  visibleChildrenOf: (id: string) => string[];
  /** Level BRM setiap jabatan (1 = Manager) */
  levelOf: (id: string) => number;
  /** Tinggi kotak setiap jabatan (px) */
  heightOf: (id: string) => number;
}

export interface LayoutResult {
  /** Posisi kiri-atas setiap kotak */
  positions: Map<string, { x: number; y: number }>;
  /** Ketinggian jalur garis atasan -> bawahan di bawah baris level tertentu */
  staffingLaneY: (level: number) => number;
}

export function layoutOrgChart({ rootIds, visibleChildrenOf, levelOf, heightOf }: LayoutInput): LayoutResult {
  // --- Langkah 1: posisi mendatar (x), dengan cara bagan pohon -------------
  const xPositions = new Map<string, number>();

  /**
   * Letakkan satu jabatan beserta seluruh bawahannya, mulai dari posisi `left`.
   * Mengembalikan lebar yang terpakai, supaya jabatan berikutnya bisa diletakkan di sebelahnya.
   */
  function placeSubtree(id: string, left: number): number {
    // Jabatan dengan dua atasan cukup diletakkan sekali (di bawah atasan pertama).
    const children = visibleChildrenOf(id).filter((childId) => !xPositions.has(childId));

    if (children.length === 0) {
      xPositions.set(id, left);
      return NODE_WIDTH;
    }

    // Tandai dulu supaya tidak ikut diletakkan ulang oleh bawahannya sendiri.
    xPositions.set(id, left);

    // Bawahan berjejer dari kiri ke kanan.
    let nextLeft = left;
    for (const childId of children) {
      const childWidth = placeSubtree(childId, nextLeft);
      nextLeft += childWidth + COLUMN_GAP;
    }

    // Atasan di tengah-tengah semua bawahannya.
    const totalWidth = Math.max(nextLeft - COLUMN_GAP - left, NODE_WIDTH);
    xPositions.set(id, left + (totalWidth - NODE_WIDTH) / 2);

    return totalWidth;
  }

  let nextLeft = 0;
  for (const rootId of rootIds) {
    nextLeft += placeSubtree(rootId, nextLeft) + COLUMN_GAP;
  }

  // --- Langkah 2: posisi tegak (y), satu baris per level BRM -----------------
  // Tinggi satu baris = kotak tertinggi di baris itu (mis. kotak berisi 4 pegawai).
  const rowHeights = new Map<number, number>();

  for (const id of xPositions.keys()) {
    const level = levelOf(id);
    rowHeights.set(level, Math.max(rowHeights.get(level) ?? 0, heightOf(id)));
  }

  // Susun baris dari level teratas (BRM-1) ke bawah. Level yang tidak punya
  // kotak tampil dilewati, supaya tidak ada ruang kosong.
  const rowTops = new Map<number, number>();
  const sortedLevels = [...rowHeights.keys()].sort((a, b) => a - b);
  let nextTop = 0;

  for (const level of sortedLevels) {
    rowTops.set(level, nextTop);
    nextTop += (rowHeights.get(level) ?? 0) + ROW_GAP;
  }

  // --- Hasil ---------------------------------------------------------------
  const positions = new Map<string, { x: number; y: number }>();

  for (const [id, x] of xPositions) {
    positions.set(id, { x, y: rowTops.get(levelOf(id)) ?? 0 });
  }

  /** Batas bawah baris level tertentu (px). */
  function rowBottom(level: number): number {
    return (rowTops.get(level) ?? 0) + (rowHeights.get(level) ?? 0);
  }

  return {
    positions,
    staffingLaneY: (level) => rowBottom(level) + ROW_GAP / 2,
  };
}
