/**
 * Mengubah daftar jabatan menjadi bahan gambar untuk React Flow:
 * - nodes = kotak (beserta posisinya di layar)
 * - edges = garis atasan -> bawahan
 *
 * Langkahnya:
 *   1. Susun kotak-kotaknya, lalu tentukan yang tampil (lihat org-tree.ts).
 *   2. Hitung posisi setiap kotak (lihat layout-org-chart.ts).
 *   3. Buat satu node untuk setiap kotak yang tampil.
 *   4. Buat garis dari setiap kotak ke kotak atasannya.
 */
import type { Edge, Node } from "@xyflow/react";

import type { EmployeeResource, PositionResource } from "@/types/api/organization";

import { layoutOrgChart } from "./layout-org-chart";
import { getNodeHeight, NODE_WIDTH } from "./node-size";
import {
  buildCardsById,
  buildChildrenMap,
  buildOrgCards,
  findVisibleIds,
  type OrgCard,
} from "./org-tree";

/** Data yang dibawa setiap kotak ke komponen OrgCardNode. */
export type OrgCardNodeData = {
  card: OrgCard;
  /** Jumlah kotak bawahan langsung (untuk tombol "+ jumlah"). */
  childCount: number;
  /** true kalau cabang di bawah kotak ini sedang dibuka. */
  isExpanded: boolean;
  /** true kalau jabatan kotak ini sedang disorot (hasil pencarian). */
  isHighlighted: boolean;
  /** Buka / tutup cabang di bawah kotak ini. */
  onToggle: (cardId: string) => void;
  /** Dipanggil saat nama pegawai diklik (membuka panel detail). */
  onSelectEmployee: (employee: EmployeeResource, position: PositionResource) => void;
};

export type OrgCardNodeType = Node<OrgCardNodeData, "orgCard">;

/**
 * Garis di bagan (digambar oleh OrgChartEdge.tsx).
 * `laneY` = ketinggian jalur mendatar garis di celah antar baris (dari layout-org-chart.ts).
 */
export type OrgChartEdgeType = Edge<{ laneY: number }, "orgChart">;

/** Nama titik sambung garis: atas-tengah (masuk dari atasan) dan bawah-tengah (keluar ke bawahan). */
export const HANDLE = { top: "top", bottom: "bottom" };

const LINE_STYLE = { stroke: "var(--border-strong)", strokeWidth: 1.5 };

interface BuildOrgChartOptions {
  /** Kotak yang cabangnya sedang dibuka */
  expandedIds: Set<string>;
  /** Jabatan yang sedang disorot (semua kotak jabatan itu ikut disorot) */
  highlightedPositionId: string | null;
  onToggle: OrgCardNodeData["onToggle"];
  onSelectEmployee: OrgCardNodeData["onSelectEmployee"];
}

export function buildOrgChart(
  positions: PositionResource[],
  options: BuildOrgChartOptions,
): { nodes: OrgCardNodeType[]; edges: OrgChartEdgeType[] } {
  // Langkah 1: susun kotak, lalu tentukan yang tampil.
  const cards = buildOrgCards(positions);
  const cardsById = buildCardsById(cards);
  const childrenMap = buildChildrenMap(cards);
  const visibleIds = findVisibleIds(cards, childrenMap, options.expandedIds);
  const visibleCards = cards.filter((card) => visibleIds.has(card.id));

  /** Bawahan langsung yang tampil: hanya kalau cabangnya dibuka. */
  function visibleChildrenOf(id: string): string[] {
    if (!options.expandedIds.has(id)) return [];
    return (childrenMap.get(id) ?? []).filter((childId) => visibleIds.has(childId));
  }

  // Langkah 2: posisi setiap kotak.
  const layout = layoutOrgChart({
    rootIds: visibleCards.filter((card) => card.parentIds.length === 0).map((card) => card.id),
    visibleChildrenOf,
    levelOf: (id) => cardsById.get(id)?.position.brm_level ?? 1,
    heightOf: (id) => getNodeHeight(cardsById.get(id)?.employees.length ?? 1),
  });

  // Langkah 3: satu node untuk setiap kotak yang tampil.
  const nodes: OrgCardNodeType[] = visibleCards.map((card) => ({
    id: card.id,
    type: "orgCard",
    position: layout.positions.get(card.id) ?? { x: 0, y: 0 },
    width: NODE_WIDTH,
    height: getNodeHeight(card.employees.length),
    // PENTING: bagan dibuat tidak bisa digeser/dipilih, dan dalam keadaan itu React Flow
    // otomatis mematikan klik pada kotak (pointer-events: none). Baris ini menyalakannya lagi
    // supaya nama pegawai, ikon kontak, dan tombol +/- di dalam kotak tetap bisa diklik.
    style: { pointerEvents: "all" },
    data: {
      card,
      childCount: childrenMap.get(card.id)?.length ?? 0,
      isExpanded: options.expandedIds.has(card.id),
      isHighlighted: card.position.id === options.highlightedPositionId,
      onToggle: options.onToggle,
      onSelectEmployee: options.onSelectEmployee,
    },
  }));

  // Langkah 4: garis dari setiap kotak ke kotak atasannya (kalau keduanya tampil).
  // Garis keluar dari bawah-tengah atasan, mendatar di jalur tepat di bawah baris atasan,
  // lalu turun ke atas-tengah bawahan. Bentuknya digambar oleh OrgChartEdge.tsx.
  const edges: OrgChartEdgeType[] = [];

  for (const card of visibleCards) {
    for (const parentId of card.parentIds) {
      if (!visibleIds.has(parentId)) continue;

      const parentLevel = cardsById.get(parentId)?.position.brm_level ?? 1;

      edges.push({
        id: `staffing-${parentId}-${card.id}`,
        source: parentId,
        target: card.id,
        sourceHandle: HANDLE.bottom,
        targetHandle: HANDLE.top,
        type: "orgChart",
        data: { laneY: layout.staffingLaneY(parentLevel) },
        style: LINE_STYLE,
      });
    }
  }

  return { nodes, edges };
}
