"use client";

import { useState } from "react";
import { Button } from "@mestakara/ui/button";

import { FormDialog } from "@/components/shared/FormDialog";
import { SearchMultiSelectField } from "@/components/shared/FormFields";
import { dimensionLabel, dimensionOptions, type WidgetFilters } from "@/lib/dashboard-filters";
import type { FilterDimension } from "@/types/api/dashboard";

import { useFilterOptions } from "./FilterOptionsContext";

interface WidgetFilterDialogProps {
  open: boolean;
  /** Judul grafik, untuk judul dialog */
  title: string;
  /** Dimensi yang berlaku untuk grafik ini */
  dimensions: FilterDimension[];
  value: WidgetFilters;
  onChange: (filters: WidgetFilters) => void;
  onClose: () => void;
}

/**
 * Dialog FILTER SATU GRAFIK:
 *
 *   Filter — Biaya Upah per Kelompok
 *   Sub Unit         [Malabar ×] cari...
 *   Segmen           [Wahana ×] [F&B ×] cari...
 *   ...                                   [Kosongkan Semua]
 *                                         [Batal] [Terapkan]
 *
 * Satu dimensi boleh beberapa nilai; antar dimensi digabung "dan". Hanya grafik ini yang berubah.
 */
export function WidgetFilterDialog(props: WidgetFilterDialogProps) {
  if (!props.open) return null;
  // Dibuat ulang setiap dibuka, supaya isian dimulai dari filter yang sedang berlaku.
  return <FilterDialogContent {...props} />;
}

function FilterDialogContent({ title, dimensions, value, onChange, onClose }: WidgetFilterDialogProps) {
  const options = useFilterOptions();
  const [draft, setDraft] = useState<WidgetFilters>(value);

  return (
    <FormDialog
      open
      title={`Filter — ${title}`}
      description="Hanya grafik ini yang berubah. Pilih satu nilai atau lebih per isian; isian yang kosong tidak menyaring."
      saveLabel="Terapkan"
      onSave={() => {
        onChange(draft);
        onClose();
      }}
      onClose={onClose}
    >
      {dimensions.map((dimension) => (
        <SearchMultiSelectField
          key={dimension}
          id={`filter-${dimension}`}
          label={dimensionLabel(dimension)}
          options={dimensionOptions(dimension, options)}
          value={draft[dimension] ?? []}
          onChange={(values) => setDraft({ ...draft, [dimension]: values })}
          emptyMessage="Tidak ditemukan."
          placeholder={options ? "Semua" : "Memuat pilihan..."}
        />
      ))}
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setDraft({})}>
          Kosongkan Semua
        </Button>
      </div>
    </FormDialog>
  );
}
