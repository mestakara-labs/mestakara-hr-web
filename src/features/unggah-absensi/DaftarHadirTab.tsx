"use client";

import { useCallback, useState } from "react";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { AttendanceSummaryRow } from "@/types/api/attendance";

import { AttendanceDetailSheet } from "./AttendanceDetailSheet";
import { AttendanceRecapTable } from "./AttendanceRecapTable";

interface DaftarHadirTabProps {
  period: string;
  periodLabel: string;
  locked: boolean;
}

/**
 * Isi tab DAFTAR HADIR di bawah kotak unggah:
 *   1. Rekap per karyawan dari /api/attendance-summaries?period=YYYY-MM
 *   2. Klik nama -> panel detail (kalender kode per tanggal, lembur, jejak perubahan, koreksi manual)
 *   3. Setelah koreksi, rekap dimuat ulang
 */
export function DaftarHadirTab({ period, periodLabel, locked }: DaftarHadirTabProps) {
  const { data: rows, loading, error, reload } = useApiGet<AttendanceSummaryRow[]>(`/api/attendance-summaries?period=${period}`);
  const [detailTarget, setDetailTarget] = useState<AttendanceSummaryRow | null>(null);

  // useCallback: diteruskan ke konfigurasi kolom tabel yang dibuat sekali dengan useMemo.
  const openDetail = useCallback((row: AttendanceSummaryRow) => setDetailTarget(row), []);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="typo-label-m text-fg-heading">Rekap Daftar Hadir {periodLabel}</h3>

      {loading && <PageLoading label="Memuat rekap daftar hadir..." />}
      {error && <PageError message={error} />}
      {rows && <AttendanceRecapTable rows={rows} onOpen={openDetail} />}

      <AttendanceDetailSheet
        target={detailTarget}
        period={period}
        periodLabel={periodLabel}
        locked={locked}
        onClose={() => setDetailTarget(null)}
        onChanged={reload}
      />
    </div>
  );
}
