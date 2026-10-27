"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { ApiError, apiDownload } from "@/lib/http-client";
import { periodLabel, toPeriodParam, type DataPeriod } from "@/lib/period-rules";

interface ExportKaryawanButtonProps {
  /** Periode Data yang sedang dipilih di halaman */
  period: DataPeriod;
  /** Status kepegawaian yang sedang dipilih di halaman ("Aktif", dst.); "" = semua karyawan */
  activeStatus: string;
}

/**
 * Tombol "Ekspor Excel" di halaman Data Karyawan.
 *
 *   [▦ Ekspor Excel]  ->  [◌ Mengekspor...]  ->  file .xlsx terunduh + toast
 *
 * Alurnya:
 *   1. Minta file ke /api/employees/export, ikut filter Periode Data & Status Kepegawaian yang sedang dipilih
 *   2. Isi & format Excel disusun backend; nama filenya juga dari backend (bulan PERIODE), mis.
 *      "Database Karyawan PTPN I Regional 2 Unit Agrowisata - September 2026.xlsx"
 *   3. Berhasil -> file disimpan browser + toast hijau
 *      Gagal    -> toast merah berisi alasannya (mis. backend tidak bisa dihubungi)
 */
export function ExportKaryawanButton({ period, activeStatus }: ExportKaryawanButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function exportExcel() {
    setExporting(true);

    try {
      // active_status kosong = semua karyawan, jadi tidak ikut dikirim.
      const query = new URLSearchParams({ period: toPeriodParam(period) });
      if (activeStatus) query.set("active_status", activeStatus);

      const fileName = await apiDownload(`/api/employees/export?${query}`, defaultFileName(period));
      toast.success("Data karyawan berhasil diekspor", { description: fileName });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
      toast.error("Data karyawan gagal diekspor", { description: message });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="outline" disabled={exporting} onClick={exportExcel}>
      {exporting ? <Spinner /> : <FileSpreadsheet />}
      {exporting ? "Mengekspor..." : "Ekspor Excel"}
    </Button>
  );
}

/**
 * Nama file CADANGAN, hanya dipakai kalau backend tidak mengirim nama file.
 * Formatnya sama dengan nama dari backend, mis.
 * "Database Karyawan PTPN I Regional 2 Unit Agrowisata - September 2026.xlsx"
 */
function defaultFileName(period: DataPeriod): string {
  return `Database Karyawan PTPN I Regional 2 Unit Agrowisata - ${periodLabel(period)}.xlsx`;
}
