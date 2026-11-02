"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { DateField, SearchSelectField, TextAreaField, TextField } from "@/components/shared/FormFields";
import { useApiGet } from "@/hooks/useApiGet";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { SOURCE_LABELS, type EmployeeCategoryConfig } from "@/lib/attendance-rules";
import { apiPost, apiPut } from "@/lib/http-client";
import { requireSelection, requireText } from "@/lib/validation";
import type {
  AttendanceSummaryRow,
  EmployeeCategory,
  OvertimeEntryChangePayload,
  OvertimeEntryCreatePayload,
  OvertimeEntryRow,
} from "@/types/api/attendance";

/** Yang dibuka: tambah baris baru, atau ubah satu baris. */
export type OvertimeEntryTarget = { mode: "add" } | { mode: "edit"; row: OvertimeEntryRow };

interface OvertimeEntryDialogProps {
  /** null = dialog tertutup */
  target: OvertimeEntryTarget | null;
  overtimeType: "reguler" | "dw";
  /** Kategori karyawan yang dibuka; pilihan karyawan saat Tambah hanya kategori ini */
  category: EmployeeCategoryConfig;
  /** Judul jenis lembur, mis. "Lembur DW" */
  title: string;
  /** Periode "YYYY-MM"; tanggal harus di dalam periode ini */
  period: string;
  periodLabel: string;
  onClose: () => void;
  onSaved: () => void;
}

interface OvertimeFormValues {
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
  reason: string;
}

/**
 * Dialog TAMBAH / UBAH SATU BARIS LEMBUR (tab Lembur Reguler & Lembur DW):
 *
 *   ┌ Ubah Lembur DW — A. Rohman ───────────────────────── × ┐
 *   │ Karyawan [▾]            (hanya saat Tambah)            │
 *   │ Tanggal [8 Okt 2026]   Jam Mulai [17:00]  Jam Selesai [18:30]
 *   │ Uraian Pekerjaan [.....]                               │
 *   │ Alasan * [.....]                                       │
 *   │                                     [Batal] [Simpan]   │
 *   └────────────────────────────────────────────────────────┘
 *
 * Hasilnya bersumber "Manual": tidak tergantikan unggah Excel maupun Hitung Rekomendasi.
 * Jam selesai lebih kecil dari jam mulai = lewat tengah malam. Peringatan dari server (mis. > 4 jam) ditampilkan di toast.
 */
export function OvertimeEntryDialog(props: OvertimeEntryDialogProps) {
  if (!props.target) return null;
  // `key` = isian diisi ulang setiap kali dibuka untuk baris lain.
  const key = props.target.mode === "edit" ? props.target.row.id : "baru";
  return <OvertimeEntryDialogContent key={key} {...props} target={props.target} />;
}

function OvertimeEntryDialogContent({
  target,
  overtimeType,
  category,
  title,
  period,
  periodLabel,
  onClose,
  onSaved,
}: OvertimeEntryDialogProps & { target: OvertimeEntryTarget }) {
  const row = target.mode === "edit" ? target.row : null;
  const [values, setValues] = useState<OvertimeFormValues>({
    employee_id: row?.employee.id ?? "",
    date: row?.date ?? "",
    start_time: row?.start_time ?? "17:00",
    end_time: row?.end_time ?? "",
    description: row?.description ?? "",
    reason: "",
  });

  const { submit, clearError, saving, errors, formError } = useFormSubmit<OvertimeFormValues>({
    validate: (form) => ({
      employee_id: row ? undefined : requireSelection(form.employee_id, "Karyawan"),
      date: requireText(form.date, "Tanggal") ?? (form.date.startsWith(period) ? undefined : `Tanggal harus di bulan ${periodLabel}`),
      start_time: requireText(form.start_time, "Jam Mulai"),
      end_time:
        requireText(form.end_time, "Jam Selesai") ??
        (form.end_time === form.start_time ? "Jam Selesai harus berbeda dari Jam Mulai" : undefined),
      description: requireText(form.description, "Uraian Pekerjaan"),
      reason: requireText(form.reason, "Alasan"),
    }),
    onSubmit: async (form) => {
      // Beberapa browser mengirim jam berdetik ("18:00:00"); yang dikirim cukup "HH:MM".
      const change: OvertimeEntryChangePayload = {
        date: form.date,
        start_time: form.start_time.slice(0, 5),
        end_time: form.end_time.slice(0, 5),
        description: form.description.trim(),
        reason: form.reason.trim(),
      };
      const response = row
        ? await apiPut<OvertimeEntryRow>(`/api/overtime-entries/${row.id}`, change)
        : await apiPost<OvertimeEntryRow>("/api/overtime-entries", {
            ...change,
            period,
            employee_id: form.employee_id,
            overtime_type: overtimeType,
          } satisfies OvertimeEntryCreatePayload);

      // Tersimpan, tapi mungkin ada peringatan (mis. lebih dari 4 jam sehari).
      const warnings = response.data.warnings;
      toast.success(response.message, warnings.length > 0 ? { description: `Peringatan: ${warnings.join("; ")}` } : undefined);
      onSaved();
      onClose();
    },
  });

  /** Ubah satu isian, sekaligus hapus pesan error isian itu. */
  function changeValue(key: keyof OvertimeFormValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  return (
    <FormDialog
      open
      title={row ? `Ubah ${title} — ${row.employee.name}` : `Tambah ${title}`}
      description={
        row
          ? `Sumber sekarang: ${SOURCE_LABELS[row.source]}. Setelah diubah, baris ini menjadi Manual dan tidak tergantikan unggah Excel maupun rekomendasi.`
          : `Baris baru bersumber Manual, periode ${periodLabel}. Tidak tergantikan unggah Excel maupun rekomendasi.`
      }
      saveLabel={saving ? "Menyimpan..." : "Simpan"}
      onSave={() => submit(values)}
      onClose={onClose}
    >
      {formError && (
        <Alert variant="danger">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {!row && (
        <EmployeeField
          period={period}
          category={category.value}
          value={values.employee_id}
          onChange={(value) => changeValue("employee_id", value)}
          error={errors.employee_id}
          disabled={saving}
        />
      )}

      <DateField
        id="date"
        label="Tanggal"
        required
        value={values.date}
        onChange={(value) => changeValue("date", value)}
        error={errors.date}
        disabled={saving}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="start_time"
          type="time"
          label="Jam Mulai"
          required
          value={values.start_time}
          onChange={(value) => changeValue("start_time", value)}
          error={errors.start_time}
          disabled={saving}
        />
        <TextField
          id="end_time"
          type="time"
          label="Jam Selesai"
          required
          value={values.end_time}
          onChange={(value) => changeValue("end_time", value)}
          error={errors.end_time}
          disabled={saving}
          note="lebih kecil dari jam mulai = lewat tengah malam."
        />
      </div>
      <TextAreaField
        id="description"
        label="Uraian Pekerjaan"
        required
        value={values.description}
        onChange={(value) => changeValue("description", value)}
        error={errors.description}
        disabled={saving}
      />
      <TextAreaField
        id="reason"
        label="Alasan"
        required
        value={values.reason}
        onChange={(value) => changeValue("reason", value)}
        error={errors.reason}
        disabled={saving}
        placeholder="Cth. Jam di file Excel salah; sesuai SPKL"
        note="tercatat di jejak perubahan."
      />
    </FormDialog>
  );
}

/**
 * Pilihan karyawan saat Tambah: karyawan kategori yang dibuka (Casual / Daily Worker) yang aktif pada periode itu
 * (sama dengan isi rekap daftar hadir kategori itu). Diambil hanya saat dialog Tambah dibuka.
 */
function EmployeeField({
  period,
  category,
  value,
  onChange,
  error,
  disabled,
}: {
  period: string;
  category: EmployeeCategory;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled: boolean;
}) {
  const { data: employees, loading } = useApiGet<AttendanceSummaryRow[]>(
    `/api/attendance-summaries?${new URLSearchParams({ period, employee_category: category })}`,
  );
  const options = (employees ?? []).map((employee) => ({
    value: employee.id,
    label: employee.name,
    hint: [employee.registration_number, employee.position].filter(Boolean).join(" · "),
  }));

  return (
    <SearchSelectField
      id="employee_id"
      label="Karyawan"
      required
      options={options}
      emptyMessage="Karyawan tidak ditemukan."
      placeholder={loading ? "Memuat karyawan..." : "Cari nama / no. reg..."}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled || loading}
    />
  );
}
