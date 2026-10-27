"use client";

import { useState } from "react";
import { CircleHelp, Lock, RefreshCw, Send, Trash2, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { toast } from "@mestakara/ui/sonner";

import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { formatDateTime } from "@/lib/date";
import { ApiError, apiDelete, apiPost } from "@/lib/http-client";
import { formatMonth, isPeriodEditable, SCHEDULE_PERIOD_STATUS } from "@/lib/schedule-period-rules";
import type { HolidayResource } from "@/types/api/holiday";
import type { ScheduleEntryResource, SchedulePeriodDetailResource } from "@/types/api/schedule";
import type { ShiftResource } from "@/types/api/shift";

import { EditScheduleDialog } from "./EditScheduleDialog";
import { PeriodStatusBadge } from "./PeriodStatusBadge";
import { RegenerateDialog } from "./RegenerateDialog";
import { ScheduleGrid } from "./ScheduleGrid";
import { rowsFromEntries, vacancyLabels } from "./schedule-grid-rows";

interface SchedulePeriodPanelProps {
  periodId: string;
  shifts: ShiftResource[];
  holidays: HolidayResource[];
  /** Dipanggil setelah periode dihapus (kembali ke tampilan proyeksi) */
  onDeleted: () => void;
}

/** Aksi yang sedang meminta konfirmasi. */
type PendingAction = "none" | "publish" | "lock" | "delete" | "regenerate";

/**
 * JADWAL RESMI satu regu satu bulan (Draf / Terbit / Terkunci):
 *
 *   [Terbit]  Dibuat 20 Sep 2026 oleh Sistem · Diterbitkan 25 Sep oleh Admin SDM   [Buat Ulang…] [Kunci]
 *   4 karyawan · 1 ubahan manual · 0 hari shift kosong
 *   ScheduleGrid (klik sel untuk mengubah; titik kuning = ubahan manual)
 */
export function SchedulePeriodPanel({ periodId, shifts, holidays, onDeleted }: SchedulePeriodPanelProps) {
  const { data: period, loading, error, reload } = useApiGet<SchedulePeriodDetailResource>(
    `/api/schedule-periods/${periodId}`,
  );
  const [editing, setEditing] = useState<ScheduleEntryResource | null>(null);
  const [pending, setPending] = useState<PendingAction>("none");
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoading label="Memuat jadwal..." />;
  if (error || !period) return <PageError message={error ?? "Jadwal tidak ditemukan."} />;

  const editable = isPeriodEditable(period.status);
  const rows = rowsFromEntries(period.dates, period.entries, editable ? setEditing : undefined);

  /** Jalankan aksi status (terbitkan / kunci / hapus) setelah dikonfirmasi. */
  async function runAction(action: PendingAction) {
    if (!period) return;
    setBusy(true);
    try {
      if (action === "delete") {
        const response = await apiDelete(`/api/schedule-periods/${period.id}`);
        toast.success(response.message);
        onDeleted();
        return;
      }
      const response = await apiPost(`/api/schedule-periods/${period.id}/${action}`, {});
      toast.success(response.message);
      reload();
    } catch (actionError) {
      toast.error(actionError instanceof ApiError ? actionError.message : "Aksi gagal dijalankan.");
    } finally {
      setBusy(false);
      setPending("none");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <PeriodStatusBadge status={period.status} />
            <span className="typo-label-m text-fg-heading">
              Jadwal {period.group.name} · {formatMonth(period.month)}
            </span>
          </div>
          <p className="typo-body-s text-fg-tertiary">
            Dibuat {formatDateTime(period.generated_at)} oleh {period.generated_by}
            {period.published_at && ` · Diterbitkan ${formatDateTime(period.published_at)} oleh ${period.published_by}`}
            {period.locked_at && ` · Dikunci ${formatDateTime(period.locked_at)} oleh ${period.locked_by}`}
          </p>
          <p className="typo-body-s text-fg-secondary">
            {rows.length} karyawan · {period.manual_count} ubahan manual ·{" "}
            <span className={period.vacancy_days > 0 ? "text-fg-danger" : undefined}>
              {period.vacancy_days} hari ada shift kosong
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button variant="outline" onClick={() => setPending("regenerate")} disabled={busy}>
              <RefreshCw />
              Buat Ulang dari Tanggal…
            </Button>
          )}
          {period.status === SCHEDULE_PERIOD_STATUS.draft && (
            <>
              <Button variant="outline" onClick={() => setPending("delete")} disabled={busy}>
                <Trash2 />
                Hapus Draf
              </Button>
              <Button onClick={() => setPending("publish")} disabled={busy}>
                <Send />
                Terbitkan
              </Button>
            </>
          )}
          {period.status === SCHEDULE_PERIOD_STATUS.published && (
            <Button variant="outline" onClick={() => setPending("lock")} disabled={busy}>
              <Lock />
              Kunci
            </Button>
          )}
        </div>
      </div>

      {period.outdated_count > 0 && (
        <Alert variant="warning">
          <TriangleAlert />
          <AlertDescription>
            <p>
              Anggota atau pola regu berubah setelah jadwal ini dibuat: <strong>{period.outdated_count} sel</strong>{" "}
              tidak sesuai lagi. Klik <strong>Buat Ulang dari Tanggal…</strong> untuk menyesuaikannya.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <ScheduleGrid
        dates={period.dates}
        rows={rows}
        shifts={shifts}
        holidays={holidays}
        vacanciesByDate={vacancyLabels(period.vacancies, shifts)}
      />
      <p className="text-xs text-fg-tertiary">
        Catatan:{" "}
        {editable
          ? "klik sel untuk mengubah jadwal; titik kuning = sudah diubah manual (berbeda dari pola)."
          : "jadwal sudah dikunci dan tidak bisa diubah."}{" "}
        Huruf kecil = slot rotasi hari itu.
      </p>

      <EditScheduleDialog
        entry={editing}
        periodStatus={period.status}
        shifts={shifts}
        onClose={() => setEditing(null)}
        onSaved={reload}
      />
      <RegenerateDialog
        period={pending === "regenerate" ? period : null}
        shifts={shifts}
        onClose={() => setPending("none")}
        onDone={reload}
      />
      <ConfirmDialog
        open={pending === "publish"}
        icon={CircleHelp}
        tone="info"
        title="Terbitkan jadwal?"
        description={
          <p>
            Jadwal {formatMonth(period.month)} akan terlihat oleh karyawan. Setelah terbit, setiap perubahan wajib
            disertai alasan.
            {period.vacancy_days > 0 && ` Masih ada ${period.vacancy_days} hari dengan shift kosong.`}
          </p>
        }
        cancelLabel="Batal"
        confirmLabel="Ya, Terbitkan"
        onCancel={() => setPending("none")}
        onConfirm={() => runAction("publish")}
      />
      <ConfirmDialog
        open={pending === "lock"}
        icon={Lock}
        tone="warning"
        title="Kunci jadwal?"
        description={
          <p>
            Kunci jadwal setelah rekap absensi {formatMonth(period.month)} selesai. Jadwal yang dikunci tidak bisa
            diubah lagi.
          </p>
        }
        cancelLabel="Batal"
        confirmLabel="Ya, Kunci"
        onCancel={() => setPending("none")}
        onConfirm={() => runAction("lock")}
      />
      <ConfirmDeleteDialog
        open={pending === "delete"}
        title={`Hapus draf jadwal ${formatMonth(period.month)}?`}
        description="Semua ubahan manual di draf ini ikut terhapus. Jadwal bisa dibuat ulang dari pola."
        deleting={busy}
        onConfirm={() => runAction("delete")}
        onCancel={() => setPending("none")}
      />
    </div>
  );
}
