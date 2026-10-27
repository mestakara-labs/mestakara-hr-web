/**
 * ISIAN FORM SHIFT: bentuk datanya, isian awal, pemeriksaan, dan cara mengirimnya.
 *
 * Angka (menit) disimpan sebagai TEKS selama diketik, supaya kotak isian boleh
 * kosong sementara. Baru diubah menjadi angka saat dikirim (toPayload).
 */
import { isValidTime, SHIFT_DEFAULTS } from "@/lib/shift-rules";
import { requireText } from "@/lib/validation";
import type { ShiftPayload, ShiftResource } from "@/types/api/shift";

export interface ShiftFormValues {
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: string;
  late_tolerance_minutes: string;
  checkin_window_before_minutes: string;
  checkout_window_after_minutes: string;
  color: string;
  description: string;
}

/** Isian awal: kosong (dengan nilai bawaan) untuk shift baru, atau data lama untuk edit. */
export function initialValues(shift?: ShiftResource): ShiftFormValues {
  return {
    code: shift?.code ?? "",
    name: shift?.name ?? "",
    start_time: shift?.start_time ?? "",
    end_time: shift?.end_time ?? "",
    break_minutes: String(shift?.break_minutes ?? SHIFT_DEFAULTS.break_minutes),
    late_tolerance_minutes: String(shift?.late_tolerance_minutes ?? SHIFT_DEFAULTS.late_tolerance_minutes),
    checkin_window_before_minutes: String(
      shift?.checkin_window_before_minutes ?? SHIFT_DEFAULTS.checkin_window_before_minutes,
    ),
    checkout_window_after_minutes: String(
      shift?.checkout_window_after_minutes ?? SHIFT_DEFAULTS.checkout_window_after_minutes,
    ),
    color: shift?.color ?? "",
    description: shift?.description ?? "",
  };
}

/** "15" -> undefined; "abc" / "" -> pesan error. */
function mustBeMinutes(value: string, label: string): string | undefined {
  return /^\d+$/.test(value.trim()) ? undefined : `${label} harus berupa angka menit`;
}

/** Pemeriksaan di browser (aturan lengkapnya diperiksa lagi oleh server). */
export function validateShiftForm(form: ShiftFormValues) {
  return {
    code: requireText(form.code, "Kode Shift"),
    name: requireText(form.name, "Nama Shift"),
    start_time: isValidTime(form.start_time) ? undefined : "Isi Jam Mulai",
    end_time: !isValidTime(form.end_time)
      ? "Isi Jam Selesai"
      : form.end_time === form.start_time
        ? "Jam Selesai tidak boleh sama dengan Jam Mulai"
        : undefined,
    break_minutes: mustBeMinutes(form.break_minutes, "Istirahat"),
    late_tolerance_minutes: mustBeMinutes(form.late_tolerance_minutes, "Toleransi Terlambat"),
    checkin_window_before_minutes: mustBeMinutes(form.checkin_window_before_minutes, "Batas Scan Masuk"),
    checkout_window_after_minutes: mustBeMinutes(form.checkout_window_after_minutes, "Batas Scan Pulang"),
    color: form.color ? undefined : "Pilih Warna atau isi kode warna yang benar",
  };
}

/** Isian form -> data yang dikirim ke /api/shifts (menit menjadi angka). */
export function toPayload(form: ShiftFormValues): ShiftPayload {
  return {
    ...form,
    break_minutes: Number(form.break_minutes),
    late_tolerance_minutes: Number(form.late_tolerance_minutes),
    checkin_window_before_minutes: Number(form.checkin_window_before_minutes),
    checkout_window_after_minutes: Number(form.checkout_window_after_minutes),
  };
}
