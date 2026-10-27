"use client";

import { useMemo } from "react";
import { Info, Users } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@mestakara/ui/avatar";
import { Badge } from "@mestakara/ui/badge";
import { FieldError, FieldLegend, FieldSet } from "@mestakara/ui/field";
import { RadioGroup, RadioGroupItem } from "@mestakara/ui/radio-group";
import { cn } from "cn";

import {
  createDataTableColumnHelper,
  DataTable,
  defineTableConfig,
  jobGradeColumn,
  rowNumberColumn,
  selectColumn,
  toFilterOptions,
} from "@/components/shared/data-table";
import { getBrmLevel } from "@/features/organisasi/brm-level";
import { getInitials } from "@/lib/initials";
import { EMPLOYMENT_STATUS_OPTIONS } from "@/lib/employee-rules";
import { INITIAL_PLACEMENT, isTransferEditable, requiresFromAssignment, TRANSFER_TYPE_OPTIONS } from "@/lib/transfer-rules";
import type { TransferResource } from "@/types/api/transfer";

import { adjustItemsToType, currentAssignmentsOf, newItem, type StepProps, type WizardData } from "./mutasi-form-values";

const PLACED = "Sudah ditempatkan";
const UNPLACED = "Belum ditempatkan";

/** Satu baris tabel pilih karyawan. */
interface EmployeeRow {
  id: string;
  name: string;
  nik: string | null;
  photo_url: string | null;
  employment_status: string;
  /** Jabatan yang sedang dipegang, mis. "Admin Gudang" atau "Admin Gudang, Plt Admin Pengadaan" */
  positions: string;
  /** Level BRM jabatan utamanya, mis. "BRM-5"; "-" kalau belum ditempatkan */
  brmLevel: string;
  /** Job Grade jabatan utamanya; null = belum diisi / belum ditempatkan */
  jobGrade: number | null;
  subUnit: string;
  placement: typeof PLACED | typeof UNPLACED;
  /** Nomor/status usulan lain yang belum selesai berisi karyawan ini; null = tidak ada */
  openTransfer: string | null;
}

/** Data karyawan + jabatannya sekarang -> baris tabel. */
function toEmployeeRows(data: WizardData, transferId: string | null): EmployeeRow[] {
  return data.employees.map((employee) => {
    const current = currentAssignmentsOf(employee.id, data.assignments);
    const main = current[0];
    const openTransfer = data.transfers.find(
      (transfer) =>
        transfer.id !== transferId &&
        isTransferEditable(transfer.status) &&
        transfer.items.some((item) => item.employee.id === employee.id),
    );

    return {
      id: employee.id,
      name: employee.name,
      nik: employee.nik,
      photo_url: employee.photo_url,
      employment_status: employee.employment_status,
      positions: current.map((assignment) => assignment.position.title).join(", ") || "-",
      brmLevel: main ? getBrmLevel(main.position.brm_level).label : "-",
      jobGrade: main?.position.job_grade ?? null,
      subUnit: main?.sub_unit.name ?? "-",
      placement: current.length > 0 ? PLACED : UNPLACED,
      openTransfer: openTransfer ? openTransferLabel(openTransfer) : null,
    };
  });
}

/**
 * Apakah karyawan ini boleh dipilih untuk jenis mutasi tersebut?
 *   - sedang ada di usulan lain yang belum selesai -> tidak boleh
 *   - Penempatan Awal                              -> hanya yang BELUM ditempatkan
 *   - Rotasi / Promosi / Demosi                    -> hanya yang SUDAH ditempatkan
 *   - Penugasan Sementara                          -> semua
 */
function canSelectFor(type: string, row: EmployeeRow | undefined): boolean {
  if (!row || !type || row.openTransfer) return false;
  if (type === INITIAL_PLACEMENT) return row.placement === UNPLACED;
  if (requiresFromAssignment(type)) return row.placement === PLACED;
  return true;
}

const col = createDataTableColumnHelper<EmployeeRow>();

/** Kolom tabel pilih karyawan: ☐ | No | Karyawan | Jabatan Sekarang | Level | Job Grade | Sub Unit | Status Karyawan | Penempatan */
const employeeTableConfig = defineTableConfig<EmployeeRow>({
  getRowId: (row) => row.id,
  emptyMessage: "Tidak ada karyawan yang cocok dengan pencarian atau filter.",
  tableClassName: "min-w-260",
  columns: col.columns([
    selectColumn<EmployeeRow>((row) => row.name),
    rowNumberColumn<EmployeeRow>(),

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
            {row.original.openTransfer && (
              <Badge variant="warning" dot={false}>
                Ada di usulan {row.original.openTransfer}
              </Badge>
            )}
          </div>
        </div>
      ),
    }),

    col.accessor("positions", {
      header: "Jabatan Sekarang",
      meta: { search: { placeholder: "Cari jabatan..." }, cellClassName: "text-fg-primary" },
    }),

    col.accessor("brmLevel", {
      header: "Level BRM",
      meta: { filter: { options: toFilterOptions(["BRM-1", "BRM-2", "BRM-3", "BRM-4", "BRM-5", "BRM-6", "-"]) }, nowrap: true },
    }),

    jobGradeColumn<EmployeeRow>((row) => row.jobGrade),

    col.accessor("subUnit", {
      header: "Sub Unit",
      meta: { search: { placeholder: "Cari sub unit..." }, cellClassName: "text-fg-secondary" },
    }),

    col.accessor("employment_status", {
      header: "Status Karyawan",
      meta: { filter: { options: toFilterOptions(EMPLOYMENT_STATUS_OPTIONS) }, nowrap: true },
      cell: ({ getValue }) => getValue().replace("Karyawan ", ""),
    }),

    col.accessor("placement", {
      header: "Penempatan",
      meta: { filter: { options: toFilterOptions([PLACED, UNPLACED]) }, nowrap: true },
      cell: ({ getValue }) => (
        <Badge variant={getValue() === PLACED ? "success" : "neutral"} dot={false}>
          {getValue()}
        </Badge>
      ),
    }),
  ]),
});

interface StepPilihKaryawanProps extends StepProps {
  /** Id usulan yang sedang diubah (null = usulan baru) */
  transferId: string | null;
}

/**
 * LANGKAH 1 — PILIH KARYAWAN
 *
 *   Jenis Mutasi   (○ Penempatan Awal  ○ Rotasi  ○ Promosi  ○ Demosi  ○ Penugasan Sementara)
 *   Tabel karyawan dengan kotak centang (cari, filter, urut); pilih satu atau banyak
 *
 * Karyawan yang tidak cocok dengan jenis mutasinya (mis. sudah punya jabatan untuk
 * Penempatan Awal) atau sedang ada di usulan lain tidak bisa dicentang.
 */
export function StepPilihKaryawan({ values, setValues, errors, disabled, data, transferId }: StepPilihKaryawanProps) {
  const rows = useMemo(() => toEmployeeRows(data, transferId), [data, transferId]);
  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);

  const selectedIds = values.items.map((item) => item.employee_id);

  /** Jenis mutasi diganti: karyawan yang tidak lagi cocok dikeluarkan, jabatan lama disesuaikan. */
  function changeType(type: string) {
    setValues((previous) => ({
      ...previous,
      type,
      items: adjustItemsToType(
        previous.items.filter((item) => canSelectFor(type, rowById.get(item.employee_id))),
        type,
        data.assignments,
      ),
    }));
  }

  /** Centang berubah: karyawan yang sudah ada tetap (isiannya tidak hilang), yang baru ditambahkan. */
  function changeSelection(employeeIds: string[]) {
    setValues((previous) => ({
      ...previous,
      items: employeeIds.map(
        (employeeId) =>
          previous.items.find((item) => item.employee_id === employeeId) ??
          newItem(employeeId, previous.type, data.assignments),
      ),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Jenis mutasi */}
      <FieldSet>
        <FieldLegend>Jenis Mutasi</FieldLegend>
        <RadioGroup
          value={values.type}
          onValueChange={changeType}
          disabled={disabled}
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          {TRANSFER_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`type-${option.value}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                values.type === option.value ? "border-primary bg-brand-subtle" : "border-border hover:bg-subtle",
              )}
            >
              <RadioGroupItem id={`type-${option.value}`} value={option.value} className="mt-0.5" />
              <span>
                <span className="block typo-label-m text-fg-heading">{option.value}</span>
                <span className="block typo-body-s text-fg-secondary">{option.description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
        <FieldError>{errors.type}</FieldError>
      </FieldSet>

      {/* Tabel karyawan. min-w-0: tabel yang lebar digeser di dalam kotaknya, bukan melebarkan halaman. */}
      <FieldSet className="min-w-0">
        <FieldLegend>Karyawan</FieldLegend>

        {!values.type ? (
          <Alert variant="info">
            <Info />
            <AlertDescription>Pilih jenis mutasi terlebih dahulu, lalu centang karyawannya.</AlertDescription>
          </Alert>
        ) : (
          <Alert variant="info">
            <Users />
            <AlertDescription>
              <p>
                <strong>{selectedIds.length} karyawan dipilih.</strong>{" "}
                {values.type === INITIAL_PLACEMENT
                  ? "Hanya karyawan yang belum ditempatkan yang bisa dipilih."
                  : requiresFromAssignment(values.type)
                    ? "Hanya karyawan yang sudah memegang jabatan yang bisa dipilih."
                    : "Karyawan yang sedang ada di usulan lain tidak bisa dipilih."}
              </p>
            </AlertDescription>
          </Alert>
        )}

        <DataTable
          config={employeeTableConfig}
          data={rows}
          selection={{
            selectedIds,
            onChange: changeSelection,
            canSelect: (id) => !disabled && canSelectFor(values.type, rowById.get(id)),
          }}
        />
        <FieldError>{errors.items}</FieldError>
      </FieldSet>
    </div>
  );
}

/** Cth. "Rotasi No. 2A44/P/2026.10.01-031 (Menunggu Dokumen)" atau "Promosi (Draf)". */
function openTransferLabel(transfer: TransferResource): string {
  const numberText = transfer.decree_number ? ` No. ${transfer.decree_number}` : "";
  return `${transfer.type}${numberText} (${transfer.status})`;
}
