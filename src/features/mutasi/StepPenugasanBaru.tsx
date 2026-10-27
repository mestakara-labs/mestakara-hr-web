"use client";

import { useState } from "react";
import { CopyCheck } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { FieldLegend, FieldSet } from "@mestakara/ui/field";

import { DateField, SelectField, TextAreaField } from "@/components/shared/FormFields";
import { keepObjectsAvailableIn, toSubUnitOptions } from "@/features/jabatan-karyawan/assignment-options";
import { ASSIGNMENT_STATUS_OPTIONS } from "@/lib/assignment-rules";
import type { TransferItemPayload, TransferPreviewResource } from "@/types/api/transfer";

import { MutasiItemCard } from "./MutasiItemCard";
import type { StepProps } from "./mutasi-form-values";

interface StepPenugasanBaruProps extends StepProps {
  /** Perkiraan dari server (jumlah bawahan yang bisa dikembalikan per jabatan). null = belum ada. */
  preview: TransferPreviewResource | null;
}

/**
 * LANGKAH 2 — ATUR PENUGASAN BARU
 *
 *   Berlaku untuk semua    TMT Berlaku, Keterangan usulan
 *                          "Terapkan ke semua": Sub Unit & Status Jabatan sekaligus
 *   Per karyawan           kartu DARI (jabatan lama) -> KE (jabatan baru), lihat MutasiItemCard
 */
export function StepPenugasanBaru({ values, setValues, errors, disabled, data, preview }: StepPenugasanBaruProps) {
  // Isian "Terapkan ke semua" (tidak ikut disimpan; hanya alat bantu).
  const [bulkSubUnit, setBulkSubUnit] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");

  /** Ubah satu isian bersama (TMT / keterangan). */
  function changeShared(key: "effective_date" | "notes", value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  /** Ganti isian satu karyawan. */
  function changeItem(updated: TransferItemPayload) {
    setValues((previous) => ({
      ...previous,
      items: previous.items.map((item) => (item.id === updated.id ? updated : item)),
    }));
  }

  /** Keluarkan satu karyawan dari usulan. */
  function removeItem(itemId: string) {
    setValues((previous) => ({ ...previous, items: previous.items.filter((item) => item.id !== itemId) }));
  }

  /** Sub unit / status yang dipilih di "Terapkan ke semua" dipasang ke semua karyawan. */
  function applyToAll() {
    setValues((previous) => ({
      ...previous,
      items: previous.items.map((item) => {
        const next = { ...item };
        if (bulkStatus) next.assignment_status = bulkStatus;
        if (bulkSubUnit) {
          next.sub_unit_id = bulkSubUnit;
          // Objek yang tidak tersedia di sub unit baru dibuang.
          next.placement_object_ids = keepObjectsAvailableIn(next.placement_object_ids, data.placementObjects, bulkSubUnit);
        }
        return next;
      }),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Isian bersama */}
      <FieldSet>
        <FieldLegend>Berlaku untuk Semua Karyawan</FieldLegend>
        <div className="grid gap-5 md:grid-cols-2">
          <DateField
            id="effective_date"
            label="TMT Berlaku"
            required
            value={values.effective_date}
            onChange={(value) => changeShared("effective_date", value)}
            error={errors.effective_date}
            disabled={disabled}
            placeholder="Pilih tanggal mulai berlaku"
            fromYear={2000}
            note="jabatan baru mulai berlaku pada tanggal ini; jabatan lama berakhir sehari sebelumnya."
          />
          <TextAreaField
            id="notes"
            label="Keterangan Usulan"
            value={values.notes}
            onChange={(value) => changeShared("notes", value)}
            error={errors.notes}
            disabled={disabled}
            placeholder="Cth. Penyegaran tugas di bagian Operasional"
          />
        </div>

        {values.items.length > 1 && (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3 md:flex-row md:items-end">
            <div className="grid flex-1 gap-3 md:grid-cols-2">
              <SelectField
                id="bulk_sub_unit"
                label="Sub Unit untuk semua"
                options={toSubUnitOptions(data.subUnits)}
                emptyLabel="Tidak diubah"
                value={bulkSubUnit}
                onChange={setBulkSubUnit}
                disabled={disabled}
              />
              <SelectField
                id="bulk_status"
                label="Status Jabatan untuk semua"
                options={ASSIGNMENT_STATUS_OPTIONS}
                emptyLabel="Tidak diubah"
                value={bulkStatus}
                onChange={setBulkStatus}
                disabled={disabled}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={applyToAll}
              disabled={disabled || (!bulkSubUnit && !bulkStatus)}
            >
              <CopyCheck />
              Terapkan ke Semua
            </Button>
          </div>
        )}
      </FieldSet>

      {/* Per karyawan */}
      <FieldSet>
        <FieldLegend>Penugasan Baru ({values.items.length} karyawan)</FieldLegend>
        {values.items.length === 0 && (
          <p className="typo-body-s text-fg-tertiary">Belum ada karyawan. Kembali ke langkah 1 untuk memilih karyawan.</p>
        )}
        {values.items.map((item) => (
          <MutasiItemCard
            key={item.id}
            item={item}
            type={values.type}
            data={data}
            errors={errors}
            disabled={disabled}
            restorableCount={preview?.restorable_counts[item.position_id] ?? 0}
            onChange={changeItem}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </FieldSet>
    </div>
  );
}
