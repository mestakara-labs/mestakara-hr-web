"use client";

import { useCallback, useMemo, useState } from "react";
import { Copy, FileSpreadsheet, FileText, HandCoins, Lock, LockOpen, Scissors, Users, Wallet, X } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Badge } from "@mestakara/ui/badge";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@mestakara/ui/tabs";

import { NumberCard } from "@/components/shared/NumberCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { PeriodFilter } from "@/features/karyawan/PeriodFilter";
import { useApiGet } from "@/hooks/useApiGet";
import { formatDateTime } from "@/lib/date";
import { PAYROLL_GROUP_BY } from "@/lib/payroll-rules";
import { currentPeriod, periodLabel, toPeriodParam, type DataPeriod } from "@/lib/period-rules";
import { FIRST_WAGE_YEAR, formatRupiah } from "@/lib/wage-rules";
import type { PayrollGroupBy, PayrollResource, PayrollRow } from "@/types/api/payroll";

import { CopyDeductionsDialog } from "./CopyDeductionsDialog";
import { DeductionDialog } from "./DeductionDialog";
import { LockPeriodDialog, UnlockPeriodDialog } from "./LockPeriodDialogs";
import { PayrollDetailSheet } from "./PayrollDetailSheet";
import { PayrollExportDialog, type ExportDocument } from "./PayrollExportDialog";
import { PayrollGroupTable } from "./PayrollGroupTable";
import { PayrollReadinessCard } from "./PayrollReadinessCard";
import { PayrollTable } from "./PayrollTable";

/**
 * Halaman DAFTAR UPAH karyawan Casual & Daily Worker:
 *
 *   Daftar Upah                                              [▦ Ekspor Daftar Upah] [📄 SPKL]
 *   📅 Periode [Oktober ▾][2026 ▾]                        Status: [Draf]  [🔒 Kunci Periode]
 *   Kesiapan (peringatan + tautan)            — atau info "Dikunci ... oleh ..." kalau dikunci
 *   [Karyawan] [Upah & Tunjangan] [Potongan] [Upah Diterima]
 *   Kelompokkan berdasarkan: [Kelompok Daftar Upah | Bidang]
 *   Rekap per kelompok (klik = filter rincian)
 *   Rincian karyawan (centang -> Ubah Potongan Sekaligus / SPKL yang dicentang)      [Salin Potongan Bulan Lalu]
 *
 * Alurnya:
 *   1. Pilih periode & pengelompokan -> /api/payroll?period=YYYY-MM&group_by=... (dihitung backend)
 *   2. Bereskan Kesiapan, isi potongan (per karyawan, sekaligus, atau salin bulan lalu)
 *   3. Ekspor Daftar Upah / SPKL (Excel atau PDF) -> Kunci Periode (angka & penanda tangan dibekukan)
 */
export function DaftarUpahPage() {
  const [period, setPeriod] = useState<DataPeriod>(() => currentPeriod());
  const [groupBy, setGroupBy] = useState<PayrollGroupBy>("payroll_group");
  const periodParam = toPeriodParam(period);
  const label = periodLabel(period);

  const { data: payroll, loading, refreshing, error, reload } = useApiGet<PayrollResource>(
    `/api/payroll?${new URLSearchParams({ period: periodParam, group_by: groupBy })}`,
  );
  const locked = payroll?.status === "dikunci";

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Kelompok yang dipilih di rekap (rincian difilter ke kelompok ini); null = semua.
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<PayrollRow | null>(null);
  const [deductionTargets, setDeductionTargets] = useState<PayrollRow[]>([]);
  const [isCopying, setIsCopying] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [exportDocument, setExportDocument] = useState<ExportDocument | null>(null);

  // useMemo/useCallback: diteruskan ke konfigurasi kolom tabel yang dibuat ulang hanya kalau ini berubah.
  const groupNames = useMemo(() => new Map((payroll?.groups ?? []).map((group) => [group.key, group.name])), [payroll]);
  const groupNameOf = useCallback((key: string) => groupNames.get(key) ?? key, [groupNames]);
  const openDetail = useCallback((row: PayrollRow) => setDetailTarget(row), []);
  const editDeductions = useMemo(() => (locked ? null : (row: PayrollRow) => setDeductionTargets([row])), [locked]);

  const rows = payroll?.rows ?? [];
  const visibleRows = groupKey ? rows.filter((row) => row.group_key === groupKey) : rows;
  const selectedRows = rows.filter((row) => selectedIds.includes(row.employee_id));

  /** Ganti periode / pengelompokan: centang & filter kelompok dikosongkan. */
  function resetSelection() {
    setSelectedIds([]);
    setGroupKey(null);
  }

  /** Setelah data berubah (potongan, kunci): muat ulang dan kosongkan centang. */
  function afterSaved() {
    setSelectedIds([]);
    reload();
  }

  return (
    <>
      <PageHeader
        title="Daftar Upah"
        description="Upah karyawan Casual & Daily Worker per periode: gaji, lembur, tunjangan, potongan, dan upah diterima. Dasar ekspor Daftar Upah & SPKL."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setExportDocument("daftar-upah")} disabled={!payroll}>
              <FileSpreadsheet />
              Ekspor Daftar Upah
            </Button>
            <Button variant="outline" onClick={() => setExportDocument("spkl")} disabled={!payroll}>
              <FileText />
              SPKL
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-5">
          <PeriodFilter
            value={period}
            onChange={(next) => {
              setPeriod(next);
              resetSelection();
            }}
            firstYear={FIRST_WAGE_YEAR}
            loading={refreshing}
            action={
              payroll && (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="flex items-center gap-2 typo-body-s text-fg-secondary">
                    Status:
                    {locked ? (
                      <Badge variant="warning">
                        <Lock className="size-3" />
                        Dikunci
                      </Badge>
                    ) : (
                      <Badge variant="neutral">Draf</Badge>
                    )}
                  </p>
                  {locked ? (
                    <Button variant="outline" onClick={() => setIsUnlocking(true)}>
                      <LockOpen />
                      Buka Kunci
                    </Button>
                  ) : (
                    <Button onClick={() => setIsLocking(true)} disabled={!payroll.can_lock}>
                      <Lock />
                      Kunci Periode
                    </Button>
                  )}
                </div>
              )
            }
          />

          {loading && <PageLoading label="Menghitung daftar upah..." />}
          {error && <PageError message={error} />}

          {payroll && (
            <>
              {locked ? (
                <Alert variant="warning">
                  <AlertDescription>
                    Daftar Upah {label} dikunci {payroll.locked_at && formatDateTime(payroll.locked_at)}
                    {payroll.locked_by && ` oleh ${payroll.locked_by}`}. Angka dan penanda tangan dibekukan; absensi, lembur, dan
                    potongan tidak bisa diubah.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <PayrollReadinessCard readiness={payroll.readiness} />
                  {!payroll.can_lock && (
                    <p className="typo-body-s text-fg-tertiary">{label} belum berakhir, jadi belum bisa dikunci.</p>
                  )}
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <NumberCard title="Karyawan" icon={Users} value={payroll.summary.employees} note="Casual & Daily Worker aktif di periode ini" />
                <NumberCard title="Upah & Tunjangan" icon={Wallet} value={formatRupiah(payroll.summary.gross)} textValue note="sebelum potongan" />
                <NumberCard title="Potongan" icon={Scissors} value={formatRupiah(payroll.summary.deductions)} textValue note="BPJS, PPh 21, Kebun/Unit" />
                <NumberCard title="Upah Diterima" icon={HandCoins} value={formatRupiah(payroll.summary.net)} textValue note="yang ditransfer" />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="typo-label-m text-fg-heading">Rekap per Kelompok</h3>
                <div className="flex items-center gap-2 typo-body-s text-fg-secondary">
                  Kelompokkan berdasarkan
                  <Tabs
                    value={groupBy}
                    onValueChange={(value) => {
                      setGroupBy(value as PayrollGroupBy);
                      resetSelection();
                    }}
                  >
                    <TabsList>
                      {PAYROLL_GROUP_BY.map((option) => (
                        <TabsTrigger key={option.value} value={option.value}>
                          {option.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <PayrollGroupTable groups={payroll.groups} selectedKey={groupKey} onSelect={setGroupKey} />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex flex-wrap items-center gap-2 typo-label-m text-fg-heading">
                  Rincian Karyawan
                  {groupKey && (
                    <Badge variant="neutral" dot={false}>
                      {groupNameOf(groupKey)}
                      <button type="button" aria-label="Tampilkan semua kelompok" onClick={() => setGroupKey(null)}>
                        <X className="size-3" />
                      </button>
                    </Badge>
                  )}
                </h3>
                <Button variant="outline" onClick={() => setIsCopying(true)} disabled={locked}>
                  <Copy />
                  Salin Potongan Bulan Lalu
                </Button>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-subtle px-4 py-3">
                  <p className="typo-label-m text-fg-brand">{selectedIds.length} karyawan dipilih</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                      Batal Pilih
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setExportDocument("spkl")}>
                      <FileText />
                      SPKL yang Dicentang
                    </Button>
                    <Button size="sm" onClick={() => setDeductionTargets(selectedRows)} disabled={locked}>
                      <Scissors />
                      Ubah Potongan Sekaligus
                    </Button>
                  </div>
                </div>
              )}

              <PayrollTable
                rows={visibleRows}
                selection={{ selectedIds, onChange: setSelectedIds }}
                groupNameOf={groupNameOf}
                onShowDetail={openDetail}
                onEditDeductions={editDeductions}
              />

              {payroll.lock_history.length > 0 && (
                <div className="flex flex-col gap-1 typo-body-s text-fg-tertiary">
                  <p className="typo-label-m text-fg-heading">Riwayat Kunci</p>
                  {payroll.lock_history.map((item) => (
                    <p key={`${item.action}-${item.at}`}>
                      {formatDateTime(item.at)} · {item.action === "kunci" ? "Dikunci" : "Dibuka"}
                      {item.by && ` oleh ${item.by}`}
                      {item.reason && ` — "${item.reason}"`}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <PayrollDetailSheet target={detailTarget} periodLabel={label} onClose={() => setDetailTarget(null)} />
      <DeductionDialog targets={deductionTargets} period={periodParam} onClose={() => setDeductionTargets([])} onSaved={afterSaved} />
      <CopyDeductionsDialog
        open={isCopying}
        period={periodParam}
        periodLabel={label}
        onClose={() => setIsCopying(false)}
        onSaved={afterSaved}
      />
      {payroll && (
        <>
          <LockPeriodDialog
            open={isLocking}
            period={periodParam}
            periodLabel={label}
            readiness={payroll.readiness}
            onClose={() => setIsLocking(false)}
            onSaved={afterSaved}
          />
          <UnlockPeriodDialog
            open={isUnlocking}
            period={periodParam}
            periodLabel={label}
            onClose={() => setIsUnlocking(false)}
            onSaved={afterSaved}
          />
          <PayrollExportDialog
            document={exportDocument}
            period={periodParam}
            periodLabel={label}
            groupBy={groupBy}
            groups={payroll.groups}
            isDraft={!locked}
            selectedEmployeeIds={exportDocument === "spkl" ? selectedIds : []}
            onClose={() => setExportDocument(null)}
          />
        </>
      )}
    </>
  );
}
