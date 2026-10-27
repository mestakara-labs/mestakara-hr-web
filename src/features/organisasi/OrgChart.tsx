"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { OrgCardNodeType } from "./build-org-chart";
import { ChartLegend } from "./ChartLegend";
import { OrgChartEdge } from "./OrgChartEdge";
import { OrgCardNode } from "./OrgCardNode";
import { getBrmLevel } from "./brm-level";

/**
 * Daftar jenis kotak dan jenis garis yang dipakai bagan. Ditulis di luar komponen
 * supaya tidak dibuat ulang setiap render (anjuran React Flow).
 */
const nodeTypes = { orgCard: OrgCardNode };
const edgeTypes = { orgChart: OrgChartEdge };

interface OrgChartProps {
  nodes: OrgCardNodeType[];
  edges: Edge[];
  /** Dipanggil sekali saat bagan siap, untuk mengatur tampilan awal. */
  onReady: () => void;
}

/**
 * Kanvas bagan organisasi (React Flow):
 * - latar titik-titik, bisa digeser (drag) dan di-zoom (scroll / tombol)
 * - minimap di kiri bawah, tombol zoom di kiri bawah, legenda di kanan bawah
 *
 * Bagan hanya untuk dilihat: kotak tidak bisa dipindah atau disambung manual.
 */
export function OrgChart({ nodes, edges, onReady }: OrgChartProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      onInit={onReady}
      minZoom={0.1}
      maxZoom={1.5}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="var(--border-strong)" />
      <Controls showInteractive={false} position="bottom-left" orientation="horizontal" />
      {/* Minimap & legenda hanya di layar md ke atas; di HP terlalu memakan tempat. */}
      <MiniMap
        position="bottom-left"
        className="mb-12! hidden! md:block!"
        style={{ width: 160, height: 100 }}
        pannable
        zoomable
        nodeColor={(node) => getBrmLevel((node as OrgCardNodeType).data.card.position.brm_level).color}
      />
      <Panel position="bottom-right" className="hidden md:block">
        <ChartLegend />
      </Panel>
    </ReactFlow>
  );
}
