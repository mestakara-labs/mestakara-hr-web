"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@mestakara/ui/avatar";
import { Badge } from "@mestakara/ui/badge";
import { Checkbox } from "@mestakara/ui/checkbox";

import {
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  jobGradeColumn,
  rowNumberColumn,
  selectColumn,
  toFilterOptions,
} from "@/components/shared/data-table";
import { currentAssignmentsOf } from "@/features/mutasi/mutasi-form-values";
import { getInitials } from "@/lib/initials";
import { EMPLOYMENT_STATUS_OPTIONS } from "@/lib/employee-rules";

import type { ReguFormData } from "./useReguFormData";

/** Satu baris tabel pilih karyawan. */
interface CandidateRow {
  id: string;
  name: string;
  nik: string | null;
  photo_url: string | null;
  employment_status: string;
  /** Jabatan yang sedang dipegang, mis. "Mandor Kebun" */
  positions: string;
  /** Job Grade jabatan utamanya; null = belum diisi / belum ditempatkan */
  jobGrade: number | null;
  /** Sub unit penempatan sekarang (bisa lebih dari satu) */
  subUnitIds: string[];
  subUnits: string;
  /** Regu aktif karyawan ini pada tanggal bergabung; null = belum di regu mana pun */
  currentGroup: string | null;
}

/**
 * Data karyawan + jabatan + keanggotaan regu -> baris tabel.
 * Karyawan dianggap masih di regu kalau keanggotaannya belum berakhir pada `date`.
 */
function toCandidateRows(data: ReguFormData, groupId: string | null, date: string): CandidateRow[] {
  return data.employees.map((employee) => {
    const current = currentAssignmentsOf(employee.id, data.assignments);
    const activeGroup = data.groups.find((group) =>
      group.members.some(
        (member) => member.employee.id === employee.id && (member.end_date === null || member.end_date >= date),
      ),
    );

    return {
      id: employee.id,
      name: employee.name,
      nik: employee.nik,
      photo_url: employee.photo_url,
      employment_status: employee.employment_status,
      positions: current.map((assignment) => assignment.position.title).join(", ") || "-",
      jobGrade: current[0]?.position.job_grade ?? null,
      subUnitIds: current.map((assignment) => assignment.sub_unit.id),
      subUnits: [...new Set(current.map((assignment) => assignment.sub_unit.name))].join(", ") || "-",
      currentGroup: activeGroup ? (activeGroup.id === groupId ? "Regu ini" : activeGroup.name) : null,
    };
  });
}

const col = createDataTableColumnHelper<CandidateRow>();

/** Kolom: ☐ | No | Karyawan | Jabatan Sekarang | Job Grade | Sub Unit | Status Karyawan | Regu Saat Ini */
const candidateTableConfig = defineTableConfig<CandidateRow>({
  getRowId: (row) => row.id,
  emptyMessage: "Tidak ada karyawan yang cocok dengan pencarian atau filter.",
  tableClassName: "min-w-240",
  columns: col.columns([
    selectColumn<CandidateRow>((row) => row.name),
    rowNumberColumn<CandidateRow>(),

    col.accessor("name", {
      header: "Karyawan",
      meta: { search: { placeholder: "Cari nama..." } },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {row.original.photo_url && <AvatarImage src={row.original.photo_url} alt={`Foto ${row.original.name}`} />}
            <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-fg-heading">{row.original.name}</p>
            <p className="typo-body-s text-fg-tertiary">NIK {row.original.nik ?? "-"}</p>
          </div>
        </div>
      ),
    }),

    col.accessor("positions", {
      header: "Jabatan Sekarang",
      meta: { search: { placeholder: "Cari jabatan..." }, cellClassName: "text-fg-primary" },
    }),

    jobGradeColumn<CandidateRow>((row) => row.jobGrade),

    col.accessor("subUnits", {
      header: "Sub Unit",
      meta: { search: { placeholder: "Cari sub unit..." }, cellClassName: "text-fg-secondary" },
    }),

    col.accessor("employment_status", {
      header: "Status Karyawan",
      meta: { filter: { options: toFilterOptions(EMPLOYMENT_STATUS_OPTIONS) }, nowrap: true },
      cell: ({ getValue }) => getValue().replace("Karyawan ", ""),
    }),

    col.accessor((row) => row.currentGroup ?? "Belum di regu", {
      id: "currentGroup",
      header: "Regu Saat Ini",
      meta: { nowrap: true },
      cell: ({ row }) =>
        row.original.currentGroup ? (
          <Badge variant="warning" dot={false}>
            {row.original.currentGroup}
          </Badge>
        ) : (
          <span className="text-fg-tertiary">Belum di regu</span>
        ),
    }),
  ]),
});

interface EmployeePickerTableProps {
  data: ReguFormData;
  /** Regu yang sedang diubah (null = regu baru) */
  groupId: string | null;
  /** Sub unit regu (dari langkah 1) untuk saringan bawaan */
  subUnitId: string;
  subUnitName: string;
  /** Tanggal bergabung anggota baru (untuk mengecek keanggotaan regu lain) */
  date: string;
  selectedIds: string[];
  onSelectionChange: (employeeIds: string[]) => void;
  disabled: boolean;
}

/**
 * TABEL PILIH KARYAWAN (bisa pilih banyak):
 *
 *   [✓] Hanya karyawan Sub Unit Gunung Mas
 *   ☐ | No | Karyawan | Jabatan Sekarang | Sub Unit | Status Karyawan | Regu Saat Ini
 *
 * Karyawan yang masih aktif di regu mana pun tidak bisa dicentang (satu karyawan = satu regu aktif).
 */
export function EmployeePickerTable({
  data,
  groupId,
  subUnitId,
  subUnitName,
  date,
  selectedIds,
  onSelectionChange,
  disabled,
}: EmployeePickerTableProps) {
  const [onlySubUnit, setOnlySubUnit] = useState(true);
  const rows = useMemo(() => toCandidateRows(data, groupId, date), [data, groupId, date]);
  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);

  // Karyawan yang sudah dicentang tetap tampil walau di luar sub unit.
  const visibleRows = onlySubUnit
    ? rows.filter((row) => row.subUnitIds.includes(subUnitId) || selectedIds.includes(row.id))
    : rows;

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 typo-body-s text-fg-primary">
        <Checkbox checked={onlySubUnit} onCheckedChange={(checked) => setOnlySubUnit(checked === true)} />
        Hanya karyawan Sub Unit <strong>{subUnitName}</strong>
      </label>
      <DataTable
        config={candidateTableConfig}
        data={visibleRows}
        selection={{
          selectedIds,
          onChange: onSelectionChange,
          canSelect: (id) => !disabled && rowById.get(id)?.currentGroup === null,
        }}
      />
    </div>
  );
}
