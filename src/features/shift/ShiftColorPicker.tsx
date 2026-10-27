"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@mestakara/ui/field";
import { Input } from "@mestakara/ui/input";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import { cn } from "cn";

import { FieldNote } from "@/components/shared/FieldNote";
import { RequiredMark } from "@/components/shared/RequiredMark";
import { COLOR_FORMATS, formatColor, parseColor, readableTextColor, type ColorFormat } from "@/lib/color";
import { SHIFT_COLOR_PALETTE } from "@/lib/shift-rules";

interface ShiftColorPickerProps {
  /** Warna terpilih dalam HEX, mis. "#1BAA4E". "" = belum dipilih / kode yang diketik belum benar. */
  value: string;
  onChange: (hex: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * PEMILIH WARNA SHIFT:
 *
 *   Warna *
 *   Rekomendasi (sesuai tema)   ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■     <- klik untuk memilih
 *   Kode sendiri  [HEX ▾] [#1BAA4E        ] [■]              <- ketik HEX / RGB / HSL, atau pipet
 *
 * Apa pun cara memilihnya, yang dikirim ke form selalu HEX (lihat lib/color.ts).
 */
export function ShiftColorPicker({ value, onChange, error, disabled }: ShiftColorPickerProps) {
  const [format, setFormat] = useState<ColorFormat>("hex");
  // Teks di kotak "kode sendiri" (boleh belum benar selama diketik).
  const [text, setText] = useState(() => formatColor(value, "hex"));
  const placeholder = COLOR_FORMATS.find((item) => item.value === format)?.placeholder;
  const isTextInvalid = text.trim() !== "" && parseColor(text, format) === null;

  /** Pilih warna jadi (palet / pipet) -> kotak teks ikut menampilkan kodenya. */
  function pick(hex: string) {
    onChange(hex);
    setText(formatColor(hex, format));
  }

  /** Ketik kode sendiri -> kalau formatnya benar, warnanya langsung dipakai. */
  function type(nextText: string) {
    setText(nextText);
    onChange(parseColor(nextText, format) ?? "");
  }

  /** Ganti format -> kode warna yang sama ditulis ulang dalam format baru. */
  function changeFormat(nextFormat: ColorFormat) {
    setFormat(nextFormat);
    setText(formatColor(value, nextFormat));
  }

  return (
    <Field data-invalid={Boolean(error || isTextInvalid)}>
      <FieldLabel htmlFor="color">
        Warna <RequiredMark />
      </FieldLabel>

      <p className="text-xs text-fg-secondary">Rekomendasi (sesuai tema)</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Palet warna rekomendasi">
        {SHIFT_COLOR_PALETTE.map((color) => {
          const isSelected = value === color.hex;
          return (
            <button
              key={color.hex}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={color.label}
              title={`${color.label} (${color.hex})`}
              onClick={() => pick(color.hex)}
              disabled={disabled}
              className={cn(
                "flex size-8 items-center justify-center rounded-md border border-border",
                isSelected && "ring-2 ring-primary ring-offset-2",
              )}
              style={{ backgroundColor: color.hex }}
            >
              {isSelected && <Check className="size-4" style={{ color: readableTextColor(color.hex) }} />}
            </button>
          );
        })}
      </div>

      <p className="mt-1 text-xs text-fg-secondary">Atau isi kode warna sendiri</p>
      <div className="flex gap-2">
        <NativeSelect
          aria-label="Format kode warna"
          value={format}
          onChange={(event) => changeFormat(event.target.value as ColorFormat)}
          disabled={disabled}
          className="w-24"
        >
          {COLOR_FORMATS.map((item) => (
            <NativeSelectOption key={item.value} value={item.value}>
              {item.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Input
          id="color"
          value={text}
          onChange={(event) => type(event.target.value)}
          aria-invalid={Boolean(error || isTextInvalid)}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1"
        />
        {/* Pipet / pemilih warna bawaan browser */}
        <input
          type="color"
          aria-label="Pilih warna bebas"
          value={value || "#FFFFFF"}
          onChange={(event) => pick(event.target.value.toUpperCase())}
          disabled={disabled}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-border bg-surface p-1"
        />
      </div>

      <FieldNote>penanda shift di kalender jadwal. Kode warna disimpan dalam format HEX.</FieldNote>
      <FieldError>{isTextInvalid ? `Format ${format.toUpperCase()} belum benar, cth. ${placeholder}` : error}</FieldError>
    </Field>
  );
}
