"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@mestakara/ui/button";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { minutesToHours, type AttendanceImportConfig } from "@/lib/attendance-rules";
import type { OvertimeEntryRow } from "@/types/api/attendance";

import { DwTargetSection } from "./DwTargetSection";
import { OvertimeDeleteDialog } from "./OvertimeDeleteDialog";
import { OvertimeEntryDialog, type OvertimeEntryTarget } from "./OvertimeEntryDialog";
import { OvertimeEntryTable, type OvertimeRowActions } from "./OvertimeEntryTable";

interface LemburTabProps {
  /** Lembur Reguler atau Lembur DW */
  config: AttendanceImportConfig;
  period: string;
  periodLabel: string;
  /** true = periode dikunci; tambah / ubah / hapus / rekomendasi dimatikan */
  locked: boolean;
  /** Dipanggil setelah data berubah (status tab dimuat ulang) */
  onChanged: () => void;
}

/**
 * Isi tab LEMBUR REGULER / LEMBUR DW di bawah kotak unggah:
 *
 *   (khusus Lembur DW) Target vs Upah Lembur DW + Hitung Rekomendasi   -> DwTargetSection
 *   Daftar Lembur DW Oktober 2026 — 37 baris · 18 karyawan · 64,5 jam          [+ Tambah Lembur]
 *   (tabel OvertimeEntryTable; menu Aksi per baris = Edit / Hapus, alasan wajib, hasilnya bersumber Manual)
 *
 * Data dari /api/overtime-entries?period=YYYY-MM&type=lembur_reguler|lembur_dw.
 */
export function LemburTab({ config, period, periodLabel, locked, onChanged }: LemburTabProps) {
  const { data: rows, loading, error, reload } = useApiGet<OvertimeEntryRow[]>(
    `/api/overtime-entries?${new URLSearchParams({ period, type: config.type })}`,
  );
  const isDw = config.type === "lembur_dw";

  const [editTarget, setEditTarget] = useState<OvertimeEntryTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OvertimeEntryRow | null>(null);
  // Bertambah setiap kali baris lembur berubah -> ringkasan Target vs Upah dibuat ulang (diambil lagi).
  const [targetVersion, setTargetVersion] = useState(0);

  // useMemo: diteruskan ke konfigurasi kolom tabel yang dibuat ulang hanya kalau aksinya berubah.
  const actions = useMemo<OvertimeRowActions | null>(
    () =>
      locked
        ? null
        : { onEdit: (row) => setEditTarget({ mode: "edit", row }), onDelete: (row) => setDeleteTarget(row) },
    [locked],
  );

  const employeeCount = new Set((rows ?? []).map((row) => row.employee.id)).size;
  const totalMinutes = (rows ?? []).reduce((sum, row) => sum + row.duration_minutes, 0);

  /** Setelah baris diubah / dihapus / ditambah: daftar, ringkasan DW, dan status tab dimuat ulang. */
  function afterRowChanged() {
    reload();
    setTargetVersion((value) => value + 1);
    onChanged();
  }

  /** Setelah rekomendasi disimpan: ringkasan DW sudah memuat ulang sendiri. */
  function afterRecommendationSaved() {
    reload();
    onChanged();
  }

  return (
    <div className="flex flex-col gap-6">
      {isDw && (
        <DwTargetSection
          key={targetVersion}
          period={period}
          periodLabel={periodLabel}
          locked={locked}
          onChanged={afterRecommendationSaved}
        />
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="typo-label-m text-fg-heading">
            Daftar {config.title} {periodLabel}
            {rows && (
              <span className="ml-2 typo-body-s font-normal text-fg-tertiary">
                {rows.length} baris · {employeeCount} karyawan · {minutesToHours(totalMinutes)} jam
              </span>
            )}
          </h3>
          <Button variant="outline" onClick={() => setEditTarget({ mode: "add" })} disabled={locked}>
            <Plus />
            Tambah Lembur
          </Button>
        </div>

        {loading && <PageLoading label={`Memuat ${config.title.toLowerCase()}...`} />}
        {error && <PageError message={error} />}
        {rows && <OvertimeEntryTable rows={rows} actions={actions} />}
      </section>

      <OvertimeEntryDialog
        target={editTarget}
        overtimeType={isDw ? "dw" : "reguler"}
        title={config.title}
        period={period}
        periodLabel={periodLabel}
        onClose={() => setEditTarget(null)}
        onSaved={afterRowChanged}
      />
      <OvertimeDeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onSaved={afterRowChanged} />
    </div>
  );
}
