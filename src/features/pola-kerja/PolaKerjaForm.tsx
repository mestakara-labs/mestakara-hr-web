"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FieldError, FieldLegend, FieldSet } from "@mestakara/ui/field";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { TextAreaField, TextField } from "@/components/shared/FormFields";
import { useApiGet } from "@/hooks/useApiGet";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost, apiPut } from "@/lib/http-client";
import { DEFAULT_DAY_VIEW, MAX_CYCLE_DAYS, resizeShiftIds, type DayView } from "@/lib/work-pattern-rules";
import type { ShiftResource } from "@/types/api/shift";
import type { PatternSlotPayload, WorkPatternResource } from "@/types/api/work-pattern";

import { DayViewToolbar } from "./DayViewToolbar";
import { initialValues, parseCycleDays, toPayload, validatePolaForm, type PolaFormValues } from "./pola-form-values";
import { PatternSlotEditor } from "./PatternSlotEditor";
import { PatternSummary } from "./PatternSummary";

const LIST_URL = "/dashboard/jadwal/pola";

/**
 * Form tambah / ubah POLA KERJA. Daftar shift diambil dulu untuk pilihan di editor.
 *
 *   Nama Pola [..........]      Panjang Siklus [7] hari
 *   Keterangan
 *   Tampilkan [Hari ke-n | Nama Hari]  (DayViewToolbar, hanya tampilan)
 *   Slot × Hari   (PatternSlotEditor)
 *   Ringkasan     (PatternSummary: jumlah slot per shift, beban kerja per slot)
 */
export function PolaKerjaForm({ pattern }: { pattern?: WorkPatternResource }) {
  const { data: shifts, loading, error } = useApiGet<ShiftResource[]>("/api/shifts");

  if (loading) return <PageLoading label="Memuat data shift..." />;
  if (error || !shifts) return <PageError message={error ?? "Data shift gagal dimuat."} />;

  return <PolaKerjaFormContent pattern={pattern} shifts={shifts} />;
}

function PolaKerjaFormContent({ pattern, shifts }: { pattern?: WorkPatternResource; shifts: ShiftResource[] }) {
  const router = useRouter();
  const isEdit = pattern !== undefined;
  const [values, setValues] = useState<PolaFormValues>(() => initialValues(pattern));
  // Panjang siklus yang sedang dipakai editor (isian yang belum benar tidak mengubah editor).
  const [cycleDays, setCycleDays] = useState(() => parseCycleDays(values.cycle_days) ?? 7);
  // Tampilan judul hari (Hari ke-n / nama hari). Hanya tampilan, tidak ikut disimpan.
  const [dayView, setDayView] = useState<DayView>(DEFAULT_DAY_VIEW);

  const { submit, saving, errors, formError, clearError } = useFormSubmit<PolaFormValues>({
    validate: validatePolaForm,
    onSubmit: async (form) => {
      if (isEdit) {
        await apiPut(`/api/work-patterns/${pattern.id}`, toPayload(form));
        toast.success(`Pola "${form.name}" berhasil diperbarui`);
      } else {
        await apiPost("/api/work-patterns", toPayload(form));
        toast.success(`Pola "${form.name}" berhasil ditambahkan`);
      }
      router.push(LIST_URL);
    },
  });
  // Error per slot dari server memakai nama isian "slots.<index>.<isian>".
  const allErrors = errors as Record<string, string | undefined>;

  /** Panjang siklus diubah -> kalau angkanya sah, isi hari setiap slot ikut dipanjangkan/dipendekkan. */
  function changeCycleDays(text: string) {
    clearError("cycle_days");
    const days = parseCycleDays(text);
    setValues((previous) => ({
      ...previous,
      cycle_days: text,
      slots: days ? previous.slots.map((slot) => ({ ...slot, shift_ids: resizeShiftIds(slot.shift_ids, days) })) : previous.slots,
    }));
    if (days) setCycleDays(days);
  }

  function changeSlots(slots: PatternSlotPayload[]) {
    setValues((previous) => ({ ...previous, slots }));
    clearError("slots");
  }

  return (
    <FormPageLayout
      title={isEdit ? "Edit Pola Kerja" : "Tambah Pola Kerja"}
      description="Susun template shift per slot (posisi) untuk satu siklus. Regu kerja memakai pola ini untuk membuat jadwal."
      backHref={LIST_URL}
      formError={formError}
      saving={saving}
      submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Pola Kerja"}
      onSubmit={() => submit(values)}
    >
      <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
        <TextField
          id="name"
          label="Nama Pola"
          required
          value={values.name}
          onChange={(value) => {
            setValues((previous) => ({ ...previous, name: value }));
            clearError("name");
          }}
          error={errors.name}
          disabled={saving}
          placeholder="Cth. 07–17 Tiga Shift + Tengah"
        />
        <TextField
          id="cycle_days"
          label="Panjang Siklus (hari)"
          required
          inputMode="numeric"
          value={values.cycle_days}
          onChange={changeCycleDays}
          error={errors.cycle_days}
          disabled={saving}
          note={`1–${MAX_CYCLE_DAYS} hari. Hari ke-1 mengikuti Tanggal Mulai Berlaku Jadwal di regu kerja.`}
        />
      </div>
      <TextAreaField
        id="description"
        label="Keterangan"
        value={values.description}
        onChange={(value) => setValues((previous) => ({ ...previous, description: value }))}
        disabled={saving}
        placeholder="Cth. Senin–Jumat bergantian libur, Sabtu–Minggu semua masuk"
      />

      <FieldSet className="min-w-0">
        <FieldLegend>Slot × Hari Siklus</FieldLegend>
        <DayViewToolbar view={dayView} onChange={setDayView} />
        <PatternSlotEditor
          slots={values.slots}
          cycleDays={cycleDays}
          dayView={dayView}
          shifts={shifts}
          onChange={changeSlots}
          errors={allErrors}
          disabled={saving}
        />
        <FieldError>{errors.slots}</FieldError>
      </FieldSet>

      <FieldSet className="min-w-0">
        <FieldLegend>Ringkasan Pola</FieldLegend>
        <PatternSummary slots={values.slots} cycleDays={cycleDays} dayView={dayView} shifts={shifts} />
      </FieldSet>
    </FormPageLayout>
  );
}
