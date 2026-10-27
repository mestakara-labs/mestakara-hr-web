"use client";

import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@mestakara/ui/sheet";
import { cn } from "cn";

import { WAGE_TYPE, formatRupiah } from "@/lib/wage-rules";
import type { PayrollRow } from "@/types/api/payroll";

interface PayrollDetailSheetProps {
  /** Karyawan yang dilihat. null = panel tertutup. */
  target: PayrollRow | null;
  periodLabel: string;
  onClose: () => void;
}

/**
 * Panel samping RINCIAN UPAH satu karyawan: perhitungan langkah demi langkah, mis.
 *
 *   Gaji Upah       min(22 K, batas 20) × Rp 95.000          Rp 1.900.000
 *   Lembur Reguler                                            Rp    75.500
 *   ...
 *   Jumlah Upah & Tunjangan                                   Rp 2.116.300
 *   Potongan BPJS TK/KES                                     −Rp    50.000
 *   Upah Diterima                                             Rp 2.116.300
 */
export function PayrollDetailSheet({ target, periodLabel, onClose }: PayrollDetailSheetProps) {
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {target && (
          <>
            <SheetHeader>
              <SheetTitle>Rincian Upah {target.name}</SheetTitle>
              <SheetDescription>
                {target.registration_number ?? "tanpa No. Registrasi"} · {target.position ?? "-"} · {periodLabel}
              </SheetDescription>
            </SheetHeader>
            <DetailContent row={target} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Rumus Gaji Upah dalam kalimat, sesuai jenis upahnya. */
function basePayFormula(row: PayrollRow): string {
  if (row.wage_type === null) return "skema upah belum diatur";
  if (row.wage_type === WAGE_TYPE.flat) {
    return row.active_days < row.calendar_days
      ? `${formatRupiah(row.base_salary)} × ${row.active_days}/${row.calendar_days} hari aktif`
      : "Gaji Pokok penuh";
  }
  const paidDays = row.cap_days === null ? row.present_days : Math.min(row.present_days, row.cap_days);
  const capText = row.cap_days !== null && row.present_days > row.cap_days ? ` (K ${row.present_days}, batas ${row.cap_days})` : "";
  return `${paidDays} hari × ${formatRupiah(row.daily_rate)}${capText}`;
}

function DetailContent({ row }: { row: PayrollRow }) {
  return (
    <div className="flex flex-col gap-5 px-4 pb-6">
      {row.warnings.length > 0 && (
        <Alert variant="warning">
          <AlertDescription>
            {row.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1.5 typo-body-s">
        <InfoRow label="Jenis Upah">{row.wage_type ?? "Belum diatur"}</InfoRow>
        <InfoRow label="Gaji Pokok">
          {formatRupiah(row.base_salary)} · HKE {row.hke} · {formatRupiah(row.daily_rate)}/hari
        </InfoRow>
        <InfoRow label="Absen">
          {row.present_days} K · aktif {row.active_days} dari {row.calendar_days} hari
        </InfoRow>
        <InfoRow label="Kelompok">{row.payroll_group?.name ?? "Tanpa Kelompok"}</InfoRow>
        <InfoRow label="Bidang">{row.division?.name ?? "Tanpa Bidang"}</InfoRow>
        <InfoRow label="Cost Center">{row.cost_center ? `${row.cost_center.code} · ${row.cost_center.name}` : "Belum ada"}</InfoRow>
        <InfoRow label="Rekening">
          {row.bank_account
            ? `${row.bank_account.bank_name} ${row.bank_account.account_number} a.n. ${row.bank_account.account_name}`
            : "Belum ada"}
        </InfoRow>
      </dl>

      <div className="flex flex-col rounded-lg border border-border typo-body-s">
        <MoneyLine label="Gaji Upah" note={basePayFormula(row)} amount={row.base_pay} />
        <MoneyLine label="Lembur Reguler" amount={row.regular_overtime_pay} />
        <MoneyLine label="Lembur DW" amount={row.dw_overtime_pay} />
        <MoneyLine label="Tunj. Operasional & Jabatan" amount={row.operational_allowance} />
        <MoneyLine label="Insentif" amount={row.incentive} />
        <MoneyLine label="Uang Makan" note={`${row.present_days} hari K`} amount={row.meal_allowance} />
        <MoneyLine label="Jumlah Upah & Tunjangan" amount={row.gross} strong />
        <MoneyLine label="Potongan BPJS TK/KES" amount={row.deductions.bpjs} deduction />
        <MoneyLine label="Potongan PPIP/PPh 21" amount={row.deductions.pph21} deduction />
        <MoneyLine label="Potongan Kebun/Unit" amount={row.deductions.unit} deduction />
        <MoneyLine label="Upah Diterima" amount={row.net} strong />
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-fg-tertiary">{label}</dt>
      <dd className="text-fg-primary">{children}</dd>
    </>
  );
}

/** Satu baris uang: label (+ rumus kecil) di kiri, jumlah di kanan. Potongan di atas 0 ditulis "−Rp ...". */
function MoneyLine({
  label,
  note,
  amount,
  strong = false,
  deduction = false,
}: {
  label: string;
  note?: string;
  amount: number;
  strong?: boolean;
  /** true = potongan (mengurangi) */
  deduction?: boolean;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-3 py-2", strong && "bg-subtle font-medium text-fg-heading")}>
      <div>
        <p>{label}</p>
        {note && <p className="text-fg-tertiary">{note}</p>}
      </div>
      <p className="whitespace-nowrap">{deduction && amount > 0 ? `−${formatRupiah(amount)}` : formatRupiah(amount)}</p>
    </div>
  );
}
