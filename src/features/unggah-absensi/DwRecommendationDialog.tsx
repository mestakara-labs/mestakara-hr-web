"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Badge } from "@mestakara/ui/badge";
import { Button } from "@mestakara/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mestakara/ui/dialog";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { formatMinutes } from "@/lib/attendance-rules";
import { formatDate, formatDayName } from "@/lib/date";
import { DW_TARGET_STATUSES, formatDifference } from "@/lib/dw-overtime-rules";
import { ApiError, apiPost } from "@/lib/http-client";
import { formatRupiah } from "@/lib/wage-rules";
import type {
  DwRecommendationEmployee,
  DwRecommendationPreview,
  DwRecommendationSavePayload,
  DwRecommendationSaveResult,
} from "@/types/api/dw-overtime";

interface DwRecommendationDialogProps {
  /** null = dialog tertutup; [] = semua karyawan ber-DW; isi = karyawan yang dicentang */
  employeeIds: string[] | null;
  period: string;
  periodLabel: string;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Dialog HITUNG REKOMENDASI LEMBUR DW:
 *
 *   1. Dibuka -> langsung dihitung (POST /api/dw-overtime-recommendations/preview, TIDAK menyimpan)
 *   2. Pratinjau per karyawan: Target | Upah Hasil | Selisih | Status | Tanggal | Diganti / Dipertahankan
 *      (klik baris = lihat tanggal & jamnya)
 *   3. [⤮ Acak Ulang] = hitung lagi dengan sebaran acak baru;  [Simpan] = simpan PERSIS yang tampil
 *
 * Simpan menghapus baris Excel & rekomendasi lama karyawan itu; baris manual & mobile tetap.
 */
export function DwRecommendationDialog(props: DwRecommendationDialogProps) {
  if (props.employeeIds === null) return null;
  // Dibuat ulang setiap kali dibuka, supaya pratinjau sebelumnya hilang.
  return <RecommendationDialogContent {...props} employeeIds={props.employeeIds} />;
}

function RecommendationDialogContent({
  employeeIds,
  period,
  periodLabel,
  onClose,
  onSaved,
}: DwRecommendationDialogProps & { employeeIds: string[] }) {
  const [preview, setPreview] = useState<DwRecommendationPreview | null>(null);
  const [busy, setBusy] = useState<"none" | "calculating" | "saving">("calculating");
  const [error, setError] = useState<string | null>(null);
  // Setiap kali angka ini bertambah (Acak Ulang), rekomendasi dihitung lagi.
  const [round, setRound] = useState(0);

  // Hitung rekomendasi (tanpa menyimpan) begitu dialog dibuka & setiap Acak Ulang.
  // employee_ids kosong = semua karyawan ber-DW.
  useEffect(() => {
    // Kalau dialog sudah ditutup sebelum hasil datang, hasilnya diabaikan.
    let isCancelled = false;

    async function calculate() {
      try {
        const response = await apiPost<DwRecommendationPreview>("/api/dw-overtime-recommendations/preview", {
          period,
          employee_ids: employeeIds,
        });
        if (isCancelled) return;
        setPreview(response.data);
        setError(null);
      } catch (calculateError) {
        if (isCancelled) return;
        setError(calculateError instanceof ApiError ? calculateError.message : "Rekomendasi gagal dihitung. Silakan coba lagi.");
      } finally {
        if (!isCancelled) setBusy("none");
      }
    }

    calculate();
    return () => {
      isCancelled = true;
    };
  }, [round, period, employeeIds]);

  function recalculate() {
    setBusy("calculating");
    setRound((value) => value + 1);
  }

  const calculated = preview?.employees.filter((employee) => employee.skipped_reason === null) ?? [];
  const skipped = preview?.employees.filter((employee) => employee.skipped_reason !== null) ?? [];

  async function save() {
    setBusy("saving");
    setError(null);
    try {
      const payload: DwRecommendationSavePayload = {
        period,
        employees: calculated.map((employee) => ({
          employee_id: employee.employee_id,
          entries: employee.entries.map(({ date, start_time, end_time }) => ({ date, start_time, end_time })),
        })),
      };
      const response = await apiPost<DwRecommendationSaveResult>("/api/dw-overtime-recommendations", payload);
      toast.success(response.message, {
        description: `${response.data.created_count} baris dibuat · ${response.data.deleted_count} baris lama dihapus`,
      });
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : "Rekomendasi gagal disimpan. Silakan coba lagi.");
      setBusy("none");
    }
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && busy === "none" && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Hitung Rekomendasi Lembur DW — {periodLabel}</DialogTitle>
          <DialogDescription>
            {employeeIds.length > 0 ? `${employeeIds.length} karyawan yang dicentang.` : "Semua karyawan yang punya hari DW."} Hasil
            belum disimpan sampai tombol Simpan diklik.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error && (
            <Alert variant="danger">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {busy === "calculating" && (
            <p className="flex items-center gap-2 typo-body-s text-fg-secondary">
              <Spinner /> Menghitung rekomendasi...
            </p>
          )}

          {preview && busy !== "calculating" && (
            <>
              <PreviewSummary preview={preview} />
              {calculated.length > 0 && <RecommendationTable employees={calculated} />}
              {skipped.length > 0 && <SkippedList employees={skipped} />}
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy !== "none"}>
            Batal
          </Button>
          <Button type="button" variant="outline" onClick={recalculate} disabled={busy !== "none"}>
            <Shuffle />
            Acak Ulang
          </Button>
          <Button type="button" onClick={save} disabled={busy !== "none" || calculated.length === 0}>
            {busy === "saving" && <Spinner />}
            {busy === "saving" ? "Menyimpan..." : `Simpan Rekomendasi (${calculated.length} karyawan)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Ringkasan di atas tabel pratinjau. */
function PreviewSummary({ preview }: { preview: DwRecommendationPreview }) {
  const { summary } = preview;

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-subtle p-3 typo-body-s text-fg-secondary">
      <p>
        <span className="font-medium text-fg-heading">{summary.employees} karyawan dihitung</span>
        {summary.skipped > 0 && ` · ${summary.skipped} dilewati`}
      </p>
      <p>
        Target {formatRupiah(summary.target_amount)} · Upah hasil {formatRupiah(summary.result_pay)} · Selisih{" "}
        {formatDifference(summary.difference)}
      </p>
      {summary.replaces_entries > 0 && (
        <p className="text-fg-warning">{summary.replaces_entries} baris lembur DW lama (Excel / rekomendasi) akan dihapus.</p>
      )}
    </div>
  );
}

/**
 * Tabel pratinjau per karyawan. Klik baris untuk melihat tanggal & jam rekomendasinya:
 *   ▸ Asep  | Rp 190.000 | Rp 192.200 | +Rp 2.200 | Sesuai | 4 tanggal | ganti 3 · pertahankan 1
 *       Kamis, 1 Oktober 2026  17:00–18:30  1 jam 30 menit  Rp 34.300
 */
function RecommendationTable({ employees }: { employees: DwRecommendationEmployee[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="min-w-200">
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead className="text-right">Target</TableHead>
            <TableHead className="text-right">Upah Hasil</TableHead>
            <TableHead className="text-right">Selisih</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tanggal Lembur</TableHead>
            <TableHead>Baris Lama</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => {
            const isOpen = openId === employee.employee_id;
            const status = DW_TARGET_STATUSES[employee.status];

            return (
              <Fragment key={employee.employee_id}>
                <TableRow className="cursor-pointer" onClick={() => setOpenId(isOpen ? null : employee.employee_id)}>
                  <TableCell>
                    <span className="flex items-start gap-1.5">
                      {isOpen ? <ChevronDown className="mt-0.5 size-4 shrink-0" /> : <ChevronRight className="mt-0.5 size-4 shrink-0" />}
                      <span>
                        <span className="block font-medium text-fg-heading">{employee.name}</span>
                        <span className="block typo-body-s text-fg-tertiary">{employee.registration_number ?? "tanpa No. Registrasi"}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatRupiah(employee.target_amount)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap font-medium text-fg-heading">{formatRupiah(employee.result_pay)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatDifference(employee.difference)}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {employee.entries.length} tanggal
                    {employee.notes.map((note) => (
                      <p key={note} className="typo-body-s text-fg-warning">
                        {note}
                      </p>
                    ))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap typo-body-s text-fg-secondary">
                    <p>diganti {employee.replaces_entries}</p>
                    {employee.kept_entries > 0 && (
                      <p>
                        dipertahankan {employee.kept_entries} ({formatRupiah(employee.kept_pay)})
                      </p>
                    )}
                  </TableCell>
                </TableRow>

                {isOpen &&
                  employee.entries.map((entry) => (
                    <TableRow key={entry.date} className="bg-subtle">
                      <TableCell className="pl-10 whitespace-nowrap">
                        {formatDayName(entry.date)}, {formatDate(entry.date)}
                      </TableCell>
                      <TableCell colSpan={2} className="whitespace-nowrap">
                        {entry.start_time}–{entry.end_time}
                        {entry.crosses_midnight && " (+1)"} · {formatMinutes(entry.duration_minutes)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatRupiah(entry.pay)}</TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  ))}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** Karyawan yang tidak dihitung beserta alasannya. */
function SkippedList({ employees }: { employees: DwRecommendationEmployee[] }) {
  return (
    <div className="flex flex-col gap-1 typo-body-s">
      <p className="typo-label-m text-fg-heading">Dilewati ({employees.length})</p>
      {employees.map((employee) => (
        <p key={employee.employee_id} className="text-fg-secondary">
          {employee.name} — {employee.skipped_reason}
        </p>
      ))}
    </div>
  );
}
