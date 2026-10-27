import { BaseEdge, type EdgeProps } from "@xyflow/react";

import type { OrgChartEdgeType } from "./build-org-chart";

/**
 * Garis atasan -> bawahan di bagan. Selalu SIKU 90°, tanpa patahan.
 *
 * Semua garis memakai SATU aturan yang sama:
 *
 *       [Kotak awal]
 *            │                1. turun dari kotak awal sampai ketinggian jalur (laneY)
 *            └──────────┐     2. mendatar sampai sejajar kotak tujuan
 *                       │     3. turun / naik ke kotak tujuan
 *                [Kotak tujuan]
 *
 * Ketinggian jalur (laneY) sudah dihitung oleh layout-org-chart.ts dan dibawa
 * lewat `data`, supaya garis selalu lewat di celah antar baris, tidak memotong kotak.
 *
 * Perintah SVG yang dipakai:
 *   M x,y = mulai di titik (x, y)
 *   V y   = garis TEGAK sampai ketinggian y
 *   H x   = garis MENDATAR sampai posisi x
 */
export function OrgChartEdge({ id, sourceX, sourceY, targetX, targetY, data, style }: EdgeProps<OrgChartEdgeType>) {
  // Kalau laneY tidak ada (seharusnya tidak terjadi), pakai titik tengah sebagai cadangan.
  const laneY = data?.laneY ?? (sourceY + targetY) / 2;

  const path = `M ${sourceX},${sourceY} V ${laneY} H ${targetX} V ${targetY}`;

  return <BaseEdge id={id} path={path} style={style} />;
}
