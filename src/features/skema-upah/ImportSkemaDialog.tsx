"use client";

import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Badge } from "@mestakara/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { ExcelImportDialog, formatColumnMessage } from "@/components/shared/ExcelImportDialog";
import type { WageImportPreview, WageImportRow } from "@/types/api/wage";

/** Nama bagian yang berubah, untuk kolom Keterangan. */
const CHANGE_LABELS: Record<keyof WageImportRow["changes"], string> = {
  wage_scheme: "Skema upah",
  bank_account: "Rekening bank",
  cost_center: "Cost center",
};

/** { wage_scheme: true, bank_account: false, cost_center: true } -> "Skema upah, Cost center" */
function describeChanges(changes: WageImportRow["changes"]): string {
  return (Object.keys(CHANGE_LABELS) as (keyof WageImportRow["changes"])[])
    .filter((key) => changes[key])
    .map((key) => CHANGE_LABELS[key])
    .join(", ");
}

interface ImportSkemaDialogProps {
  open: boolean;
  onClose: () => void;
  /** Dipanggil setelah data berhasil disimpan (untuk memuat ulang tabel) */
  onSaved: () => void;
}

/**
 * Dialog UNGGAH EXCEL DATA UPAH (skema upah + rekening + cost center sekaligus).
 * Alur pilih → periksa → simpan diurus ExcelImportDialog; di sini hanya tampilan pratinjaunya:
 *
 *   [12 berubah] [300 tidak berubah] [2 salah]  dari 314 baris
 *   Baris | No. Reg | Nama | Hasil | Keterangan
 *   5     | 7761    | ...  | Salah | Gaji Pokok harus lebih dari 0
 *
 * Simpan tidak bisa diklik selama masih ada baris salah. Hanya baris yang berubah yang menambah riwayat.
 */
export function ImportSkemaDialog({ open, onClose, onSaved }: ImportSkemaDialogProps) {
  return (
    <ExcelImportDialog<WageImportPreview>
      open={open}
      title="Unggah Excel Data Upah"
      description='Pakai file dari tombol "Unduh Template". Isinya diperiksa dulu sebelum disimpan; hanya data yang berubah yang menambah riwayat.'
      previewUrl="/api/wage-schemes/import/preview"
      saveUrl="/api/wage-schemes/import"
      canSave={(preview) => preview.summary.invalid === 0 && preview.summary.changed > 0}
      saveLabel={(preview) => `Simpan ${preview.summary.changed} Perubahan`}
      renderPreview={(preview) => <WagePreview preview={preview} />}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

/** Ringkasan + tabel baris yang salah (dulu) dan yang berubah. */
function WagePreview({ preview }: { preview: WageImportPreview }) {
  const rows = [
    ...preview.rows.filter((row) => row.status === "salah"),
    ...preview.rows.filter((row) => row.status === "berubah"),
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 typo-body-s">
        <Badge variant="info">{preview.summary.changed} berubah</Badge>
        <Badge variant="neutral">{preview.summary.unchanged} tidak berubah</Badge>
        <Badge variant={preview.summary.invalid > 0 ? "warning" : "neutral"}>{preview.summary.invalid} salah</Badge>
        <span className="text-fg-tertiary">dari {preview.summary.total_rows} baris</span>
      </div>

      {preview.summary.invalid > 0 && (
        <Alert variant="warning">
          <AlertDescription>
            Perbaiki baris yang salah di file Excel, lalu pilih file itu lagi. Data belum bisa disimpan selama masih ada
            baris yang salah.
          </AlertDescription>
        </Alert>
      )}

      {rows.length === 0 ? (
        <p className="typo-body-s text-fg-tertiary">Tidak ada data yang berubah.</p>
      ) : (
        <div className="max-h-96 overflow-auto rounded-lg border border-border">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Baris</TableHead>
                <TableHead>No. Registrasi</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Hasil</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.row}>
                  <TableCell className="text-fg-tertiary">{row.row}</TableCell>
                  <TableCell>{row.registration_number || "-"}</TableCell>
                  <TableCell className="font-medium text-fg-primary">{row.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "salah" ? "warning" : "info"}>{row.status === "salah" ? "Salah" : "Berubah"}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal typo-body-s">
                    {row.status === "salah" ? (
                      <ul className="text-fg-danger">
                        {row.errors.map((error) => (
                          <li key={error.column}>{formatColumnMessage(error)}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-fg-secondary">{describeChanges(row.changes)}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
