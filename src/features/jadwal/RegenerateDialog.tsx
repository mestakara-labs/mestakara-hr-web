"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@mestakara/ui/checkbox";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { FormDialog } from "@/components/shared/FormDialog";
import { DateField, TextAreaField } from "@/components/shared/FormFields";
import { formatDate, toDateText } from "@/lib/date";
import { ApiError, apiPost } from "@/lib/http-client";
import { formatMonth, isChangeReasonRequired } from "@/lib/schedule-period-rules";
import type {
  RegenerateChange,
  RegeneratePayload,
  RegeneratePreviewResource,
  SchedulePeriodDetailResource,
} from "@/types/api/schedule";
import type { ShiftResource } from "@/types/api/shift";

interface RegenerateDialogProps {
  /** Periode yang dibuat ulang. null = dialog tertutup. */
  period: SchedulePeriodDetailResource | null;
  shifts: ShiftResource[];
  onClose: () => void;
  onDone: () => void;
}

/** Banyaknya contoh baris yang ditampilkan per kelompok perubahan. */
const SAMPLE_SIZE = 6;

/**
 * Dialog BUAT ULANG JADWAL DARI TANGGAL (mis. setelah anggota keluar/masuk atau pola diubah):
 *
 *   Mulai Tanggal [📅]    [✓] Pertahankan ubahan manual
 *   Alasan (wajib kalau jadwal sudah Terbit)
 *   Pratinjau: +8 baris baru · −8 dihapus · 3 berubah · 1 bentrok · 100 tetap
 *     contoh baris per kelompok (nama, tanggal, shift lama -> baru)
 *   [Batal] [Terapkan]
 *
 * Pratinjau dihitung ulang setiap kali tanggal atau pilihan "pertahankan" diubah.
 */
export function RegenerateDialog(props: RegenerateDialogProps) {
  if (!props.period) return null;
  return <RegenerateDialogContent key={props.period.id} {...props} period={props.period} />;
}

function RegenerateDialogContent({
  period,
  shifts,
  onClose,
  onDone,
}: RegenerateDialogProps & { period: SchedulePeriodDetailResource }) {
  const firstDate = period.dates[0];
  const lastDate = period.dates[period.dates.length - 1];
  const today = toDateText(new Date());

  const [values, setValues] = useState<RegeneratePayload>({
    // Bawaan: hari ini kalau masih di dalam bulan jadwal, kalau tidak tanggal 1.
    from_date: today >= firstDate && today <= lastDate ? today : firstDate,
    keep_manual: true,
    reason: "",
  });
  const [preview, setPreview] = useState<RegeneratePreviewResource | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const reasonRequired = isChangeReasonRequired(period.status);

  // Hitung ulang pratinjau setiap kali tanggal / pilihan "pertahankan" berubah.
  useEffect(() => {
    let isCancelled = false;
    apiPost<RegeneratePreviewResource>(`/api/schedule-periods/${period.id}/regenerate/preview`, {
      from_date: values.from_date,
      keep_manual: values.keep_manual,
      reason: "",
    })
      .then((response) => {
        if (!isCancelled) {
          setPreview(response.data);
          setPreviewError(null);
        }
      })
      .catch((error) => {
        if (!isCancelled) setPreviewError(error instanceof ApiError ? error.message : "Pratinjau gagal dihitung.");
      });
    return () => {
      isCancelled = true;
    };
  }, [period.id, values.from_date, values.keep_manual]);

  const totalChanges = preview
    ? preview.added.length + preview.removed.length + preview.changed.length + preview.conflicts.length
    : 0;

  async function apply() {
    if (reasonRequired && !values.reason.trim()) {
      setErrors({ reason: "Alasan wajib diisi karena jadwal sudah diterbitkan" });
      return;
    }
    if (preview && preview.added.length + preview.removed.length + preview.changed.length === 0) {
      toast.info("Tidak ada yang perlu dibuat ulang; jadwal sudah sesuai pola.");
      return;
    }

    setSaving(true);
    try {
      const response = await apiPost(`/api/schedule-periods/${period.id}/regenerate`, values);
      toast.success(response.message);
      onDone();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(Object.fromEntries(Object.entries(error.errors).map(([field, messages]) => [field, messages[0]])));
      } else {
        toast.error(error instanceof ApiError ? error.message : "Jadwal gagal dibuat ulang.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog
      open
      title="Buat Ulang Jadwal dari Tanggal"
      description={`${period.group.name} · ${formatMonth(period.month)}. Dipakai setelah anggota keluar/masuk atau pola diubah.`}
      saveLabel={saving ? "Menerapkan..." : "Terapkan"}
      onSave={apply}
      onClose={onClose}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <DateField
          id="from_date"
          label="Mulai Tanggal"
          required
          value={values.from_date}
          onChange={(value) => {
            setValues((previous) => ({ ...previous, from_date: value }));
            setErrors({});
          }}
          error={errors.from_date}
          disabled={saving}
          fromYear={2020}
          note={`sampai ${formatDate(lastDate)}. Tanggal sebelumnya tidak diubah.`}
        />
        <label className="flex items-start gap-2 pt-7 typo-body-s text-fg-primary">
          <Checkbox
            checked={values.keep_manual}
            onCheckedChange={(checked) => setValues((previous) => ({ ...previous, keep_manual: checked === true }))}
            disabled={saving}
          />
          <span>
            Pertahankan ubahan manual
            <span className="block text-xs text-fg-tertiary">
              Sel yang sudah diubah tangan (titik kuning) tidak ditimpa.
            </span>
          </span>
        </label>
      </div>

      <TextAreaField
        id="reason"
        label="Alasan"
        required={reasonRequired}
        value={values.reason}
        onChange={(value) => {
          setValues((previous) => ({ ...previous, reason: value }));
          setErrors({});
        }}
        error={errors.reason}
        disabled={saving}
        placeholder="Cth. Agus keluar, digantikan Ujang mulai 17 Oktober"
        note={reasonRequired ? "wajib; dicatat di riwayat setiap sel yang berubah." : "opsional selama jadwal masih Draf."}
      />

      <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
        <p className="typo-label-m text-fg-heading">Pratinjau Perubahan</p>
        {previewError && <p className="typo-body-s text-fg-danger">{previewError}</p>}
        {!preview && !previewError && (
          <p className="flex items-center gap-2 typo-body-s text-fg-tertiary">
            <Spinner /> Menghitung...
          </p>
        )}
        {preview && (
          <>
            <p className="typo-body-s text-fg-secondary">
              <strong className="text-fg-heading">{preview.added.length}</strong> baris baru ·{" "}
              <strong className="text-fg-heading">{preview.removed.length}</strong> dihapus ·{" "}
              <strong className="text-fg-heading">{preview.changed.length}</strong> berubah ·{" "}
              <strong className={preview.conflicts.length > 0 ? "text-fg-warning" : "text-fg-heading"}>
                {preview.conflicts.length}
              </strong>{" "}
              bentrok (ubahan manual dipertahankan) · {preview.unchanged_count} tetap
            </p>
            {totalChanges === 0 && (
              <p className="typo-body-s text-fg-tertiary">Jadwal sudah sesuai pola; tidak ada yang berubah.</p>
            )}
            <ChangeList title="Baris baru" items={preview.added} shifts={shifts} />
            <ChangeList title="Dihapus" items={preview.removed} shifts={shifts} />
            <ChangeList title="Berubah" items={preview.changed} shifts={shifts} />
            <ChangeList title="Bentrok (dipertahankan)" items={preview.conflicts} shifts={shifts} />
          </>
        )}
      </div>
    </FormDialog>
  );
}

/** Contoh baris satu kelompok perubahan, mis. "Ujang · 17 Okt 2026 · L → P". */
function ChangeList({ title, items, shifts }: { title: string; items: RegenerateChange[]; shifts: ShiftResource[] }) {
  if (items.length === 0) return null;
  const code = (shiftId: string | null) => shifts.find((shift) => shift.id === shiftId)?.code ?? "L";

  return (
    <div>
      <p className="text-xs font-medium text-fg-secondary">{title}</p>
      <ul className="mt-1 flex flex-col gap-0.5 typo-body-s text-fg-primary">
        {items.slice(0, SAMPLE_SIZE).map((item) => (
          <li key={`${item.employee_name}-${item.date}`}>
            {item.employee_name} · {formatDate(item.date)} · {code(item.old_shift_id)} → {code(item.new_shift_id)}
          </li>
        ))}
        {items.length > SAMPLE_SIZE && (
          <li className="text-xs text-fg-tertiary">dan {items.length - SAMPLE_SIZE} lainnya</li>
        )}
      </ul>
    </div>
  );
}
