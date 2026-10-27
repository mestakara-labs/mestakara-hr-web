"use client";

import type { Dispatch, SetStateAction } from "react";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Checkbox } from "@mestakara/ui/checkbox";

import { PlacementFields, type PlacementValues } from "@/features/jabatan-karyawan/PlacementFields";

import {
  itemErrorKey,
  type PenambahanData,
  type PenambahanFormValues,
  type PenambahanItemValues,
  type StepErrors,
} from "./penambahan-form-values";

interface StepPenempatanProps {
  values: PenambahanFormValues;
  setValues: Dispatch<SetStateAction<PenambahanFormValues>>;
  errors: StepErrors;
  disabled: boolean;
  data: PenambahanData;
}

/**
 * LANGKAH 3 — PENEMPATAN (boleh dilewati)
 *
 *   ☑ Tempatkan Asep Saepudin di jabatan saat usulan berlaku
 *       Jabatan · Status · Sub Unit · Objek · Atasan · TMT Selesai   (PlacementFields)
 *   ☐ Tempatkan Rina ...  -> belum ditempatkan; nanti lewat Mutasi (Penempatan Awal)
 */
export function StepPenempatan({ values, setValues, errors, disabled, data }: StepPenempatanProps) {
  function changeItem(itemId: string, changes: Partial<PenambahanItemValues>) {
    setValues((previous) => ({
      ...previous,
      items: previous.items.map((item) => (item.id === itemId ? { ...item, ...changes } : item)),
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        <Info />
        <AlertDescription>
          <p>
            Langkah ini <strong>boleh dilewati</strong>. Karyawan yang dicentang langsung mendapat jabatan mulai TMT
            Aktif-nya; yang tidak dicentang bisa ditempatkan nanti lewat Mutasi &amp; Penempatan (Penempatan Awal).
          </p>
        </AlertDescription>
      </Alert>

      {values.items.map((item) => {
        const employee = data.employees.find((entry) => entry.id === item.employee_id);
        const error = (field: keyof PlacementValues) => errors[itemErrorKey(item.id, field)];

        return (
          <div key={item.id} className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <Checkbox
                checked={item.has_placement}
                onCheckedChange={(checked) => changeItem(item.id, { has_placement: checked === true })}
                disabled={disabled}
              />
              <span>
                <span className="block typo-label-m text-fg-heading">Tempatkan {employee?.name ?? "-"} di jabatan</span>
                <span className="block typo-body-s text-fg-tertiary">
                  {item.has_placement ? "Penugasan dibuat saat usulan berlaku." : "Belum ditempatkan."}
                </span>
              </span>
            </label>

            {item.has_placement && (
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
                showEndDate
                onChange={(placement) => changeItem(item.id, placement)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
