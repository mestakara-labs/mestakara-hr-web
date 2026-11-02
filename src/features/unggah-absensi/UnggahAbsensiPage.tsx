"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Badge } from "@mestakara/ui/badge";
import { Card, CardContent } from "@mestakara/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mestakara/ui/tabs";

import { FieldNote } from "@/components/shared/FieldNote";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageError } from "@/components/shared/PageState";
import { PeriodFilter } from "@/features/karyawan/PeriodFilter";
import { useApiGet } from "@/hooks/useApiGet";
import {
  EMPLOYEE_CATEGORIES,
  findCategoryBySlug,
  findImportByTab,
  type AttendanceImportConfig,
} from "@/lib/attendance-rules";
import { payrollRowsOf } from "@/lib/attendance-summary";
import { currentPeriod, periodLabel, toPeriodParam, type DataPeriod } from "@/lib/period-rules";
import { FIRST_WAGE_YEAR } from "@/lib/wage-rules";
import type { AttendanceImportSection, AttendanceImportStatus, EmployeeCategory } from "@/types/api/attendance";
import type { PayrollResource } from "@/types/api/payroll";

import { AttendanceImportDialog } from "./AttendanceImportDialog";
import { DaftarHadirTab } from "./DaftarHadirTab";
import { ImportHistorySheet } from "./ImportHistorySheet";
import { ImportSectionCard } from "./ImportSectionCard";
import { LemburTab } from "./LemburTab";

/** Alamat status unggahan satu kategori pada satu periode. */
function statusPath(period: string, category: EmployeeCategory): string {
  return `/api/attendance-imports?${new URLSearchParams({ period, employee_category: category })}`;
}

/**
 * Halaman UNGGAH ABSENSI, dipisah per kategori karyawan:
 *
 *   📅 Periode [Oktober ▾][2026 ▾]                                  Status periode: [Draf]
 *   [        Karyawan Casual ✓        ][     Karyawan Daily Worker ● Belum     ]   ← tab besar (?kategori=)
 *   Karyawan Casual:
 *     [ Daftar Hadir ✓ ]  [ Lembur Reguler ✓ 37 ]  [ Lembur DW ● Belum ]           ← tab kecil (?tab=)
 *     (tab Lembur DW juga berisi Target vs Upah Lembur DW + Hitung Rekomendasi)
 *   Karyawan Daily Worker:
 *     [ Daftar Hadir ✓ ]  [ Lembur Reguler ✓ 5 ]          (tanpa kode DW & Lembur DW)
 *   ┌ kotak unggah: keterangan · terakhir diunggah · Riwayat · Unduh Template · Unggah File ┐
 *   isi: rekap daftar hadir (+ detail & koreksi)  ATAU  daftar lembur
 *
 * Alurnya:
 *   1. Pilih periode -> ambil status unggahan kedua kategori (/api/attendance-imports?period=&employee_category=)
 *   2. Unduh template kategori itu (sudah terisi data tersimpan) -> isi di Excel -> Unggah File (periksa dulu, lalu simpan)
 *   3. Setelah disimpan, status & isi tab dimuat ulang. Unggahan hanya mengganti data kategori itu.
 *   4. Kartu ringkasan biaya di setiap tab memakai angka Daftar Upah (/api/payroll?period=, diambil sekali per periode
 *      dan dimuat ulang setiap kali absensi / lembur berubah), disaring per kategori.
 * Periode yang sudah dikunci (Tahap Daftar Upah) tidak bisa diunggah / dikoreksi lagi.
 */
export function UnggahAbsensiPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = findCategoryBySlug(searchParams.get("kategori"));
  const activeConfig = findImportByTab(category, searchParams.get("tab"));

  const [period, setPeriod] = useState<DataPeriod>(() => currentPeriod());
  const periodParam = toPeriodParam(period);
  const label = periodLabel(period);

  // Status kedua kategori diambil sekaligus, supaya tanda di kedua tab besar selalu tampil.
  const casual = useApiGet<AttendanceImportStatus>(statusPath(periodParam, "casual"));
  const dailyWorker = useApiGet<AttendanceImportStatus>(statusPath(periodParam, "daily_worker"));
  const statusOf = (value: EmployeeCategory) => (value === "casual" ? casual.data : dailyWorker.data);
  const status = statusOf(category.value);
  const error = casual.error ?? dailyWorker.error;
  // Angka upah untuk kartu ringkasan = Daftar Upah periode ini (dihitung backend), disaring per kategori.
  const payroll = useApiGet<PayrollResource>(`/api/payroll?${new URLSearchParams({ period: periodParam, group_by: "payroll_group" })}`);
  const costRows = payroll.data ? payrollRowsOf(payroll.data.rows, category) : null;
  // Kunci periode berlaku untuk kedua kategori.
  const locked = status?.period_status === "dikunci";

  const [uploadConfig, setUploadConfig] = useState<AttendanceImportConfig | null>(null);
  const [historyConfig, setHistoryConfig] = useState<AttendanceImportConfig | null>(null);
  // Bertambah setiap kali ada unggahan tersimpan -> isi tab dibuat ulang (data diambil lagi).
  const [version, setVersion] = useState(0);

  /** Status satu jenis unggahan pada kategori & periode yang dibuka. */
  const sectionOf = (config: AttendanceImportConfig) =>
    status?.sections.find((section) => section.import_type === config.type);

  /** Pindah kategori / tab: simpan di alamat halaman supaya tombol Back & link langsung membuka tab yang sama. */
  function changeTab(categorySlug: string, tab?: string) {
    const query = new URLSearchParams({ kategori: categorySlug });
    if (tab) query.set("tab", tab);
    router.replace(`${pathname}?${query}`, { scroll: false });
  }

  /** Setelah absensi / lembur berubah: status unggahan & angka upah dimuat ulang. */
  function reloadStatus() {
    casual.reload();
    dailyWorker.reload();
    payroll.reload();
  }

  function afterSaved() {
    reloadStatus();
    setVersion((value) => value + 1);
  }

  /** Isi satu jenis unggahan: kotak unggah + rekap daftar hadir / daftar lembur. */
  function renderImport(config: AttendanceImportConfig) {
    return (
      <>
        <ImportSectionCard
          config={config}
          category={category}
          section={sectionOf(config)}
          period={periodParam}
          periodLabel={label}
          locked={locked}
          onUpload={() => setUploadConfig(config)}
          onShowHistory={() => setHistoryConfig(config)}
        />

        {config.type === "daftar_hadir" ? (
          <DaftarHadirTab
            key={`${category.value}-${periodParam}-${version}`}
            category={category}
            period={periodParam}
            periodLabel={label}
            locked={locked}
            costRows={costRows}
            costError={payroll.error}
            onChanged={() => payroll.reload()}
          />
        ) : (
          <LemburTab
            key={`${category.value}-${periodParam}-${version}`}
            config={config}
            category={category}
            period={periodParam}
            periodLabel={label}
            locked={locked}
            costRows={costRows}
            costError={payroll.error}
            onChanged={reloadStatus}
          />
        )}
      </>
    );
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
            loading={casual.refreshing || dailyWorker.refreshing}
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

          {/* Tab besar: kategori karyawan, selebar kartu. */}
          <Tabs value={category.slug} onValueChange={(slug) => changeTab(slug)}>
            <TabsList className="w-full">
              {EMPLOYEE_CATEGORIES.map((item) => (
                // Di HP teksnya boleh turun baris supaya tab tidak melebar keluar layar.
                <TabsTrigger key={item.value} value={item.slug} className="h-auto! min-h-[30px] flex-1 py-1 whitespace-normal">

                  {item.label}
                  <CategoryStatus status={statusOf(item.value)} />
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {!category.hasDwOvertime && (
            <FieldNote>Karyawan Daily Worker tidak mendapat Lembur DW, dan kode DW tidak dipakai di daftar hadir.</FieldNote>
          )}

          {/* Tab kecil: Casual = Daftar Hadir · Lembur Reguler · Lembur DW; Daily Worker = Daftar Hadir · Lembur Reguler */}
          <Tabs value={activeConfig.tab} onValueChange={(tab) => changeTab(category.slug, tab)}>
            <TabsList variant="line" className="w-full justify-start overflow-x-auto">
              {category.imports.map((config) => (
                <TabsTrigger key={config.type} value={config.tab}>
                  {config.title}
                  <TabStatus config={config} section={sectionOf(config)} />
                </TabsTrigger>
              ))}
            </TabsList>

            {category.imports.map((config) => (
              <TabsContent key={config.type} value={config.tab} className="flex flex-col gap-5 pt-5">
                {renderImport(config)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <AttendanceImportDialog
        config={uploadConfig}
        category={category}
        period={periodParam}
        periodLabel={label}
        onClose={() => setUploadConfig(null)}
        onSaved={afterSaved}
      />
      <ImportHistorySheet
        config={historyConfig}
        category={category}
        periodLabel={label}
        batches={historyConfig ? (sectionOf(historyConfig)?.batches ?? []) : []}
        onClose={() => setHistoryConfig(null)}
      />
    </>
  );
}

/**
 * Tanda kecil di tab kecil:  ✓ sudah ada data (lembur + jumlah barisnya) · ● belum ada data · ⚠ unggahan terakhir ada konflik.
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

/**
 * Tanda kecil di tab besar (kategori):  ⚠ ada konflik di salah satu unggahan · ✓ daftar hadir sudah ada · ● belum.
 * Tidak tampil selama status belum dimuat.
 */
function CategoryStatus({ status }: { status: AttendanceImportStatus | null }) {
  if (!status) return null;

  const conflicts = status.sections.reduce((sum, section) => sum + (section.active_batch?.conflict_count ?? 0), 0);
  const attendance = status.sections.find((section) => section.import_type === "daftar_hadir");
  if (conflicts > 0) return <span className="ml-1.5 typo-body-s text-fg-warning">⚠ {conflicts} konflik</span>;
  if (!attendance || attendance.entry_count === 0) return <span className="ml-1.5 typo-body-s text-fg-tertiary">● Belum</span>;

  return <span className="ml-1.5 typo-body-s text-fg-success">✓</span>;
}
