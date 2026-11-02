"use client";

import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Badge } from "@mestakara/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { ExcelImportDialog, formatColumnMessage } from "@/components/shared/ExcelImportDialog";
import { formatDate } from "@/lib/date";
import { SOURCE_LABELS, type AttendanceImportConfig, type EmployeeCategoryConfig } from "@/lib/attendance-rules";
import type { AttendanceImportPreview, AttendanceImportRow } from "@/types/api/attendance";

interface AttendanceImportDialogProps {
  /** Jenis unggahan. null = dialog tertutup. */
  config: AttendanceImportConfig | null;
  /** Kategori karyawan yang dibuka; unggahan hanya mengganti data kategori ini */
  category: EmployeeCategoryConfig;
  /** Periode "YYYY-MM" */
  period: string;
  /** Nama periode untuk judul, mis. "Oktober 2026" */
  periodLabel: string;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Dialog UNGGAH FILE ABSENSI (Daftar Hadir / Lembur Reguler / Lembur DW).
 * Alur pilih → periksa → simpan diurus ExcelImportDialog; di sini hanya tampilan pratinjaunya:
 *
 *   [12 baru] [340 diubah] [3 dihapus] [6 tetap]   [2 salah] [5 peringatan] [1 konflik]
 *   Baris | No. Reg | Nama | Hasil      | Keterangan
 *   5     | 7761    | ...  | Salah      | Tanggal 31: kode "X" tidak dikenal
 *   9     | 517     | ...  | Peringatan | K 22 hari melebihi batas 20 hari
 *   12    | 4157    | ...  | Konflik    | 5 Okt 2026: Mobile "K" → file "kosong" (tidak ditimpa)
 *
 * Simpan tidak bisa diklik selama masih ada baris salah. Peringatan & konflik tidak menghalangi.
 */
export function AttendanceImportDialog({ config, category, period, periodLabel, onClose, onSaved }: AttendanceImportDialogProps) {
  return (
    <ExcelImportDialog<AttendanceImportPreview>
      open={config !== null}
      title={`Unggah ${config?.title ?? ""} ${category.label} — ${periodLabel}`}
      // Lembur DW: unggahan juga menggantikan hasil Hitung Rekomendasi.
      description={`Pakai file dari tombol "Unduh Template". Unggahan ini MENGGANTIKAN data ${config?.title ?? ""} ${category.label} periode ini yang berasal dari Excel${config?.type === "lembur_dw" ? " dan hasil rekomendasi" : ""}; data dari aplikasi mobile & koreksi manual tidak ditimpa.`}
      previewUrl="/api/attendance-imports/preview"
      saveUrl="/api/attendance-imports"
      extraFields={{ period, type: config?.type ?? "", employee_category: category.value }}
      canSave={(preview) => preview.summary.invalid === 0 && preview.summary.total_rows > 0}
      saveLabel={() => `Simpan ${config?.title ?? ""}`}
      renderPreview={(preview) => <AttendancePreview preview={preview} />}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

/** Ringkasan + tabel baris yang perlu dilihat admin (salah dulu, lalu konflik, lalu peringatan). */
function AttendancePreview({ preview }: { preview: AttendanceImportPreview }) {
  const { summary } = preview;
  const hasConflict = (row: AttendanceImportRow) => row.conflicts.length > 0;
  const rows = [
    ...preview.rows.filter((row) => row.status === "salah"),
    ...preview.rows.filter((row) => row.status !== "salah" && hasConflict(row)),
    ...preview.rows.filter((row) => row.status === "peringatan" && !hasConflict(row)),
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 typo-body-s">
        <Badge variant="info">{summary.will_create} baru</Badge>
        <Badge variant="info">{summary.will_update} diubah</Badge>
        <Badge variant="neutral">{summary.will_delete} dihapus</Badge>
        <Badge variant="neutral">{summary.unchanged} tetap</Badge>
        <span className="text-fg-tertiary">·</span>
        <Badge variant={summary.invalid > 0 ? "warning" : "neutral"}>{summary.invalid} salah</Badge>
        <Badge variant={summary.warnings > 0 ? "warning" : "neutral"}>{summary.warnings} peringatan</Badge>
        <Badge variant={summary.conflicts > 0 ? "warning" : "neutral"}>{summary.conflicts} konflik</Badge>
        <span className="text-fg-tertiary">dari {summary.total_rows} baris</span>
      </div>

      {summary.invalid > 0 && (
        <Alert variant="warning">
          <AlertDescription>
            Perbaiki baris yang salah di file Excel, lalu pilih file itu lagi. Data belum bisa disimpan selama masih ada
            baris yang salah.
          </AlertDescription>
        </Alert>
      )}
      {summary.conflicts > 0 && (
        <Alert variant="info">
          <AlertDescription>
            Tanggal yang berkonflik sudah terisi dari aplikasi mobile atau koreksi manual. Isinya TIDAK diganti oleh file
            ini; ubah lewat koreksi manual kalau memang perlu.
          </AlertDescription>
        </Alert>
      )}

      {rows.length === 0 ? (
        <p className="typo-body-s text-fg-tertiary">Semua baris benar, tanpa peringatan atau konflik.</p>
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
                    <RowStatusBadge row={row} />
                  </TableCell>
                  <TableCell className="whitespace-normal typo-body-s">
                    <ul className="flex flex-col gap-0.5">
                      {row.errors.map((error) => (
                        <li key={`e-${error.column}`} className="text-fg-danger">
                          {formatColumnMessage(error)}
                        </li>
                      ))}
                      {row.warnings.map((warning) => (
                        <li key={`w-${warning.column}`} className="text-fg-warning">
                          {formatColumnMessage(warning)}
                        </li>
                      ))}
                      {row.conflicts.map((conflict) => (
                        <li key={`c-${conflict.date}`} className="text-fg-secondary">
                          {formatDate(conflict.date)}: {SOURCE_LABELS[conflict.current_source]} &quot;
                          {conflict.current_code ?? "kosong"}&quot; → file &quot;{conflict.file_code ?? "kosong"}&quot; (tidak
                          ditimpa)
                        </li>
                      ))}
                    </ul>
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

/** Badge hasil satu baris: Salah / Konflik / Peringatan / Benar. */
function RowStatusBadge({ row }: { row: AttendanceImportRow }) {
  if (row.status === "salah") return <Badge variant="warning">Salah</Badge>;
  if (row.conflicts.length > 0) return <Badge variant="info">Konflik</Badge>;
  if (row.status === "peringatan") return <Badge variant="warning">Peringatan</Badge>;
  return <Badge variant="success">Benar</Badge>;
}
