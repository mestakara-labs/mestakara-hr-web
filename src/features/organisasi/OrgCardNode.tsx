"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Minus, Plus } from "lucide-react";
import { cn } from "cn";

import { getBrmLevel } from "./brm-level";
import { HANDLE, type OrgCardNodeType } from "./build-org-chart";
import { EmployeeCard } from "./EmployeeCard";
import { getNodeHeight, NODE_HEADER_HEIGHT, NODE_WIDTH } from "./node-size";

/** Titik sambung garis tidak perlu terlihat; yang terlihat hanya garisnya. */
const HIDDEN = { opacity: 0 };

/**
 * Satu kotak di bagan:
 *
 *   ┌──────────────────────────────────┐
 *   │ Admin Pengadaan     BRM-5        │  judul jabatan + level BRM
 *   │                     4 orang      │  (jumlah orang, kalau lebih dari satu)
 *   ├──────────────────────────────────┤
 *   │ 👤 Nama Pegawai 1      📞 ✉️ WA  │  satu baris per pegawai
 *   │ 👤 Nama Pegawai 2      📞 ✉️ WA  │
 *   │ ...                              │
 *   └════════════════(+ 3)═════════════┘  garis warna level BRM + tombol buka/tutup bawahan
 *
 * Kapan beberapa orang digabung dalam satu kotak, dan kapan dipisah, diatur di org-tree.ts.
 */
export function OrgCardNode({ data }: NodeProps<OrgCardNodeType>) {
  const { card, childCount, isExpanded, isHighlighted, onToggle, onSelectEmployee } = data;
  const { position, employees } = card;
  const brmLevel = getBrmLevel(position.brm_level);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border border-b-4 border-border bg-surface shadow-sm",
        isHighlighted && "ring-2 ring-primary ring-offset-2",
      )}
      style={{
        width: NODE_WIDTH,
        height: getNodeHeight(employees.length),
        borderBottomColor: brmLevel.color,
      }}
    >
      {/* Titik sambung garis: masuk dari atasan (atas), keluar ke bawahan (bawah) */}
      <Handle id={HANDLE.top} type="target" position={Position.Top} style={HIDDEN} />
      <Handle id={HANDLE.bottom} type="source" position={Position.Bottom} style={HIDDEN} />

      {/* Judul jabatan */}
      <div
        className="flex items-start justify-between gap-2 px-3 pt-2.5"
        style={{ height: NODE_HEADER_HEIGHT }}
      >
        <p className="line-clamp-2 typo-label-m text-fg-heading">{position.title}</p>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
            style={{ backgroundColor: brmLevel.color }}
          >
            {brmLevel.label}
          </span>
          {employees.length > 1 && (
            <span className="typo-body-s text-fg-tertiary">{employees.length} orang</span>
          )}
        </div>
      </div>

      {/* Pegawai di kotak ini, menumpuk ke bawah */}
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.assignment_id}
          employee={employee}
          onClick={() => onSelectEmployee(employee, position)}
        />
      ))}

      {/* Tombol buka/tutup bawahan, hanya kalau kotak ini punya bawahan */}
      {childCount > 0 && (
        <button
          type="button"
          onClick={() => onToggle(card.id)}
          aria-label={isExpanded ? "Tutup bawahan" : `Buka ${childCount} bawahan`}
          className="absolute -bottom-3.5 left-1/2 z-10 flex h-6 -translate-x-1/2 items-center gap-0.5 rounded-full bg-inverse px-2 text-xs font-semibold text-fg-on-brand shadow-sm hover:bg-forest-700"
        >
          {isExpanded ? <Minus className="size-3" /> : <Plus className="size-3" />}
          {!isExpanded && childCount}
        </button>
      )}
    </div>
  );
}
