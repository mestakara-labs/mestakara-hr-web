"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { DateField, SearchSelectField, TextAreaField } from "@/components/shared/FormFields";
import { useApiGet } from "@/hooks/useApiGet";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { toDateText } from "@/lib/date";
import { apiPost } from "@/lib/http-client";
import { requireSelection, requireText } from "@/lib/validation";
import type { CostCenterResource } from "@/types/api/cost-center";
import type { CurrentCostCenter, EmployeeCostCenterPayload } from "@/types/api/wage";

interface EmployeeCostCenterDialogProps {
  open: boolean;
  employeeId: string;
  /** Cost center yang berlaku sekarang (untuk isian awal). null = belum ada. */
  current: CurrentCostCenter | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Dialog UBAH COST CENTER karyawan (pilihan dari master Cost Center). Simpan = menambah catatan
 * riwayat baru; cost center lama tetap tersimpan.
 *
 *   Cost Center [4A44AGR007 — Tiket & Parkir ▾]
 *   Berlaku Mulai [25 Okt 2026]   Keterangan [...]
 */
export function EmployeeCostCenterDialog(props: EmployeeCostCenterDialogProps) {
  if (!props.open) return null;
  // Dibuat ulang setiap kali dibuka, supaya isian diisi ulang dari cost center yang berlaku.
  return <EmployeeCostCenterDialogContent {...props} />;
}

function EmployeeCostCenterDialogContent({ employeeId, current, onClose, onSaved }: EmployeeCostCenterDialogProps) {
  const { data: costCenters } = useApiGet<CostCenterResource[]>("/api/cost-centers");
  const [values, setValues] = useState<EmployeeCostCenterPayload>({
    cost_center_id: current?.id ?? "",
    effective_date: toDateText(new Date()),
    notes: "",
  });

  const options = (costCenters ?? []).map((costCenter) => ({
    value: costCenter.id,
    label: `${costCenter.code} — ${costCenter.name}`,
  }));

  const { submit, clearError, saving, errors, formError } = useFormSubmit<EmployeeCostCenterPayload>({
    validate: (form) => ({
      cost_center_id: requireSelection(form.cost_center_id, "Cost Center"),
      effective_date: requireText(form.effective_date, "Berlaku Mulai"),
    }),
    onSubmit: async (form) => {
      await apiPost(`/api/employees/${employeeId}/cost-centers`, form);
      toast.success("Cost center berhasil disimpan");
      onSaved();
      onClose();
    },
  });

  /** Ubah satu isian, sekaligus hapus pesan error isian itu. */
  function changeValue(key: keyof EmployeeCostCenterPayload, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  return (
    <FormDialog
      open
      title={current ? "Ubah Cost Center" : "Isi Cost Center"}
      description="Cost center lama tetap tersimpan di riwayat."
      saveLabel={saving ? "Menyimpan..." : "Simpan Cost Center"}
      onSave={() => submit(values)}
      onClose={onClose}
    >
      {formError && (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <SearchSelectField
        id="cost_center_id"
        label="Cost Center"
        required
        options={options}
        value={values.cost_center_id}
        onChange={(value) => changeValue("cost_center_id", value)}
        error={errors.cost_center_id}
        disabled={saving}
        placeholder="Cari kode atau uraian..."
        emptyMessage="Tidak ada cost center yang cocok. Tambahkan dulu di menu Cost Center."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <DateField
          id="effective_date"
          label="Berlaku Mulai"
          required
          value={values.effective_date}
          onChange={(value) => changeValue("effective_date", value)}
          error={errors.effective_date}
          disabled={saving}
        />
        <TextAreaField
          id="notes"
          label="Keterangan"
          value={values.notes}
          onChange={(value) => changeValue("notes", value)}
          error={errors.notes}
          disabled={saving}
          placeholder="Cth. Pindah ke Café & Resto"
          note="opsional."
        />
      </div>
    </FormDialog>
  );
}
