"use client";

import { useState } from "react";

import {
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  selectColumn,
  toFilterOptions,
} from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/FormDialog";
import { EmployeeActiveStatusBadge } from "@/features/karyawan/EmployeeActiveStatusBadge";
import { ACTIVATION_STATUS, EMPLOYEE_ACTIVE_STATUS } from "@/lib/activation-rules";
import type { EmployeeProfileResource } from "@/types/api/employee";

import type { PenambahanData } from "./penambahan-form-values";

/** Satu baris pilihan karyawan. */
interface CandidateRow {
  id: string;
  name: string;
  nik: string;
  employment_status: string;
  active_status: string;
  completeness: string;
}

const col = createDataTableColumnHelper<CandidateRow>();

const candidateTableConfig = defineTableConfig<CandidateRow>({
  getRowId: (row) => row.id,
  emptyMessage: "Tidak ada karyawan Belum Aktif / Nonaktif yang bisa dipilih.",
  columns: col.columns([
    selectColumn<CandidateRow>((row) => row.name),
    col.accessor("name", {
      header: "Karyawan",
      meta: { search: { placeholder: "Cari nama..." } },
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-fg-heading">{row.original.name}</p>
          <p className="typo-body-s text-fg-tertiary">NIK {row.original.nik}</p>
        </div>
      ),
    }),
    col.accessor("active_status", {
      header: "Status",
      meta: { filter: { options: toFilterOptions([EMPLOYEE_ACTIVE_STATUS.pending, EMPLOYEE_ACTIVE_STATUS.inactive]) }, nowrap: true },
      cell: ({ getValue }) => <EmployeeActiveStatusBadge status={getValue()} />,
    }),
    col.accessor("completeness", {
      header: "Kelengkapan",
      meta: { nowrap: true, cellClassName: "text-fg-secondary" },
    }),
  ]),
});

/**
 * Karyawan yang bisa dipilih untuk usulan penambahan:
 *   - Belum Aktif (draf yang belum masuk usulan), atau Nonaktif (karyawan yang kembali)
 *   - belum ada di usulan ini, tidak sedang di usulan Penambahan lain (Draf),
 *     dan tidak sudah terjadwal aktif lewat usulan Berlaku
 */
export function findCandidates(
  data: PenambahanData,
  selectedIds: string[],
  activationId: string | null,
): EmployeeProfileResource[] {
  const busyIds = new Set(
    data.activations
      .filter((activation) => activation.id !== activationId && activation.status !== ACTIVATION_STATUS.cancelled)
      .flatMap((activation) => activation.items.map((item) => item.employee.id)),
  );

  return data.employees.filter(
    (employee) =>
      employee.active_status !== EMPLOYEE_ACTIVE_STATUS.active &&
      !selectedIds.includes(employee.id) &&
      // Nonaktif boleh punya usulan lama (Berlaku) — yang dicegah hanya yang sedang diproses.
      (employee.active_status === EMPLOYEE_ACTIVE_STATUS.inactive || !busyIds.has(employee.id)),
  );
}

interface PickEmployeeDialogProps {
  open: boolean;
  candidates: EmployeeProfileResource[];
  onClose: () => void;
  /** Dipanggil dengan karyawan yang dicentang */
  onPick: (employees: EmployeeProfileResource[]) => void;
}

/**
 * Dialog "PILIH KARYAWAN" di langkah 1: draf karyawan Belum Aktif yang belum masuk usulan,
 * atau karyawan Nonaktif yang kembali bekerja. Bisa pilih lebih dari satu.
 */
export function PickEmployeeDialog({ open, candidates, onClose, onPick }: PickEmployeeDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const rows: CandidateRow[] = candidates.map((employee) => ({
    id: employee.id,
    name: employee.name,
    nik: employee.nik ?? "-",
    employment_status: employee.employment_status,
    active_status: employee.active_status,
    completeness:
      employee.missing_fields.length === 0 ? "Lengkap" : `Kurang ${employee.missing_fields.length} isian`,
  }));

  function close() {
    setSelectedIds([]);
    onClose();
  }

  return (
    <FormDialog
      open={open}
      title="Pilih Karyawan"
      description="Draf karyawan (Belum Aktif) yang belum masuk usulan, atau karyawan Nonaktif yang kembali bekerja."
      saveLabel={selectedIds.length > 0 ? `Tambahkan ${selectedIds.length} Karyawan` : "Tambahkan"}
      onSave={() => {
        onPick(candidates.filter((employee) => selectedIds.includes(employee.id)));
        close();
      }}
      onClose={close}
    >
      <DataTable
        config={candidateTableConfig}
        data={rows}
        selection={{ selectedIds, onChange: setSelectedIds }}
      />
    </FormDialog>
  );
}
