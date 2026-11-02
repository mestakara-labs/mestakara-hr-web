"use client";

import { useState } from "react";
import { Badge } from "@mestakara/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@mestakara/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";
import { cn } from "cn";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import {
  findAttendanceCode,
  formatMinutes,
  SOURCE_LABELS,
  type AttendanceCodeInfo,
  type EmployeeCategoryConfig,
} from "@/lib/attendance-rules";
import { formatDate, formatDateTime, isoWeekday } from "@/lib/date";
import type {
  AttendanceChangeDetail,
  AttendanceDayDetail,
  AttendanceSummaryRow,
  EmployeeAttendanceDetail,
} from "@/types/api/attendance";

import { AttendanceCorrectionDialog, type CorrectionTarget } from "./AttendanceCorrectionDialog";

interface AttendanceDetailSheetProps {
  /** Karyawan yang dilihat. null = panel tertutup. */
  target: AttendanceSummaryRow | null;
  /** Kategori karyawan (kode yang boleh dipakai & ada tidaknya lembur) */
  category: EmployeeCategoryConfig;
  /** Periode "YYYY-MM" dan namanya */
  period: string;
  periodLabel: string;
  /** true = periode dikunci; tanggal tidak bisa dikoreksi */
  locked: boolean;
  onClose: () => void;
  /** Dipanggil setelah koreksi (supaya rekap ikut dimuat ulang) */
  onChanged: () => void;
}

/**
 * Panel samping DETAIL ABSENSI satu karyawan pada satu periode:
 *
 *   Sen  Sel  Rab  Kam  Jum  Sab  Min
 *                  [1 K][2 K][3 L][4 -]       kotak abu-abu = belum/tidak aktif
 *   [5 K][6 S✎][7 K•] ...                     ✎ = koreksi manual, • = dari aplikasi mobile
 *   (klik tanggal = Koreksi Absensi)
 *
 *   Lembur: Tanggal | Jenis | Jam | Durasi | Uraian | Sumber
 *   Jejak perubahan: 6 Okt · K → S · Manual · "Surat dokter" · Admin SDM   (lihat describeChange)
 */
export function AttendanceDetailSheet({
  target,
  category,
  period,
  periodLabel,
  locked,
  onClose,
  onChanged,
}: AttendanceDetailSheetProps) {
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {target && (
          <>
            <SheetHeader>
              <SheetTitle>Absensi {target.name}</SheetTitle>
              <SheetDescription>
                {target.registration_number ?? "tanpa No. Registrasi"} · {target.sub_unit?.name ?? "-"} · {periodLabel}
              </SheetDescription>
            </SheetHeader>

            {/* `key` = data diambil ulang setiap kali panel dibuka untuk karyawan / periode lain. */}
            <DetailContent
              key={`${target.id}-${period}`}
              target={target}
              category={category}
              period={period}
              locked={locked}
              onChanged={onChanged}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailContent({
  target,
  category,
  period,
  locked,
  onChanged,
}: {
  target: AttendanceSummaryRow;
  category: EmployeeCategoryConfig;
  period: string;
  locked: boolean;
  onChanged: () => void;
}) {
  const { data, loading, error, reload } = useApiGet<EmployeeAttendanceDetail>(
    `/api/employees/${target.id}/attendance?period=${period}`,
  );
  const [correction, setCorrection] = useState<CorrectionTarget | null>(null);

  if (loading) return <PageLoading label="Memuat absensi..." />;
  if (error || !data) return <PageError message={error ?? "Absensi gagal dimuat."} />;

  /** Klik satu tanggal -> koreksi (kalau karyawan aktif dan periode belum dikunci). */
  function openCorrection(day: AttendanceDayDetail) {
    if (!day.is_active || locked) return;
    setCorrection({ employeeId: target.id, employeeName: target.name, day });
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-6">
      <section className="flex flex-col gap-3">
        <AttendanceCalendar days={data.days} locked={locked} onSelect={openCorrection} />
        <Legend codes={category.codes} />
        <p className="typo-body-s text-fg-tertiary">
          {locked
            ? "Periode sudah dikunci; absensi tidak bisa dikoreksi."
            : "Klik tanggal untuk mengoreksi kodenya (alasan wajib). Koreksi manual tidak tertimpa unggahan Excel maupun aplikasi mobile."}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="typo-label-m text-fg-heading">Lembur ({data.overtime.length})</h3>
        {data.overtime.length === 0 ? (
          <p className="typo-body-s text-fg-tertiary">Tidak ada lembur pada periode ini.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-160">
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Uraian</TableHead>
                  <TableHead>Sumber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.overtime.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(item.date)}</TableCell>
                    <TableCell>{item.overtime_type === "dw" ? "DW" : "Reguler"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.start_time}–{item.end_time}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatMinutes(item.duration_minutes)}</TableCell>
                    <TableCell className="whitespace-normal">{item.description}</TableCell>
                    <TableCell>{SOURCE_LABELS[item.source]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="typo-label-m text-fg-heading">Jejak Perubahan ({data.changes.length})</h3>
        {data.changes.length === 0 ? (
          <p className="typo-body-s text-fg-tertiary">Belum ada perubahan.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {data.changes.map((change) => (
              <li key={change.id} className="rounded-lg border border-border p-3 typo-body-s">
                <p className="text-fg-primary">
                  <span className="font-medium">{formatDate(change.date)}</span> · {describeChange(change)} ·{" "}
                  <Badge variant="neutral" dot={false}>{SOURCE_LABELS[change.source]}</Badge>
                </p>
                {change.reason && <p className="text-fg-secondary">&quot;{change.reason}&quot;</p>}
                <p className="text-fg-tertiary">
                  {formatDateTime(change.created_at)}
                  {change.changed_by && ` · ${change.changed_by}`}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <AttendanceCorrectionDialog
        target={correction}
        codes={category.codes}
        onClose={() => setCorrection(null)}
        onSaved={() => {
          reload();
          onChanged();
        }}
      />
    </div>
  );
}

/**
 * Kalimat satu perubahan: perubahan kode ditulis "K → S" (kosong = "kosong"),
 * selain itu nama kejadiannya, mis. "Konflik".
 */
function describeChange(change: AttendanceChangeDetail): string {
  const code = change.items.find((item) => item.field === "status_code");
  return code ? `${code.old_value ?? "kosong"} → ${code.new_value ?? "kosong"}` : change.action;
}

/** Nama hari kolom kalender, mulai Senin. */
const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Kalender satu bulan: satu kotak per tanggal berisi kode, warna menurut kode. */
function AttendanceCalendar({
  days,
  locked,
  onSelect,
}: {
  days: AttendanceDayDetail[];
  locked: boolean;
  onSelect: (day: AttendanceDayDetail) => void;
}) {
  // Kotak kosong sebelum tanggal 1, supaya tanggal 1 jatuh di kolom harinya (Senin = kolom pertama).
  const leadingBlanks = days.length > 0 ? isoWeekday(days[0].date) - 1 : 0;

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAYS.map((name) => (
        <div key={name} className="text-center typo-body-s text-fg-tertiary">
          {name}
        </div>
      ))}
      {Array.from({ length: leadingBlanks }, (_, index) => (
        <div key={`blank-${index}`} />
      ))}
      {days.map((day) => {
        const code = findAttendanceCode(day.status_code);
        const canEdit = day.is_active && !locked;

        return (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelect(day)}
            disabled={!canEdit}
            title={day.is_active ? `${formatDate(day.date)}: ${code?.label ?? "kosong (tidak masuk)"}` : "Karyawan tidak aktif"}
            className={cn(
              "flex h-14 flex-col items-center justify-center rounded-md border border-border typo-body-s",
              !day.is_active && "bg-muted text-fg-tertiary opacity-60",
              day.is_active && (code?.className ?? "bg-surface text-fg-tertiary"),
              canEdit && "cursor-pointer hover:ring-2 hover:ring-border",
            )}
          >
            <span className="text-xs opacity-70">{Number(day.date.slice(8))}</span>
            <span className="font-medium">
              {day.is_active ? (day.status_code ?? "-") : ""}
              {day.source === "manual" && " ✎"}
              {day.source === "mobile" && " •"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Keterangan kode & tanda sumber di bawah kalender. */
function Legend({ codes }: { codes: AttendanceCodeInfo[] }) {
  return (
    <div className="flex flex-wrap gap-2 typo-body-s text-fg-secondary">
      {codes.map(({ code, label, className }) => (
        <span key={code} className={cn("rounded px-1.5 py-0.5", className)}>
          {code} {label}
        </span>
      ))}
      <span>- kosong (tidak masuk)</span>
      <span>✎ koreksi manual</span>
      <span>• aplikasi mobile</span>
    </div>
  );
}
