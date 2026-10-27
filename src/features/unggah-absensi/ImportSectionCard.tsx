"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, History, Upload } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { formatDateTime } from "@/lib/date";
import { ApiError, apiDownload } from "@/lib/http-client";
import type { AttendanceImportConfig } from "@/lib/attendance-rules";
import type { AttendanceImportSection } from "@/types/api/attendance";

interface ImportSectionCardProps {
  config: AttendanceImportConfig;
  /** Status unggahan jenis ini pada periode itu (undefined selama belum dimuat) */
  section: AttendanceImportSection | undefined;
  /** Periode "YYYY-MM" dan namanya, mis. "2026-10" / "Oktober 2026" */
  period: string;
  periodLabel: string;
  /** true = periode sudah dikunci; tombol unggah dimatikan */
  locked: boolean;
  onUpload: () => void;
  onShowHistory: () => void;
}

/**
 * KOTAK UNGGAH satu jenis absensi (dipakai di ketiga tab):
 *
 *   ▦ Daftar Hadir
 *   Satu kode per tanggal: K, DW, I, S, M, C, L. Hanya K yang dibayar; sel kosong = tidak masuk.
 *   Terakhir diunggah: absensi-okt.xlsx · 25 Okt 2026, 10.15 · Admin SDM · 361 karyawan · 2 konflik
 *                                       [⟲ Riwayat]  [⬇ Unduh Template]  [⬆ Unggah File]
 */
export function ImportSectionCard({
  config,
  section,
  period,
  periodLabel,
  locked,
  onUpload,
  onShowHistory,
}: ImportSectionCardProps) {
  const [downloading, setDownloading] = useState(false);
  const batch = section?.active_batch ?? null;

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const fileName = await apiDownload(
        `/api/attendance-imports/template?${new URLSearchParams({ period, type: config.type })}`,
        `Template ${config.title} - ${periodLabel}.xlsx`,
      );
      toast.success("Template berhasil diunduh", { description: fileName });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
      toast.error("Template gagal diunduh", { description: message });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex items-center gap-2 typo-label-m text-fg-heading">
          <FileSpreadsheet className="size-4 text-fg-brand" />
          {config.title}
        </p>
        <p className="typo-body-s text-fg-secondary">{config.description}</p>
        <p className="typo-body-s text-fg-tertiary">
          {batch
            ? `Terakhir diunggah: ${batch.file_name} · ${formatDateTime(batch.created_at)}${batch.uploaded_by ? ` · ${batch.uploaded_by}` : ""} · ${batch.total_rows} ${config.rowUnit}${batch.conflict_count > 0 ? ` · ${batch.conflict_count} konflik` : ""}`
            : section?.batches.length
              ? `Unggahan terakhir (${section.batches[0].file_name}) sudah tergantikan seluruhnya, mis. oleh Hitung Rekomendasi. Lihat Riwayat.`
              : `Belum diunggah untuk ${periodLabel}.`}
        </p>
      </div>

      {/* Di HP tombolnya bertumpuk selebar layar; mulai tablet berdampingan. */}
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Button variant="ghost" onClick={onShowHistory}>
          <History />
          Riwayat
        </Button>
        <Button variant="outline" onClick={downloadTemplate} disabled={downloading}>
          {downloading ? <Spinner /> : <Download />}
          {downloading ? "Mengunduh..." : "Unduh Template"}
        </Button>
        <Button onClick={onUpload} disabled={locked}>
          <Upload />
          Unggah File
        </Button>
      </div>
    </div>
  );
}
