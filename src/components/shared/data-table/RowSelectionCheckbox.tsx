"use client";

import { Checkbox } from "@mestakara/ui/checkbox";

import { useDataTableContext } from "./DataTableContext";

/**
 * Kotak centang untuk MEMILIH BARIS (lihat `selectColumn` dan prop `selection` di <DataTable>).
 *
 *   [☑]  di judul kolom  -> pilih / lepas SEMUA baris di halaman yang sedang tampil
 *   [☐]  di setiap baris -> pilih / lepas baris itu
 *
 * Yang disimpan hanya id barisnya, jadi pilihan tetap ada walaupun pindah
 * halaman, mengurutkan, atau menyaring tabel. Baris yang tidak boleh dipilih
 * (lihat `canSelect`) tampil dengan kotak centang yang tidak bisa diklik.
 */

/** Kotak centang satu baris. */
export function RowCheckbox({ rowId, label }: { rowId: string; label: string }) {
  const { selection } = useDataTableContext();
  if (!selection) return null;

  const { selectedIds, onChange, canSelect } = selection;
  const isChecked = selectedIds.includes(rowId);

  return (
    <Checkbox
      checked={isChecked}
      disabled={canSelect ? !canSelect(rowId) : false}
      onCheckedChange={(checked) =>
        onChange(checked === true ? [...selectedIds, rowId] : selectedIds.filter((id) => id !== rowId))
      }
      aria-label={`Pilih ${label}`}
    />
  );
}

/**
 * Kotak centang di judul kolom: memilih semua baris di halaman yang sedang tampil.
 * Tampil setengah tercentang (−) kalau baru sebagian baris di halaman ini yang dipilih.
 */
export function SelectPageCheckbox() {
  const { table, selection } = useDataTableContext();
  if (!selection) return null;

  const { selectedIds, onChange, canSelect } = selection;
  // Hanya baris di halaman ini yang boleh dipilih.
  const pageIds = table
    .getRowModel()
    .rows.map((row) => row.id)
    .filter((id) => (canSelect ? canSelect(id) : true));
  const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id));

  const isAllSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const isPartlySelected = selectedOnPage.length > 0 && !isAllSelected;

  function togglePage() {
    if (isAllSelected) {
      onChange(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      const notYetSelected = pageIds.filter((id) => !selectedIds.includes(id));
      onChange([...selectedIds, ...notYetSelected]);
    }
  }

  return (
    <Checkbox
      checked={isAllSelected ? true : isPartlySelected ? "indeterminate" : false}
      onCheckedChange={togglePage}
      disabled={pageIds.length === 0}
      aria-label="Pilih semua baris di halaman ini"
    />
  );
}
