"use client";

import { useState } from "react";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { TextAreaField, TextField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { formatDateTime } from "@/lib/date";
import { apiPut } from "@/lib/http-client";
import type { OvertimeSettingResource } from "@/types/api/overtime-setting";

import { OvertimeExample } from "./OvertimeExample";
import {
  NUMBER_FIELDS,
  parseDecimal,
  toForm,
  toPayload,
  validate,
  type PengaturanLemburFormValues,
} from "./pengaturan-lembur-form-values";

/**
 * Form PENGATURAN LEMBUR:
 *
 *   Aturan perhitungan   [173] [1,5] [2] [4] [18] [100] [30]
 *   Contoh perhitungan   (dihitung ulang setiap isian diubah)
 *   Rekomendasi Lembur DW: Jam mulai [17:00]  Uraian bawaan [...]
 *                                                    [Batal] [Simpan Pengaturan]
 *
 * Penanda tangan SPKL & Daftar Upah diatur di menu Penanda Tangan.
 */
interface PengaturanLemburFormProps {
  setting: OvertimeSettingResource;
  /** Dipanggil setelah berhasil disimpan, untuk memuat ulang pengaturan dari server */
  onSaved: () => void;
}

export function PengaturanLemburForm({ setting, onSaved }: PengaturanLemburFormProps) {
  const [values, setValues] = useState<PengaturanLemburFormValues>(() => toForm(setting));

  const { submit, clearError, saving, errors, formError } = useFormSubmit<PengaturanLemburFormValues>({
    validate,
    onSubmit: async (form) => {
      await apiPut("/api/overtime-settings", toPayload(form));
      toast.success("Pengaturan lembur berhasil disimpan");
      // Muat ulang supaya keterangan "terakhir diubah" ikut diperbarui.
      onSaved();
    },
  });

  /** Ubah satu isian, sekaligus hapus pesan error isian itu. */
  function changeValue<K extends keyof PengaturanLemburFormValues>(key: K, value: PengaturanLemburFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  // Angka untuk contoh perhitungan, langsung dari isian yang sedang diketik.
  const rates = {
    hourly_divisor: parseDecimal(values.hourly_divisor),
    first_hour_multiplier: parseDecimal(values.first_hour_multiplier),
    next_hour_multiplier: parseDecimal(values.next_hour_multiplier),
    rounding: parseDecimal(values.rounding),
  };

  const lastUpdated = setting.updated_at
    ? `Terakhir diubah ${formatDateTime(setting.updated_at)}${setting.updated_by ? ` oleh ${setting.updated_by}` : ""}.`
    : "Masih memakai nilai bawaan.";

  return (
    <FormPageLayout
      title="Pengaturan Lembur"
      description={`Aturan perhitungan lembur reguler & DW (mengikuti regulasi yang berlaku) dan bawaan rekomendasi Lembur DW. ${lastUpdated}`}
      backHref="/dashboard"
      formError={formError}
      saving={saving}
      submitLabel="Simpan Pengaturan"
      onSubmit={() => submit(values)}
    >
      <p className="typo-label-m text-fg-heading">Aturan perhitungan (semua hari dihitung hari kerja biasa)</p>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {NUMBER_FIELDS.map(({ key, label, note }) => (
          <TextField
            key={key}
            id={key}
            label={label}
            required
            inputMode="numeric"
            value={values[key]}
            onChange={(value) => changeValue(key, value)}
            error={errors[key]}
            disabled={saving}
            note={note}
          />
        ))}
      </div>

      <OvertimeExample rates={rates} />

      <p className="typo-label-m text-fg-heading">Rekomendasi Lembur DW</p>
      <div className="grid gap-5 md:grid-cols-[12rem_1fr]">
        <TextField
          id="dw_default_start_time"
          label="Jam Mulai Bawaan"
          required
          type="time"
          value={values.dw_default_start_time}
          onChange={(value) => changeValue("dw_default_start_time", value)}
          error={errors.dw_default_start_time}
          disabled={saving}
        />
        <TextAreaField
          id="dw_default_description"
          label="Uraian Pekerjaan Bawaan"
          required
          value={values.dw_default_description}
          onChange={(value) => changeValue("dw_default_description", value)}
          error={errors.dw_default_description}
          disabled={saving}
          placeholder="Cth. Membantu pekerjaan operasional di luar jam kerja"
          note="bisa diubah per baris saat rekomendasi dibuat."
        />
      </div>
    </FormPageLayout>
  );
}
