"use client";

import { useState } from "react";

import { ApiError } from "@/lib/http-client";

/** Pesan error per isian, mis. { login: "NIK / Email wajib diisi" } */
export type FieldErrors<TValues> = Partial<Record<keyof TValues, string>>;

interface UseFormSubmitOptions<TValues> {
  /** Validasi di browser sebelum request dikirim. */
  validate?: (values: TValues) => FieldErrors<TValues>;
  /** Kirim data ke server. Lempar `ApiError` kalau gagal. */
  onSubmit: (values: TValues) => Promise<void>;
}

/**
 * Alur kirim satu form:
 *
 *   1. Jalankan `validate`. Kalau ada isian yang salah -> tampilkan error, berhenti.
 *   2. Jalankan `onSubmit` sambil menyalakan status `saving`.
 *   3. Kalau server menolak:
 *        - 422 (validasi) -> pesan error ditempel ke isiannya masing-masing
 *        - lainnya        -> pesan tampil di `formError` (kotak merah di atas form)
 *
 * @example
 * const { submit, saving, errors, formError } = useFormSubmit<LoginValues>({
 *   validate: (form) => ({ password: requireText(form.password, "Kata Sandi") }),
 *   onSubmit: (form) => kirimKeServer(form),
 * });
 */
export function useFormSubmit<TValues extends object>({
  validate,
  onSubmit,
}: UseFormSubmitOptions<TValues>) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<TValues>>({});
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * Jalankan HANYA langkah 1 (validasi di browser), tanpa mengirim apa pun.
   * Hasilnya true kalau semua isian sudah benar.
   *
   * Berguna kalau form perlu menampilkan pop-up konfirmasi dulu sebelum
   * menyimpan: `if (check(values)) bukaPopUpKonfirmasi()`.
   */
  function check(values: TValues): boolean {
    const localErrors = validate ? removeEmptyMessages(validate(values)) : {};

    setFormError(null);
    setErrors(localErrors);

    return Object.keys(localErrors).length === 0;
  }

  /** Hapus pesan error satu isian, mis. begitu isiannya diubah user. */
  function clearError(field: keyof TValues) {
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  async function submit(values: TValues) {
    // Langkah 1: validasi di browser.
    if (!check(values)) return;

    // Langkah 2: kirim ke server.
    setSaving(true);

    try {
      await onSubmit(values);
    } catch (error) {
      // Langkah 3: tampilkan error dari server.
      if (error instanceof ApiError && error.status === 422 && error.errors) {
        const fieldErrors = firstMessagePerField<TValues>(error.errors);
        setErrors(fieldErrors);
        // Pesan untuk isian yang tidak ada di form (mis. "employee_ids.0") ditampilkan sebagai pesan umum,
        // supaya tidak hilang begitu saja.
        const unknownField = Object.keys(fieldErrors).find((field) => !(field in values));
        if (unknownField) setFormError(fieldErrors[unknownField as keyof TValues] ?? error.message);
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setSaving(false);
    }
  }

  return { submit, check, clearError, saving, errors, formError };
}

/**
 * Buang isian yang lolos validasi (pesannya undefined), sisakan yang error saja.
 * { login: "NIK / Email wajib diisi", password: undefined } -> { login: "NIK / Email wajib diisi" }
 */
function removeEmptyMessages<TValues>(errors: FieldErrors<TValues>): FieldErrors<TValues> {
  const result: FieldErrors<TValues> = {};

  for (const field in errors) {
    if (errors[field]) {
      result[field] = errors[field];
    }
  }

  return result;
}

/** { login: ["pesan 1", "pesan 2"] } -> { login: "pesan 1" } */
function firstMessagePerField<TValues>(
  serverErrors: Record<string, string[]>,
): FieldErrors<TValues> {
  const result: Record<string, string> = {};

  for (const [field, messages] of Object.entries(serverErrors)) {
    result[field] = messages[0];
  }

  return result as FieldErrors<TValues>;
}
