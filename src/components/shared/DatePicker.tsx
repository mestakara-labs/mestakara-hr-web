"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Calendar } from "@mestakara/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@mestakara/ui/popover";

import { formatDate, parseDate, toDateText } from "@/lib/date";

interface DatePickerProps {
  id: string;
  /** Tanggal terpilih, format "YYYY-MM-DD"; "" = belum dipilih */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Tahun paling awal di pilihan tahun, mis. 1960 untuk tanggal lahir */
  fromYear?: number;
  /** Tidak boleh memilih tanggal setelah hari ini (mis. tanggal lahir) */
  disableFuture?: boolean;
  /** Tanggal paling awal yang boleh dipilih, "YYYY-MM-DD" (mis. tanggal 1 bulan periode) */
  minDate?: string;
}

/**
 * Isian tanggal dari @mestakara/ui: tombol berisi tanggal terpilih, klik untuk
 * membuka kalender. Bulan dan tahun bisa dipilih dari daftar (berguna untuk
 * tanggal lahir yang jauh ke belakang).
 *
 * Nilainya selalu teks "YYYY-MM-DD", sama dengan yang dikirim ke server.
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pilih tanggal",
  invalid = false,
  disabled = false,
  fromYear = 1950,
  disableFuture = false,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDate(value) : undefined;
  const today = new Date();
  // Tanggal yang tidak bisa diklik: setelah hari ini (disableFuture) dan/atau sebelum minDate.
  const disabledDays = [...(disableFuture ? [{ after: today }] : []), ...(minDate ? [{ before: parseDate(minDate) }] : [])];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid}
          data-empty={!value}
          className="w-full justify-between font-normal data-[empty=true]:text-fg-tertiary aria-invalid:border-danger"
        >
          {value ? formatDate(value) : placeholder}
          <CalendarIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            onChange(date ? toDateText(date) : "");
            setOpen(false);
          }}
          captionLayout="dropdown"
          startMonth={new Date(fromYear, 0)}
          endMonth={new Date(today.getFullYear() + 5, 11)}
          disabled={disabledDays.length > 0 ? disabledDays : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
