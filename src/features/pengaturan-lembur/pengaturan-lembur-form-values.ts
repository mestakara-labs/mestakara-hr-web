/**
 * ISIAN FORM PENGATURAN LEMBUR: bentuk teksnya (supaya "1,5" bisa diketik), cara mengisinya dari
 * data server, cara mengubahnya kembali menjadi angka, dan pemeriksaannya.
 *
 * Dipisah dari file tampilan (PengaturanLemburForm.tsx) supaya file tampilan tetap pendek.
 */
import type { OvertimeSettingResource, OvertimeSettingValues } from "@/types/api/overtime-setting";

/** Isian angka dalam bentuk teks. */
type NumberKey = Exclude<keyof OvertimeSettingValues, "dw_default_start_time" | "dw_default_description">;

/** Semua isian form. Angka disimpan sebagai teks selama diketik. */
export type PengaturanLemburFormValues = Record<NumberKey, string> & {
  dw_default_start_time: string;
  dw_default_description: string;
};

/** Isian angka beserta labelnya (urutan tampil di form). */
export const NUMBER_FIELDS: { key: NumberKey; label: string; note: string }[] = [
  { key: "hourly_divisor", label: "Pembagi Tarif per Jam", note: "tarif lembur per jam = Gaji Pokok ÷ angka ini (regulasi: 173)." },
  { key: "first_hour_multiplier", label: "Pengali Jam ke-1", note: "regulasi: 1,5." },
  { key: "next_hour_multiplier", label: "Pengali Jam ke-2 dst", note: "regulasi: 2." },
  { key: "max_hours_per_day", label: "Maks. Jam Lembur per Hari", note: "regulasi: 4 jam." },
  { key: "max_hours_per_week", label: "Maks. Jam Lembur per Minggu", note: "regulasi: 18 jam." },
  { key: "rounding", label: "Pembulatan Upah Lembur (Rp)", note: "upah lembur dibulatkan ke kelipatan ini, mis. 100." },
  { key: "time_step_minutes", label: "Kelipatan Jam Rekomendasi DW (menit)", note: "jam lembur rekomendasi DW dibuat kelipatan ini, mis. 30." },
];

/** Teks angka -> angka: "1,5" -> 1.5; kosong / bukan angka -> NaN. */
export function parseDecimal(text: string): number {
  return text.trim() === "" ? NaN : Number(text.replace(",", "."));
}

/** Angka -> teks isian: 1.5 -> "1,5". */
function toText(value: number): string {
  return String(value).replace(".", ",");
}

/** Data server -> isian form. */
export function toForm(setting: OvertimeSettingResource): PengaturanLemburFormValues {
  const numbers = Object.fromEntries(NUMBER_FIELDS.map(({ key }) => [key, toText(setting[key])])) as Record<NumberKey, string>;

  return {
    ...numbers,
    dw_default_start_time: setting.dw_default_start_time,
    // Uraian bawaan belum pernah diisi admin -> null dari server.
    dw_default_description: setting.dw_default_description ?? "",
  };
}

/** Isian form -> data yang dikirim ke server. */
export function toPayload(values: PengaturanLemburFormValues): OvertimeSettingValues {
  const numbers = Object.fromEntries(NUMBER_FIELDS.map(({ key }) => [key, parseDecimal(values[key])])) as Record<NumberKey, number>;

  return {
    ...numbers,
    dw_default_start_time: values.dw_default_start_time,
    dw_default_description: values.dw_default_description.trim(),
  };
}

/** Periksa isian. Hasilnya pesan per isian (undefined = benar). */
export function validate(values: PengaturanLemburFormValues): Partial<Record<keyof PengaturanLemburFormValues, string>> {
  const errors: Partial<Record<keyof PengaturanLemburFormValues, string>> = {};

  for (const { key, label } of NUMBER_FIELDS) {
    const value = parseDecimal(values[key]);
    if (!(value > 0)) errors[key] = `${label} harus angka lebih dari 0`;
  }
  // Pengali di bawah 1 berarti lembur dibayar lebih murah dari jam biasa — pasti salah ketik.
  for (const key of ["first_hour_multiplier", "next_hour_multiplier"] as const) {
    if (!errors[key] && parseDecimal(values[key]) < 1) errors[key] = "Pengali minimal 1";
  }

  if (!/^\d{2}:\d{2}$/.test(values.dw_default_start_time)) errors.dw_default_start_time = "Jam mulai wajib diisi (JJ:MM)";
  if (!values.dw_default_description.trim()) errors.dw_default_description = "Uraian pekerjaan bawaan wajib diisi";

  return errors;
}
