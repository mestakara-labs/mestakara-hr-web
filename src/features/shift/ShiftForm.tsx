"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { FieldLegend, FieldSet } from "@mestakara/ui/field";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { TextAreaField, TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost, apiPut } from "@/lib/http-client";
import {
  crossesMidnight,
  formatMinutes,
  formatShiftTime,
  isValidTime,
  shiftDurationMinutes,
} from "@/lib/shift-rules";
import type { ShiftResource } from "@/types/api/shift";

import { ShiftBadge } from "./ShiftBadge";
import { ShiftColorPicker } from "./ShiftColorPicker";
import { initialValues, toPayload, validateShiftForm, type ShiftFormValues } from "./shift-form-values";

const LIST_URL = "/dashboard/jadwal/shift";

/**
 * Form tambah / ubah SHIFT:
 *
 *   Kode [P]          Nama [Pagi]
 *   Jam Mulai [07:00] Jam Selesai [12:00]
 *   (i) 07.00–12.00 · lama 5 jam · kerja bersih 5 jam        <- dihitung otomatis
 *   Aturan Absensi: Istirahat, Toleransi Terlambat, Batas Scan Masuk, Batas Scan Pulang
 *   Warna (palet tema / kode HEX-RGB-HSL)   Keterangan
 */
export function ShiftForm({ shift }: { shift?: ShiftResource }) {
  const router = useRouter();
  const isEdit = shift !== undefined;
  const [values, setValues] = useState<ShiftFormValues>(() => initialValues(shift));

  const { submit, saving, errors, formError, clearError } = useFormSubmit<ShiftFormValues>({
    validate: validateShiftForm,
    onSubmit: async (form) => {
      if (isEdit) {
        await apiPut(`/api/shifts/${shift.id}`, toPayload(form));
        toast.success(`Shift "${form.name}" berhasil diperbarui`);
      } else {
        await apiPost("/api/shifts", toPayload(form));
        toast.success(`Shift "${form.name}" berhasil ditambahkan`);
      }
      router.push(LIST_URL);
    },
  });

  /** Ubah satu isian; pesan error isian itu dihapus. */
  function change(key: keyof ShiftFormValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  return (
    <FormPageLayout
      title={isEdit ? "Edit Shift" : "Tambah Shift"}
      description="Atur jam kerja satu shift beserta aturan absensinya."
      backHref={LIST_URL}
      formError={formError}
      saving={saving}
      submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Shift"}
      onSubmit={() => submit(values)}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          id="code"
          label="Kode Shift"
          required
          value={values.code}
          onChange={(value) => change("code", value.toUpperCase())}
          error={errors.code}
          disabled={saving}
          placeholder="Cth. P"
          note="maksimal 4 karakter, tampil di kalender jadwal. Boleh sama dengan shift lain; bedakan lewat warna."
        />
        <TextField
          id="name"
          label="Nama Shift"
          required
          value={values.name}
          onChange={(value) => change("name", value)}
          error={errors.name}
          disabled={saving}
          placeholder="Cth. Pagi"
        />
        <TextField
          id="start_time"
          label="Jam Mulai"
          required
          type="time"
          value={values.start_time}
          onChange={(value) => change("start_time", value)}
          error={errors.start_time}
          disabled={saving}
        />
        <TextField
          id="end_time"
          label="Jam Selesai"
          required
          type="time"
          value={values.end_time}
          onChange={(value) => change("end_time", value)}
          error={errors.end_time}
          disabled={saving}
          note="kalau lebih awal dari Jam Mulai, shift selesai keesokan harinya (mis. 22:00–06:00)."
        />
      </div>

      <ShiftSummary values={values} />

      <FieldSet>
        <FieldLegend>Aturan Absensi</FieldLegend>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            id="break_minutes"
            label="Istirahat (menit)"
            required
            inputMode="numeric"
            value={values.break_minutes}
            onChange={(value) => change("break_minutes", value)}
            error={errors.break_minutes}
            disabled={saving}
            note="tidak dihitung sebagai jam kerja."
          />
          <TextField
            id="late_tolerance_minutes"
            label="Toleransi Terlambat (menit)"
            required
            inputMode="numeric"
            value={values.late_tolerance_minutes}
            onChange={(value) => change("late_tolerance_minutes", value)}
            error={errors.late_tolerance_minutes}
            disabled={saving}
            note="terlambat sampai sekian menit masih dianggap tepat waktu."
          />
          <TextField
            id="checkin_window_before_minutes"
            label="Batas Scan Masuk (menit sebelum mulai)"
            required
            inputMode="numeric"
            value={values.checkin_window_before_minutes}
            onChange={(value) => change("checkin_window_before_minutes", value)}
            error={errors.checkin_window_before_minutes}
            disabled={saving}
            note="scan masuk sebelum batas ini tidak dihitung, mis. 120 = mulai 2 jam sebelumnya."
          />
          <TextField
            id="checkout_window_after_minutes"
            label="Batas Scan Pulang (menit setelah selesai)"
            required
            inputMode="numeric"
            value={values.checkout_window_after_minutes}
            onChange={(value) => change("checkout_window_after_minutes", value)}
            error={errors.checkout_window_after_minutes}
            disabled={saving}
            note="scan pulang setelah batas ini tidak dihitung, mis. 240 = sampai 4 jam sesudahnya."
          />
        </div>
      </FieldSet>

      <div className="grid gap-5 md:grid-cols-2">
        <ShiftColorPicker
          value={values.color}
          onChange={(value) => change("color", value)}
          error={errors.color}
          disabled={saving}
        />
        <TextAreaField
          id="description"
          label="Keterangan"
          value={values.description}
          onChange={(value) => change("description", value)}
          disabled={saving}
          placeholder="Cth. Dipakai regu House Keeping"
        />
      </div>
    </FormPageLayout>
  );
}

/**
 * Ringkasan yang dihitung otomatis dari isian jam, mis.
 *   [P] Pagi · 07.00–12.00 · lama 5 jam · kerja bersih 5 jam
 * Tidak tampil sebelum jam mulai & selesai diisi dengan benar.
 */
function ShiftSummary({ values }: { values: ShiftFormValues }) {
  if (!isValidTime(values.start_time) || !isValidTime(values.end_time) || values.start_time === values.end_time) {
    return null;
  }

  const duration = shiftDurationMinutes(values.start_time, values.end_time);
  const breakMinutes = Number(values.break_minutes) || 0;

  return (
    <Alert variant="info">
      <Clock />
      <AlertDescription>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {values.code && values.color && (
            <ShiftBadge
              shift={{ ...values, name: values.name || "Shift" }}
              showName={Boolean(values.name)}
            />
          )}
          <span>
            {formatShiftTime(values.start_time, values.end_time)} · lama {formatMinutes(duration)} · kerja bersih{" "}
            {formatMinutes(Math.max(duration - breakMinutes, 0))}
          </span>
          {crossesMidnight(values.start_time, values.end_time) && (
            <strong>Selesai keesokan harinya; absensi dicatat pada tanggal mulai shift.</strong>
          )}
        </p>
      </AlertDescription>
    </Alert>
  );
}
