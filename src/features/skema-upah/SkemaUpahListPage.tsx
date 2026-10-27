"use client";

import { useCallback, useState } from "react";
import { Ban, CalendarCheck, Download, Pencil, Upload, Users, UtensilsCrossed, Wallet } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { NumberCard } from "@/components/shared/NumberCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { PeriodFilter } from "@/features/karyawan/PeriodFilter";
import { useApiGet } from "@/hooks/useApiGet";
import { ApiError, apiDownload } from "@/lib/http-client";
import { currentPeriod, periodLabel, toPeriodParam, type DataPeriod } from "@/lib/period-rules";
import { FIRST_WAGE_YEAR } from "@/lib/wage-rules";
import type { PayrollGroupResource } from "@/types/api/payroll-group";
import type { WageEmployeeResource } from "@/types/api/wage";

import { BulkSkemaDialog } from "./BulkSkemaDialog";
import { EditSkemaDialog } from "./EditSkemaDialog";
import { ImportSkemaDialog } from "./ImportSkemaDialog";
import { calculateSkemaUpahStats } from "./skema-upah-stats";
import { SkemaHistorySheet } from "./SkemaHistorySheet";
import { SkemaUpahTable } from "./SkemaUpahTable";

/**
 * Halaman SKEMA UPAH KARYAWAN (Casual & Daily Worker).
 *
 * Alurnya:
 *   1. Pilih Periode (bawaan bulan berjalan) -> ambil karyawan Casual & DW yang aktif pada periode itu
 *      beserta skema, rekening, dan cost center yang berlaku (/api/wage-schemes?period=YYYY-MM)
 *   2. Kartu ringkasan: total, belum diatur, harian, flat, dibatasi, uang makan
 *   3. Ubah satu karyawan (menu Aksi), ubah sekaligus (centang baris), atau lihat riwayatnya
 *   4. Isi banyak data sekaligus: Unduh Template -> isi di Excel -> Unggah Excel (pratinjau dulu)
 *
 * Setiap perubahan menambah riwayat; skema lama tetap tersimpan.
 */
export function SkemaUpahListPage() {
  const [period, setPeriod] = useState<DataPeriod>(() => currentPeriod());
  const { data: rows, loading, refreshing, error, reload } = useApiGet<WageEmployeeResource[]>(
    `/api/wage-schemes?period=${toPeriodParam(period)}`,
  );
  const { data: groups } = useApiGet<PayrollGroupResource[]>("/api/payroll-groups");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editTarget, setEditTarget] = useState<WageEmployeeResource | null>(null);
  const [historyTarget, setHistoryTarget] = useState<WageEmployeeResource | null>(null);
  const [bulkTargets, setBulkTargets] = useState<WageEmployeeResource[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // useCallback: diteruskan ke konfigurasi kolom tabel yang dibuat sekali dengan useMemo.
  const openEdit = useCallback((row: WageEmployeeResource) => setEditTarget(row), []);
  const openHistory = useCallback((row: WageEmployeeResource) => setHistoryTarget(row), []);

  const groupOptions = [...(groups ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    .map((group) => ({ value: group.id, label: group.name }));
  const selectedRows = rows?.filter((row) => selectedIds.includes(row.id)) ?? [];
  const stats = calculateSkemaUpahStats(rows ?? []);

  /** Setelah data berubah: muat ulang tabel dan kosongkan centang. */
  function afterSaved() {
    setSelectedIds([]);
    reload();
  }

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const fileName = await apiDownload(
        `/api/wage-schemes/template?period=${toPeriodParam(period)}`,
        `Template Data Upah Karyawan - ${periodLabel(period)}.xlsx`,
      );
      toast.success("Template berhasil diunduh", { description: fileName });
    } catch (downloadError) {
      const message = downloadError instanceof ApiError ? downloadError.message : "Terjadi kesalahan. Silakan coba lagi.";
      toast.error("Template gagal diunduh", { description: message });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Skema Upah Karyawan"
        description="Gaji Pokok, HKE, batas hari kerja, tunjangan, uang makan, dan kelompok daftar upah karyawan Casual & Daily Worker."
      />

      {loading && <PageLoading label="Memuat skema upah..." />}
      {error && <PageError message={error} />}

      {rows && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <NumberCard title="Karyawan Casual & DW" icon={Users} value={stats.total} note={`aktif pada ${periodLabel(period)}`} />
            <NumberCard title="Belum Diatur" icon={Ban} value={stats.unset} note="skema upah belum diisi" />
            <NumberCard title="Harian / Flat" icon={Wallet} value={`${stats.daily} / ${stats.flat}`} textValue note="jumlah per jenis upah" />
            <NumberCard title="Dibatasi Hari Kerja" icon={CalendarCheck} value={stats.capped} note="kelebihannya dibayar sebagai Lembur DW" />
            <NumberCard title="Diberi Uang Makan" icon={UtensilsCrossed} value={stats.withMeal} note="dikali jumlah hari K" />
          </div>

          <Card>
            <CardContent className="flex flex-col gap-5">
              <PeriodFilter
                value={period}
                onChange={(next) => {
                  setPeriod(next);
                  setSelectedIds([]);
                }}
                firstYear={FIRST_WAGE_YEAR}
                loading={refreshing}
                action={
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={downloadTemplate} disabled={downloading}>
                      {downloading ? <Spinner /> : <Download />}
                      {downloading ? "Mengunduh..." : "Unduh Template"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsImporting(true)}>
                      <Upload />
                      Unggah Excel
                    </Button>
                  </div>
                }
              />

              {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-subtle px-4 py-3">
                  <p className="typo-label-m text-fg-brand">{selectedIds.length} karyawan dipilih</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                      Batal Pilih
                    </Button>
                    <Button size="sm" onClick={() => setBulkTargets(selectedRows)}>
                      <Pencil />
                      Ubah Sekaligus
                    </Button>
                  </div>
                </div>
              )}

              <SkemaUpahTable
                rows={rows}
                selection={{ selectedIds, onChange: setSelectedIds }}
                onEdit={openEdit}
                onShowHistory={openHistory}
              />
            </CardContent>
          </Card>
        </>
      )}

      <EditSkemaDialog target={editTarget} payrollGroupOptions={groupOptions} onClose={() => setEditTarget(null)} onSaved={afterSaved} />
      <BulkSkemaDialog targets={bulkTargets} payrollGroupOptions={groupOptions} onClose={() => setBulkTargets([])} onSaved={afterSaved} />
      <SkemaHistorySheet target={historyTarget} onClose={() => setHistoryTarget(null)} />
      <ImportSkemaDialog open={isImporting} onClose={() => setIsImporting(false)} onSaved={afterSaved} />
    </>
  );
}
