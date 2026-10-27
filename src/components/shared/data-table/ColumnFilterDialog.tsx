"use client";

import { useState } from "react";
import { Button } from "@mestakara/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mestakara/ui/dialog";

import { useDataTableContext, type OpenFilter } from "./DataTableContext";
import { FilterChecklist } from "./FilterChecklist";

/**
 * Dialog filter untuk kolom yang ikon corongnya diklik.
 *
 * Centangan ditampung dulu sebagai "draft" dan baru berlaku saat "Terapkan",
 * jadi tabel tidak berubah-ubah selama user masih memilih.
 */
export function ColumnFilterDialog() {
  const { openFilter, closeFilter } = useDataTableContext();

  return (
    <Dialog open={openFilter !== null} onOpenChange={(isOpen) => !isOpen && closeFilter()}>
      <DialogContent>
        {/* Isinya dibuat ulang setiap dialog dibuka, supaya draft selalu mulai dari filter yang berlaku */}
        {openFilter && <FilterDialogBody key={openFilter.columnId} filter={openFilter} />}
      </DialogContent>
    </Dialog>
  );
}

function FilterDialogBody({ filter }: { filter: OpenFilter }) {
  const { filterValueOf, setColumnValues, closeFilter } = useDataTableContext();
  const appliedValues = filterValueOf(filter.columnId)?.values ?? [];

  const [draft, setDraft] = useState<string[]>(appliedValues);

  function apply() {
    setColumnValues(filter.columnId, draft); // kosong = filter kolom ini dihapus
    closeFilter();
  }

  function removeFilter() {
    setColumnValues(filter.columnId, undefined);
    closeFilter();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Filter {filter.label}</DialogTitle>
        <DialogDescription>Centang nilai yang ingin ditampilkan.</DialogDescription>
      </DialogHeader>

      <FilterChecklist options={filter.options} selected={draft} onChange={setDraft} />

      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" disabled={appliedValues.length === 0} onClick={removeFilter}>
          Hapus filter
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={closeFilter}>
            Batal
          </Button>
          <Button onClick={apply}>Terapkan{draft.length > 0 ? ` (${draft.length})` : ""}</Button>
        </div>
      </DialogFooter>
    </>
  );
}
