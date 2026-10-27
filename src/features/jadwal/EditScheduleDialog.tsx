"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { SelectField, TextAreaField } from "@/components/shared/FormFields";
import { ShiftBadge } from "@/features/shift/ShiftBadge";
import { useApiGet } from "@/hooks/useApiGet";
import { formatDate, formatDateTime, formatDayName } from "@/lib/date";
import { ApiError, apiPut } from "@/lib/http-client";
import { isChangeReasonRequired } from "@/lib/schedule-period-rules";
import { formatShiftTime } from "@/lib/shift-rules";
import type { ScheduleChangeResource, ScheduleEntryResource } from "@/types/api/schedule";
import type { ShiftResource } from "@/types/api/shift";

interface EditScheduleDialogProps {
  /** Sel yang diubah. null = dialog tertutup. */
  entry: ScheduleEntryResource | null;
  /** Status periode, untuk menentukan alasan wajib atau tidak */
  periodStatus: string;
  shifts: ShiftResource[];
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Dialog UBAH JADWAL satu sel:
 *
 *   Asep Firmansyah · Rabu, 14 Oktober 2026
 *   Sekarang: [T] Tengah 10.00–14.00      Sesuai pola: [T]
 *   Shift Baru [▾ Libur / P / T / ...]
 *   Alasan (wajib kalau jadwal sudah Terbit)
 *   Riwayat perubahan sel ini
 */
export function EditScheduleDialog(props: EditScheduleDialogProps) {
  if (!props.entry) return null;
  return <EditScheduleDialogContent key={props.entry.id} {...props} entry={props.entry} />;
}

function EditScheduleDialogContent({
  entry,
  periodStatus,
  shifts,
  onClose,
  onSaved,
}: EditScheduleDialogProps & { entry: ScheduleEntryResource }) {
  const [shiftId, setShiftId] = useState(entry.shift_id ?? "");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { data: changes } = useApiGet<ScheduleChangeResource[]>(`/api/schedules/${entry.id}/changes`);

  const reasonRequired = isChangeReasonRequired(periodStatus);
  const shiftOf = (id: string | null) => shifts.find((shift) => shift.id === id);

  async function save() {
    const checkErrors: Record<string, string> = {};
    if ((shiftId || null) === entry.shift_id) checkErrors.shift_id = "Pilih shift yang berbeda";
    if (reasonRequired && !reason.trim()) checkErrors.reason = "Alasan wajib diisi karena jadwal sudah diterbitkan";
    setErrors(checkErrors);
    if (Object.keys(checkErrors).length > 0) return;

    setSaving(true);
    try {
      const response = await apiPut(`/api/schedules/${entry.id}`, { shift_id: shiftId, reason });
      toast.success(response.message);
      onSaved();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(Object.fromEntries(Object.entries(error.errors).map(([field, messages]) => [field, messages[0]])));
      } else {
        toast.error(error instanceof ApiError ? error.message : "Jadwal gagal diubah.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog
      open
      title="Ubah Jadwal"
      description={`${entry.employee.name} · ${formatDayName(entry.work_date)}, ${formatDate(entry.work_date)}`}
      saveLabel={saving ? "Menyimpan..." : "Simpan Perubahan"}
      onSave={save}
      onClose={onClose}
    >
      <div className="grid gap-3 rounded-lg bg-subtle p-3 typo-body-s sm:grid-cols-2">
        <ShiftLine label="Sekarang" shift={shiftOf(entry.shift_id)} />
        <ShiftLine label="Sesuai pola" shift={shiftOf(entry.generated_shift_id)} />
      </div>

      <SelectField
        id="shift_id"
        label="Shift Baru"
        required
        options={shifts.map((shift) => ({
          value: shift.id,
          label: `${shift.code} — ${shift.name} (${formatShiftTime(shift.start_time, shift.end_time)})`,
        }))}
        emptyLabel="Libur"
        value={shiftId}
        onChange={(value) => {
          setShiftId(value);
          setErrors((previous) => ({ ...previous, shift_id: "" }));
        }}
        error={errors.shift_id}
        disabled={saving}
      />
      <TextAreaField
        id="reason"
        label="Alasan"
        required={reasonRequired}
        value={reason}
        onChange={(value) => {
          setReason(value);
          setErrors((previous) => ({ ...previous, reason: "" }));
        }}
        error={errors.reason}
        disabled={saving}
        placeholder="Cth. Tukar shift dengan Rina karena urusan keluarga"
        note={reasonRequired ? "wajib, karena jadwal sudah diterbitkan dan dilihat karyawan." : "opsional selama jadwal masih Draf."}
      />

      {changes && changes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 typo-label-m text-fg-heading">
            <History className="size-4" />
            Riwayat Perubahan
          </p>
          <ul className="flex flex-col gap-2 typo-body-s">
            {changes.map((change) => (
              <li key={change.id} className="rounded-md border border-border p-2">
                <p className="text-fg-primary">
                  {shiftOf(change.old_shift_id)?.code ?? "Libur"} → {shiftOf(change.new_shift_id)?.code ?? "Libur"}
                  {change.reason && <span className="text-fg-secondary"> · {change.reason}</span>}
                </p>
                <p className="text-xs text-fg-tertiary">
                  {formatDateTime(change.changed_at)} oleh {change.changed_by}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </FormDialog>
  );
}

/** "Sekarang: [T] Tengah 10.00–14.00" atau "Sekarang: Libur". */
function ShiftLine({ label, shift }: { label: string; shift: ShiftResource | undefined }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-fg-tertiary">{label}:</span>
      {shift ? (
        <>
          <ShiftBadge shift={shift} showName />
          <span className="text-fg-secondary">{formatShiftTime(shift.start_time, shift.end_time)}</span>
        </>
      ) : (
        <span className="font-medium text-fg-heading">Libur</span>
      )}
    </div>
  );
}
