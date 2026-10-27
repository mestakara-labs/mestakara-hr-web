"use client";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@mestakara/ui/combobox";

/**
 * PILIHAN YANG BISA DICARI (Combobox @mestakara/ui), untuk daftar pilihan yang panjang
 * seperti daftar karyawan atau jabatan. Ketik untuk mencari, klik untuk memilih.
 *
 *   SearchSelect       -> pilih SATU     [Asep Saepudin            ⌄]
 *   SearchMultiSelect  -> pilih BANYAK   [Asep ×] [Siti ×] cari...
 */

/**
 * Penanda daftar pilihan yang terbuka. Daftar ini tampil DI LUAR isiannya (di atas
 * semua elemen), jadi dialog yang memuat isian ini perlu mengenalinya — lihat FormDialog.
 */
export const SEARCH_SELECT_LIST = '[data-slot="combobox-content"]';

/**
 * `pointer-events-auto`: dialog (modal) mematikan klik di luar kotaknya, termasuk di
 * daftar pilihan ini. Kelas ini membuat daftar pilihan tetap bisa diklik di dalam dialog.
 */
const LIST_CLASS = "pointer-events-auto";

/** Satu pilihan. `hint` = keterangan kecil di kanan, mis. "BRM-3". */
export interface SearchOption {
  value: string;
  label: string;
  hint?: string;
}

interface BaseProps {
  id: string;
  options: SearchOption[];
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Tulisan kalau pencarian tidak menemukan apa pun, mis. "Karyawan tidak ditemukan." */
  emptyMessage: string;
}

/** Nama pilihan dari nilainya, mis. "pegawai-0001" -> "Asep Saepudin". */
function labelOf(options: SearchOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Satu baris di daftar pilihan: nama di kiri, keterangan kecil di kanan. */
function OptionItem({ option }: { option: SearchOption | undefined }) {
  if (!option) return null;

  return (
    <>
      <span className="flex-1">{option.label}</span>
      {option.hint && <span className="typo-body-s text-fg-tertiary">{option.hint}</span>}
    </>
  );
}

/**
 * Alasan perubahan nilai dari Base UI saat tombol Escape ditekan. Bawaannya, Escape pada
 * daftar yang SUDAH tertutup menghapus SEMUA pilihan; perubahan dengan alasan ini diabaikan
 * supaya pilihan tidak hilang tak sengaja (mis. saat Escape ditekan dua kali).
 */
const ESCAPE_KEY = "escape-key";

/** Pilih SATU dari daftar. Nilai "" = belum dipilih. */
export function SearchSelect({
  id,
  options,
  value,
  onChange,
  invalid = false,
  disabled = false,
  placeholder,
  emptyMessage,
}: BaseProps & { value: string; onChange: (value: string) => void }) {
  return (
    <Combobox
      // Yang disimpan hanya nilainya (id); `itemToStringLabel` dipakai untuk tulisan & pencarian.
      items={options.map((option) => option.value)}
      itemToStringLabel={(item: string) => labelOf(options, item)}
      value={value || null}
      onValueChange={(item: string | null, details: { reason: string }) => {
        if (details.reason === ESCAPE_KEY) return;
        onChange(item ?? "");
      }}
      disabled={disabled}
    >
      <ComboboxInput id={id} placeholder={placeholder} aria-invalid={invalid} disabled={disabled} showClear />
      <ComboboxContent className={LIST_CLASS}>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              <OptionItem option={options.find((option) => option.value === item)} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/** Pilih BANYAK dari daftar. Yang dipilih tampil sebagai "chip"; klik × untuk membuang. */
export function SearchMultiSelect({
  id,
  options,
  value,
  onChange,
  invalid = false,
  disabled = false,
  placeholder,
  emptyMessage,
}: BaseProps & { value: string[]; onChange: (value: string[]) => void }) {
  // Daftar pilihan diletakkan di bawah seluruh kotak chip, bukan hanya di bawah kotak ketik.
  const anchor = useComboboxAnchor();

  return (
    <Combobox
      multiple
      items={options.map((option) => option.value)}
      itemToStringLabel={(item: string) => labelOf(options, item)}
      value={value}
      onValueChange={(items: string[], details: { reason: string }) => {
        if (details.reason === ESCAPE_KEY) return;
        onChange(items);
      }}
      disabled={disabled}
    >
      <ComboboxChips ref={anchor} aria-invalid={invalid}>
        <ComboboxValue>
          {(selected: string[]) =>
            selected.map((item) => <ComboboxChip key={item}>{labelOf(options, item)}</ComboboxChip>)
          }
        </ComboboxValue>
        <ComboboxChipsInput id={id} placeholder={placeholder} aria-invalid={invalid} />
      </ComboboxChips>

      <ComboboxContent anchor={anchor} className={LIST_CLASS}>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              <OptionItem option={options.find((option) => option.value === item)} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
