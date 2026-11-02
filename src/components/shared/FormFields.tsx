"use client";

import type { ReactNode } from "react";
import { Field, FieldError, FieldLabel } from "@mestakara/ui/field";
import { Input } from "@mestakara/ui/input";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import { Textarea } from "@mestakara/ui/textarea";

import { DatePicker } from "./DatePicker";
import { FieldNote } from "./FieldNote";
import { RequiredMark } from "./RequiredMark";
import { SearchMultiSelect, SearchSelect, type SearchOption } from "./SearchSelect";

/**
 * ISIAN FORM SIAP PAKAI: label + kontrol + catatan + pesan error dalam satu baris kode.
 * Dipakai untuk form yang isiannya banyak (mis. form karyawan), supaya kodenya ringkas.
 *
 *   <TextField id="name" label="Nama Lengkap" required value={...} onChange={...} error={errors.name} />
 *   <SelectField id="gender" label="Jenis Kelamin" options={["Laki-laki", "Perempuan"]} ... />
 *   <DateField id="birth_date" label="Tanggal Lahir" ... />
 *   <SearchSelectField id="employee_id" label="Karyawan" options={[{ value, label }]} ... />
 */

/** Bagian yang sama di semua isian. */
interface BaseFieldProps {
  /** Id isian; juga dipakai label untuk menunjuk isiannya */
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  /** Pesan error dari useFormSubmit */
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Catatan kecil di bawah isian ("Catatan: ...") */
  note?: ReactNode;
}

/** Kerangka satu isian: label, kontrol, catatan, dan pesan error. */
function FieldFrame({
  id,
  label,
  required,
  error,
  note,
  children,
}: Pick<BaseFieldProps, "id" | "label" | "required" | "error" | "note"> & { children: ReactNode }) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>
        {label} {required && <RequiredMark />}
      </FieldLabel>
      {children}
      {note && <FieldNote>{note}</FieldNote>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

/**
 * Isian teks satu baris. `inputMode="numeric"` memunculkan papan angka di HP.
 * `type="time"` = pilihan jam "HH:MM" (24 jam), mis. jam mulai shift.
 */
export function TextField(props: BaseFieldProps & { type?: "text" | "email" | "tel" | "time"; inputMode?: "numeric" }) {
  const { id, value, onChange, error, disabled, placeholder, type = "text", inputMode } = props;

  return (
    <FieldFrame {...props}>
      <Input
        id={id}
        type={type}
        // Isian jam cukup sampai menit (tanpa detik).
        step={type === "time" ? 60 : undefined}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </FieldFrame>
  );
}

/** Kotak teks beberapa baris, mis. alamat. */
export function TextAreaField(props: BaseFieldProps) {
  const { id, value, onChange, error, disabled, placeholder } = props;

  return (
    <FieldFrame {...props}>
      <Textarea
        id={id}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </FieldFrame>
  );
}

/** Satu pilihan yang tulisannya berbeda dari nilainya, mis. { value: "Plt", label: "Plt (Pelaksana Tugas)" }. */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Pilihan dari daftar. Pilihan pertama selalu "Pilih ..." (nilai kosong),
 * kecuali `emptyLabel` diisi (mis. "Tanpa objek penempatan").
 *
 * `options` boleh berupa teks biasa (["Islam", "Kristen"]) atau
 * pasangan nilai–tulisan ([{ value: "sub-1", label: "Kantor Induk" }]).
 */
export function SelectField(props: BaseFieldProps & { options: (string | SelectOption)[]; emptyLabel?: string }) {
  const { id, label, value, onChange, error, disabled, options, emptyLabel } = props;

  return (
    <FieldFrame {...props}>
      <NativeSelect
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        className="w-full"
      >
        <NativeSelectOption value="">{emptyLabel ?? `Pilih ${label.toLowerCase()}`}</NativeSelectOption>
        {options.map((option) => {
          const { value: optionValue, label: optionLabel } =
            typeof option === "string" ? { value: option, label: option } : option;

          return (
            <NativeSelectOption key={optionValue} value={optionValue}>
              {optionLabel}
            </NativeSelectOption>
          );
        })}
      </NativeSelect>
    </FieldFrame>
  );
}

/** Pilih SATU dari daftar panjang yang bisa dicari (mis. karyawan). Nilai "" = belum dipilih. */
export function SearchSelectField(props: BaseFieldProps & { options: SearchOption[]; emptyMessage: string }) {
  const { id, value, onChange, error, disabled, placeholder, options, emptyMessage } = props;

  return (
    <FieldFrame {...props}>
      <SearchSelect
        id={id}
        options={options}
        value={value}
        onChange={onChange}
        invalid={Boolean(error)}
        disabled={disabled}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
      />
    </FieldFrame>
  );
}

/** Pilih BANYAK dari daftar yang bisa dicari (mis. atasan langsung). */
export function SearchMultiSelectField(
  props: Omit<BaseFieldProps, "value" | "onChange"> & {
    value: string[];
    onChange: (value: string[]) => void;
    options: SearchOption[];
    emptyMessage: string;
  },
) {
  const { id, value, onChange, error, disabled, placeholder, options, emptyMessage } = props;

  return (
    <FieldFrame {...props}>
      <SearchMultiSelect
        id={id}
        options={options}
        value={value}
        onChange={onChange}
        invalid={Boolean(error)}
        disabled={disabled}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
      />
    </FieldFrame>
  );
}

/** Pilihan tanggal (Date Picker @mestakara/ui). Nilainya teks "YYYY-MM-DD". */
export function DateField(props: BaseFieldProps & { disableFuture?: boolean; fromYear?: number; minDate?: string }) {
  const { id, value, onChange, error, disabled, placeholder, disableFuture, fromYear, minDate } = props;

  return (
    <FieldFrame {...props}>
      <DatePicker
        id={id}
        value={value}
        onChange={onChange}
        invalid={Boolean(error)}
        disabled={disabled}
        placeholder={placeholder}
        disableFuture={disableFuture}
        fromYear={fromYear}
        minDate={minDate}
      />
    </FieldFrame>
  );
}
