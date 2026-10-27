"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Badge } from "@mestakara/ui/badge";
import { Card, CardContent } from "@mestakara/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mestakara/ui/tabs";

import { PageHeader } from "@/components/shared/PageHeader";
import { PageError } from "@/components/shared/PageState";
import { PeriodFilter } from "@/features/karyawan/PeriodFilter";
import { useApiGet } from "@/hooks/useApiGet";
import { ATTENDANCE_IMPORTS, findImportByTab, type AttendanceImportConfig } from "@/lib/attendance-rules";
import { currentPeriod, periodLabel, toPeriodParam, type DataPeriod } from "@/lib/period-rules";
import { FIRST_WAGE_YEAR } from "@/lib/wage-rules";
import type { AttendanceImportSection, AttendanceImportStatus } from "@/types/api/attendance";

import { AttendanceImportDialog } from "./AttendanceImportDialog";
import { DaftarHadirTab } from "./DaftarHadirTab";
import { ImportHistorySheet } from "./ImportHistorySheet";
import { ImportSectionCard } from "./ImportSectionCard";
import { LemburTab } from "./LemburTab";

/**
 * Halaman UNGGAH ABSENSI (karyawan Casual & Daily Worker):
 *
 *   📅 Periode [Oktober ▾][2026 ▾]                                  Status periode: [Draf]
 *   [ Daftar Hadir ✓ ]  [ Lembur Reguler ✓ 37 ]  [ Lembur DW ● Belum ]       ← tab (tersimpan di ?tab=)
 *   (tab Lembur DW juga berisi Target vs Upah Lembur DW + Hitung Rekomendasi)
 *   ┌ kotak unggah tab ini: keterangan · terakhir diunggah · Riwayat · Unduh Template · Unggah File ┐
 *   isi tab: rekap daftar hadir (+ detail & koreksi)  ATAU  daftar lembur
 *
 * Alurnya:
 *   1. Pilih periode -> ambil status unggahan ketiga jenis (/api/attendance-imports?period=YYYY-MM)
 *   2. Unduh template (sudah terisi data tersimpan) -> isi di Excel -> Unggah File (periksa dulu, lalu simpan)
 *   3. Setelah disimpan, status & isi tab dimuat ulang
 * Periode yang sudah dikunci (Tahap Daftar Upah) tidak bisa diunggah / dikoreksi lagi.
 */
export function UnggahAbsensiPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeConfig = findImportByTab(searchParams.get("tab"));

  const [period, setPeriod] = useState<DataPeriod>(() => currentPeriod());
  const periodParam = toPeriodParam(period);
  const label = periodLabel(period);

  const { data: status, refreshing, error, reload } = useApiGet<AttendanceImportStatus>(
    `/api/attendance-imports?period=${periodParam}`,
  );
  const locked = status?.period_status === "dikunci";

  const [uploadConfig, setUploadConfig] = useState<AttendanceImportConfig | null>(null);
  const [historyConfig, setHistoryConfig] = useState<AttendanceImportConfig | null>(null);
  // Bertambah setiap kali ada unggahan tersimpan -> isi tab dibuat ulang (data diambil lagi).
  const [version, setVersion] = useState(0);

  /** Status satu jenis unggahan pada periode ini. */
  const sectionOf = (config: AttendanceImportConfig) =>
    status?.sections.find((section) => section.import_type === config.type);

  /** Pindah tab: simpan di alamat halaman supaya tombol Back & link langsung membuka tab yang sama. */
  function changeTab(tab: string) {
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  function afterSaved() {
    reload();
    setVersion((value) => value + 1);
  }

  return (
    <>
      <PageHeader
        title="Unggah Absensi"
        description="Daftar hadir dan lembur karyawan Casual & Daily Worker per periode, dari file Excel. Dasar perhitungan Daftar Upah."
      />

      <Card>
        <CardContent className="flex flex-col gap-5">
          <PeriodFilter
            value={period}
            onChange={setPeriod}
            firstYear={FIRST_WAGE_YEAR}
            loading={refreshing}
            action={
              status && (
                <p className="flex items-center gap-2 typo-body-s text-fg-secondary">
                  Status periode:
                  {locked ? (
                    <Badge variant="warning">
                      <Lock className="size-3" />
                      Dikunci
                    </Badge>
                  ) : (
                    <Badge variant="neutral">Draf</Badge>
                  )}
                </p>
              )
            }
          />

          {error && <PageError message={error} />}
          {locked && (
            <Alert variant="warning">
              <AlertDescription>
                Upah periode {label} sudah dikunci. Absensi hanya bisa dilihat; unggah dan koreksi tidak bisa lagi.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeConfig.tab} onValueChange={changeTab}>
            <TabsList variant="line" className="w-full justify-start overflow-x-auto">
              {ATTENDANCE_IMPORTS.map((config) => (
                <TabsTrigger key={config.type} value={config.tab}>
                  {config.title}
                  <TabStatus config={config} section={sectionOf(config)} />
                </TabsTrigger>
              ))}
            </TabsList>

            {ATTENDANCE_IMPORTS.map((config) => (
              <TabsContent key={config.type} value={config.tab} className="flex flex-col gap-5 pt-5">
                <ImportSectionCard
                  config={config}
                  section={sectionOf(config)}
                  period={periodParam}
                  periodLabel={label}
                  locked={locked}
                  onUpload={() => setUploadConfig(config)}
                  onShowHistory={() => setHistoryConfig(config)}
                />

                {config.type === "daftar_hadir" ? (
                  <DaftarHadirTab key={`${periodParam}-${version}`} period={periodParam} periodLabel={label} locked={locked} />
                ) : (
                  <LemburTab
                    key={`${periodParam}-${version}`}
                    config={config}
                    period={periodParam}
                    periodLabel={label}
                    locked={locked}
                    onChanged={reload}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <AttendanceImportDialog
        config={uploadConfig}
        period={periodParam}
        periodLabel={label}
        onClose={() => setUploadConfig(null)}
        onSaved={afterSaved}
      />
      <ImportHistorySheet
        config={historyConfig}
        periodLabel={label}
        batches={historyConfig ? (sectionOf(historyConfig)?.batches ?? []) : []}
        onClose={() => setHistoryConfig(null)}
      />
    </>
  );
}

/**
 * Tanda kecil di tab:  ✓ sudah ada data (lembur + jumlah barisnya) · ● belum ada data · ⚠ unggahan terakhir ada konflik.
 * Jumlahnya dari SEMUA sumber (Excel, mobile, manual, rekomendasi), bukan hanya Excel.
 * Tidak tampil selama status belum dimuat.
 */
function TabStatus({ config, section }: { config: AttendanceImportConfig; section: AttendanceImportSection | undefined }) {
  if (!section) return null;

  const conflicts = section.active_batch?.conflict_count ?? 0;
  if (section.entry_count === 0) return <span className="ml-1.5 typo-body-s text-fg-tertiary">● Belum</span>;
  if (conflicts > 0) return <span className="ml-1.5 typo-body-s text-fg-warning">⚠ {conflicts} konflik</span>;

  return (
    <span className="ml-1.5 typo-body-s text-fg-success">
      ✓{config.type !== "daftar_hadir" && ` ${section.entry_count}`}
    </span>
  );
}
