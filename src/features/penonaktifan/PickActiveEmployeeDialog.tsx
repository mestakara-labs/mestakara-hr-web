"use client";

import { useState } from "react";

import {
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  jobGradeColumn,
  selectColumn,
  toFilterOptions,
} from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/FormDialog";
import { EMPLOYMENT_STATUS_OPTIONS } from "@/lib/employee-rules";
import type { EmployeeProfileResource } from "@/types/api/employee";

/** Satu baris pilihan karyawan. */
interface CandidateRow {
  id: string;
  name: string;
  nik: string;
  employment_status: string;
  position: string;
  /** Job Grade jabatan utamanya; null = belum diisi / belum ditempatkan */
  jobGrade: number | null;
}

const col = createDataTableColumnHelper<CandidateRow>();

const candidateTableConfig = defineTableConfig<CandidateRow>({
  getRowId: (row) => row.id,
  emptyMessage: "Tidak ada karyawan Aktif yang bisa dipilih.",
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
    col.accessor("position", { header: "Jabatan", meta: { cellClassName: "text-fg-primary" } }),
    jobGradeColumn<CandidateRow>((row) => row.jobGrade),
    col.accessor("employment_status", {
      header: "Status Karyawan",
      meta: { filter: { options: toFilterOptions(EMPLOYMENT_STATUS_OPTIONS) }, nowrap: true, cellClassName: "text-fg-secondary" },
    }),
  ]),
});

interface PickActiveEmployeeDialogProps {
  open: boolean;
  /** Karyawan Aktif yang boleh dipilih (lihat findCandidates) */
  candidates: EmployeeProfileResource[];
  onClose: () => void;
  /** Dipanggil dengan karyawan yang dicentang */
  onPick: (employees: EmployeeProfileResource[]) => void;
}

/** Dialog "PILIH KARYAWAN" di langkah 1 Penonaktifan: karyawan Aktif, bisa pilih lebih dari satu. */
export function PickActiveEmployeeDialog({ open, candidates, onClose, onPick }: PickActiveEmployeeDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const rows: CandidateRow[] = candidates.map((employee) => ({
    id: employee.id,
    name: employee.name,
    nik: employee.nik ?? "-",
    employment_status: employee.employment_status,
    position: employee.position?.title ?? "Belum ditempatkan",
    jobGrade: employee.position?.job_grade ?? null,
  }));

  function close() {
    setSelectedIds([]);
    onClose();
  }

  return (
    <FormDialog
      open={open}
      title="Pilih Karyawan"
      description="Karyawan Aktif yang akan dinonaktifkan. Karyawan yang sedang ada di usulan lain tidak ditampilkan."
      saveLabel={selectedIds.length > 0 ? `Tambahkan ${selectedIds.length} Karyawan` : "Tambahkan"}
      onSave={() => {
        onPick(candidates.filter((employee) => selectedIds.includes(employee.id)));
        close();
      }}
      onClose={close}
    >
      <DataTable config={candidateTableConfig} data={rows} selection={{ selectedIds, onChange: setSelectedIds }} />
    </FormDialog>
  );
}
