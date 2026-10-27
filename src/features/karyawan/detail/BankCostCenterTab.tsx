"use client";

import { useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@mestakara/ui/badge";
import { Button } from "@mestakara/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { formatDate, formatDateTime, toDateText } from "@/lib/date";
import type { EmployeeProfileResource } from "@/types/api/employee";
import type { BankAccountResource, EmployeeCostCenterResource } from "@/types/api/wage";

import { BankAccountDialog } from "./BankAccountDialog";
import { EmptyText } from "./DetailParts";
import { EmployeeCostCenterDialog } from "./EmployeeCostCenterDialog";

interface BankCostCenterTabProps {
  employee: EmployeeProfileResource;
  /** Dipanggil setelah rekening / cost center diubah, supaya data karyawan (Biodata) ikut dimuat ulang */
  onChanged: () => void;
}

/**
 * Tab REKENING & COST CENTER di detail karyawan. Keduanya punya riwayat yang tidak pernah dihapus:
 *
 *   Rekening Bank                                              [✎ Ubah Rekening]
 *   BRI · 224501022580505 · a.n. JEJEN JAINAL  (berlaku mulai 1 Okt 2026)
 *   Berlaku Mulai | Bank | No. Rekening | Atas Nama | Keterangan | Dicatat
 *
 *   Cost Center                                                [✎ Ubah Cost Center]
 *   4A44AGR005 — Café & Resto  (berlaku mulai 1 Okt 2026)
 *   Berlaku Mulai | Kode | Uraian | Keterangan | Dicatat
 */
export function BankCostCenterTab({ employee, onChanged }: BankCostCenterTabProps) {
  const bankRequest = useApiGet<BankAccountResource[]>(`/api/employees/${employee.id}/bank-accounts`);
  const costCenterRequest = useApiGet<EmployeeCostCenterResource[]>(`/api/employees/${employee.id}/cost-centers`);
  const [openDialog, setOpenDialog] = useState<"none" | "bank" | "cost-center">("none");

  const bank = employee.bank_account ?? null;
  const costCenter = employee.cost_center ?? null;

  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Rekening Bank"
        current={
          bank
            ? `${bank.bank_name} · ${bank.account_number} · a.n. ${bank.account_holder} (berlaku mulai ${formatDate(bank.effective_date)})`
            : null
        }
        actionLabel={bank ? "Ubah Rekening" : "Isi Rekening"}
        onAction={() => setOpenDialog("bank")}
      >
        {bankRequest.loading ? (
          <PageLoading label="Memuat riwayat rekening..." />
        ) : bankRequest.error || !bankRequest.data ? (
          <PageError message={bankRequest.error ?? "Riwayat rekening gagal dimuat."} />
        ) : bankRequest.data.length === 0 ? (
          <EmptyText>Belum ada riwayat rekening.</EmptyText>
        ) : (
          <HistoryTable
            headers={["Bank", "No. Rekening", "Atas Nama"]}
            rows={bankRequest.data.map((item) => ({
              id: item.id,
              effectiveDate: item.effective_date,
              cells: [item.bank_name, item.account_number, item.account_holder],
              notes: item.notes,
              createdAt: item.created_at,
              createdBy: item.created_by,
            }))}
          />
        )}
      </Section>

      <Section
        title="Cost Center"
        current={costCenter ? `${costCenter.code} — ${costCenter.name} (berlaku mulai ${formatDate(costCenter.effective_date)})` : null}
        actionLabel={costCenter ? "Ubah Cost Center" : "Isi Cost Center"}
        onAction={() => setOpenDialog("cost-center")}
      >
        {costCenterRequest.loading ? (
          <PageLoading label="Memuat riwayat cost center..." />
        ) : costCenterRequest.error || !costCenterRequest.data ? (
          <PageError message={costCenterRequest.error ?? "Riwayat cost center gagal dimuat."} />
        ) : costCenterRequest.data.length === 0 ? (
          <EmptyText>Belum ada riwayat cost center.</EmptyText>
        ) : (
          <HistoryTable
            headers={["Kode", "Uraian"]}
            rows={costCenterRequest.data.map((item) => ({
              id: item.id,
              effectiveDate: item.effective_date,
              cells: [item.cost_center.code, item.cost_center.name],
              notes: item.notes,
              createdAt: item.created_at,
              createdBy: item.created_by,
            }))}
          />
        )}
      </Section>

      <BankAccountDialog
        open={openDialog === "bank"}
        employeeId={employee.id}
        employeeName={employee.name}
        current={bank}
        onClose={() => setOpenDialog("none")}
        onSaved={() => {
          bankRequest.reload();
          onChanged();
        }}
      />
      <EmployeeCostCenterDialog
        open={openDialog === "cost-center"}
        employeeId={employee.id}
        current={costCenter}
        onClose={() => setOpenDialog("none")}
        onSaved={() => {
          costCenterRequest.reload();
          onChanged();
        }}
      />
    </div>
  );
}

/** Judul bagian + nilai yang berlaku + tombol ubah, lalu tabel riwayatnya (children). */
function Section({
  title,
  current,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  /** Teks nilai yang berlaku; null = belum diisi */
  current: string | null;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="typo-h5 text-fg-heading">{title}</h3>
          <p className="mt-1 typo-body-m text-fg-secondary">{current ?? "Belum diisi."}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onAction}>
          <Pencil />
          {actionLabel}
        </Button>
      </div>
      {children}
    </section>
  );
}

/** Satu baris riwayat dalam bentuk yang sama untuk rekening maupun cost center. */
interface HistoryRow {
  id: string;
  effectiveDate: string;
  cells: string[];
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
}

/**
 * Tabel riwayat (terbaru di atas, sesuai urutan dari server). Catatan yang tanggal berlakunya
 * belum tiba diberi badge "Akan berlaku".
 */
function HistoryTable({ headers, rows }: { headers: string[]; rows: HistoryRow[] }) {
  const today = toDateText(new Date());

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="min-w-200">
        <TableHeader>
          <TableRow>
            <TableHead>Berlaku Mulai</TableHead>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
            <TableHead>Keterangan</TableHead>
            <TableHead>Dicatat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap">
                {formatDate(row.effectiveDate)}
                {row.effectiveDate > today && (
                  <Badge variant="info" className="ml-2">
                    Akan berlaku
                  </Badge>
                )}
              </TableCell>
              {row.cells.map((cell, index) => (
                <TableCell key={headers[index]}>{cell}</TableCell>
              ))}
              <TableCell className="whitespace-normal text-fg-secondary">{row.notes ?? "-"}</TableCell>
              <TableCell className="whitespace-nowrap typo-body-s text-fg-tertiary">
                {formatDateTime(row.createdAt)}
                {row.createdBy && <p>{row.createdBy}</p>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
