"use client";

import { useCallback, useState } from "react";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { EmployeeCategoryConfig } from "@/lib/attendance-rules";
import type { AttendanceSummaryRow } from "@/types/api/attendance";
import type { PayrollRow } from "@/types/api/payroll";

import { AttendanceCostCards } from "./AttendanceCostCards";
import { AttendanceDetailSheet } from "./AttendanceDetailSheet";
import { AttendanceRecapTable } from "./AttendanceRecapTable";

interface DaftarHadirTabProps {
  /** Kategori karyawan yang dibuka (rekap & kode mengikuti kategori ini) */
  category: EmployeeCategoryConfig;
  period: string;
  periodLabel: string;
  locked: boolean;
  /** Baris Daftar Upah kategori ini untuk kartu biaya; null = masih dimuat / gagal */
  costRows: PayrollRow[] | null;
  costError: string | null;
  /** Dipanggil setelah koreksi (angka upah ikut dimuat ulang) */
  onChanged: () => void;
}

/**
 * Isi tab DAFTAR HADIR di bawah kotak unggah:
 *   0. Kartu ringkasan biaya (AttendanceCostCards): karyawan, hari kerja, upah hari kerja, upah per sub unit
 *   1. Rekap per karyawan dari /api/attendance-summaries?period=YYYY-MM&employee_category=casual|daily_worker
 *   2. Klik nama -> panel detail (kalender kode per tanggal, lembur, jejak perubahan, koreksi manual)
 *   3. Setelah koreksi, rekap dimuat ulang
 */
export function DaftarHadirTab({
  category,
  period,
  periodLabel,
  locked,
  costRows,
  costError,
  onChanged,
}: DaftarHadirTabProps) {
  const { data: rows, loading, error, reload } = useApiGet<AttendanceSummaryRow[]>(
    `/api/attendance-summaries?${new URLSearchParams({ period, employee_category: category.value })}`,
  );
  const [detailTarget, setDetailTarget] = useState<AttendanceSummaryRow | null>(null);

  // useCallback: diteruskan ke konfigurasi kolom tabel yang dibuat sekali dengan useMemo.
  const openDetail = useCallback((row: AttendanceSummaryRow) => setDetailTarget(row), []);

  return (
    <div className="flex flex-col gap-3">
      {rows && <AttendanceCostCards category={category} rows={rows} costRows={costRows} costError={costError} />}

      <h3 className="typo-label-m text-fg-heading">
        Rekap Daftar Hadir {category.label} {periodLabel}
      </h3>

      {loading && <PageLoading label="Memuat rekap daftar hadir..." />}
      {error && <PageError message={error} />}
      {rows && <AttendanceRecapTable rows={rows} category={category} onOpen={openDetail} />}

      <AttendanceDetailSheet
        target={detailTarget}
        category={category}
        period={period}
        periodLabel={periodLabel}
        locked={locked}
        onClose={() => setDetailTarget(null)}
        onChanged={() => {
          reload();
          onChanged();
        }}
      />
    </div>
  );
}
