"use client";

import { ArrowDown, Info, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@mestakara/ui/avatar";
import { Button } from "@mestakara/ui/button";
import { Checkbox } from "@mestakara/ui/checkbox";

import { SelectField, TextField } from "@/components/shared/FormFields";
import { withStatus } from "@/features/jabatan-karyawan/assignment-options";
import { PlacementFields, type PlacementValues } from "@/features/jabatan-karyawan/PlacementFields";
import { getInitials } from "@/lib/initials";
import { INITIAL_PLACEMENT, requiresFromAssignment, TEMPORARY_ASSIGNMENT } from "@/lib/transfer-rules";
import type { TransferItemPayload } from "@/types/api/transfer";

import { currentAssignmentsOf, itemErrorKey, type WizardData } from "./mutasi-form-values";

interface MutasiItemCardProps {
  item: TransferItemPayload;
  /** Jenis mutasi usulan (menentukan apakah jabatan lama wajib dipilih) */
  type: string;
  data: WizardData;
  errors: Record<string, string>;
  disabled: boolean;
  /** Jumlah bawahan yang bisa dikembalikan ke jabatan tujuan karyawan ini (dari perkiraan server) */
  restorableCount: number;
  onChange: (item: TransferItemPayload) => void;
  onRemove: () => void;
}

/**
 * Kartu SATU KARYAWAN di langkah "Atur Penugasan Baru":
 *
 *   [foto] Nama · NIK                                         [× Keluarkan]
 *   DARI  [jabatan lama yang diakhiri ▾]      (punya 4 bawahan aktif)
 *    ↓
 *   KE    Jabatan [cari]       Status Jabatan [▾]
 *         Sub Unit [▾]         Objek Penempatan [cari, bisa lebih dari satu]
 *         Atasan Langsung [cari, bisa lebih dari satu]
 *         TMT Selesai (Penugasan Sementara)   Keterangan
 *         ☐ Kembalikan 4 bawahan ke karyawan ini
 */
export function MutasiItemCard({
  item,
  type,
  data,
  errors,
  disabled,
  restorableCount,
  onChange,
  onRemove,
}: MutasiItemCardProps) {
  const employee = data.employees.find((entry) => entry.id === item.employee_id);
  const current = currentAssignmentsOf(item.employee_id, data.assignments);
  const position = data.positions.find((entry) => entry.id === item.position_id);
  const error = (field: keyof TransferItemPayload) => errors[itemErrorKey(item.id, field)];

  /** Bawahan aktif dari jabatan lama, yang nanti dialihkan otomatis. */
  const subordinateCount = item.from_assignment_id
    ? data.assignments.filter(
        (assignment) =>
          assignment.is_active && assignment.supervisors.some((supervisor) => supervisor.assignment_id === item.from_assignment_id),
      ).length
    : 0;

  /** Ubah satu isian karyawan ini. */
  function change<K extends keyof TransferItemPayload>(key: K, value: TransferItemPayload[K]) {
    onChange({ ...item, [key]: value });
  }

  /** Isian penempatan (jabatan baru) diubah lewat PlacementFields. */
  function changePlacement(placement: PlacementValues) {
    onChange({ ...item, ...placement });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      {/* Karyawan */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar>
            {employee?.photo_url && <AvatarImage src={employee.photo_url} alt={`Foto ${employee.name}`} />}
            <AvatarFallback>{getInitials(employee?.name ?? "-")}</AvatarFallback>
          </Avatar>
          <div>
            <p className="typo-label-m text-fg-heading">{employee?.name ?? "-"}</p>
            <p className="typo-body-s text-fg-tertiary">
              NIK {employee?.nik ?? "-"} · {employee?.employment_status ?? "-"}
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={disabled}>
          <X />
          Keluarkan
        </Button>
      </div>
      {error("employee_id") && <p className="typo-body-s text-fg-danger">{error("employee_id")}</p>}

      {/* DARI: jabatan lama */}
      <div className="rounded-md bg-subtle p-3">
        <p className="mb-2 typo-overline text-fg-tertiary">Dari</p>
        {type === INITIAL_PLACEMENT || current.length === 0 ? (
          <p className="typo-body-s text-fg-secondary">Belum memiliki jabatan</p>
        ) : (
          <SelectField
            id={`${item.id}-from`}
            label="Jabatan Lama yang Diakhiri"
            required={requiresFromAssignment(type)}
            options={current.map((assignment) => ({
              value: assignment.id,
              label: `${withStatus(assignment.assignment_status, assignment.position.title)} — ${assignment.sub_unit.name}`,
            }))}
            emptyLabel={requiresFromAssignment(type) ? undefined : "Tidak ada (merangkap jabatan)"}
            value={item.from_assignment_id}
            onChange={(value) => change("from_assignment_id", value)}
            error={error("from_assignment_id")}
            disabled={disabled}
            note={
              subordinateCount > 0
                ? `jabatan ini punya ${subordinateCount} bawahan aktif. Atasan mereka dialihkan otomatis (lihat langkah Tinjau).`
                : "berakhir sehari sebelum TMT Berlaku."
            }
          />
        )}
      </div>

      <ArrowDown className="mx-auto size-5 text-fg-tertiary" aria-hidden />

      {/* KE: jabatan baru */}
      <div className="flex flex-col gap-4 rounded-md border border-primary/30 p-3">
        <p className="typo-overline text-fg-brand">Ke</p>
        <PlacementFields
          idPrefix={item.id}
          values={item}
          employeeId={item.employee_id}
          data={data}
          errors={{
            position_id: error("position_id"),
            assignment_status: error("assignment_status"),
            sub_unit_id: error("sub_unit_id"),
            placement_object_ids: error("placement_object_ids"),
            supervisor_assignment_ids: error("supervisor_assignment_ids"),
            end_date: error("end_date"),
          }}
          disabled={disabled}
          showEndDate={type === TEMPORARY_ASSIGNMENT}
          onChange={changePlacement}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id={`${item.id}-notes`}
            label="Keterangan"
            value={item.notes}
            onChange={(value) => change("notes", value)}
            error={error("notes")}
            disabled={disabled}
            placeholder="Cth. Menggantikan pejabat yang pensiun"
          />
        </div>

        {/* Kembalikan bawahan: hanya muncul kalau memang ada yang bisa dikembalikan */}
        {restorableCount > 0 && (
          <label className="flex cursor-pointer items-start gap-3 rounded-md bg-brand-subtle p-3 typo-body-s">
            <Checkbox
              checked={item.restore_subordinates}
              onCheckedChange={(checked) => change("restore_subordinates", checked === true)}
              disabled={disabled}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium text-fg-heading">
                Kembalikan {restorableCount} bawahan ke karyawan ini
              </span>
              <span className="flex items-center gap-1 text-fg-secondary">
                <Info className="size-3.5" />
                Bawahan ini dulu dialihkan ke atasan berikutnya karena jabatan {position?.title ?? "ini"} kosong.
              </span>
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
