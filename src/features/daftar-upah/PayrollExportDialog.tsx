"use client";

import { useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Checkbox } from "@mestakara/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mestakara/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@mestakara/ui/field";
import { RadioGroup, RadioGroupItem } from "@mestakara/ui/radio-group";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";
import { Switch } from "@mestakara/ui/switch";

import { FieldNote } from "@/components/shared/FieldNote";
import { DateField } from "@/components/shared/FormFields";
import { EMPLOYEE_CATEGORIES } from "@/lib/attendance-rules";
import { ApiError, apiDownload } from "@/lib/http-client";
import {
  defaultSignDate,
  EXPORT_FORMATS,
  findPayrollDocument,
  firstSignDate,
  groupByLabel,
  PAYROLL_DOCUMENTS,
  rowInDocument,
  type ExportFormat,
  type PayrollDocument,
} from "@/lib/payroll-rules";
import type { EmployeeCategory } from "@/types/api/attendance";
import type { PayrollGroup, PayrollGroupBy, PayrollRow } from "@/types/api/payroll";

interface PayrollExportDialogProps {
  /** Jenis dokumen yang terpilih saat dialog dibuka. null = dialog tertutup. */
  initialDocument: PayrollDocument | null;
  period: string;
  periodLabel: string;
  /** Pengelompokan yang sedang dipilih di halaman (ekspor mengikutinya) */
  groupBy: PayrollGroupBy;
  groups: PayrollGroup[];
  /** Semua karyawan di Daftar Upah (untuk menghitung jumlah karyawan per kelompok) */
  rows: PayrollRow[];
  /** true = periode masih draf (DRAF bisa dinyalakan/dimatikan); false = dikunci (tidak pernah DRAF) */
  isDraft: boolean;
  /** Waktu kunci (ISO); dasar tanggal tanda tangan bawaan. null = belum dikunci */
  lockedAt: string | null;
  /** Karyawan yang dicentang di halaman (khusus SPKL: hanya mereka); kosong = semua */
  selectedEmployeeIds: string[];
  onClose: () => void;
}

/**
 * Dialog EKSPOR dokumen Daftar Upah:
 *
 *   Kategori       (•) Karyawan Casual   ( ) Karyawan Daily Worker
 *   Jenis dokumen  (•) Daftar Upah  ( ) Payroll  ( ) SPKL Lembur Reguler + DW  ( ) SPKL Lembur Reguler  ( ) SPKL Lembur DW
 *                  (Daily Worker: tanpa SPKL Lembur Reguler + DW & SPKL Lembur DW)
 *   Kelompok       [✓] Pilih semua (6)
 *                  [✓] Gunung Mas · 120 karyawan     (kelompok tanpa karyawan untuk pilihan ini tidak bisa dicentang)
 *   Format         (•) Excel  ( ) PDF
 *   ── Pengaturan Dokumen ──
 *   Tanggal Tanda Tangan [1 November 2026 📅] [↺ Bawaan]   (paling awal tanggal 1 bulan periode)
 *   Tulisan DRAF         [● ON]                            (hanya kalau periode belum dikunci)
 *                                                [Batal] [⬇ Unduh]
 *
 * Setiap file berisi REKAP kelompok terpilih lalu rincian per karyawan per kelompok. Susunan file dibuat backend;
 * penanda tangan dari menu Penanda Tangan.
 */
export function PayrollExportDialog(props: PayrollExportDialogProps) {
  if (!props.initialDocument) return null;
  return <ExportDialogContent key={props.initialDocument} {...props} initialDocument={props.initialDocument} />;
}

function ExportDialogContent({
  initialDocument,
  period,
  periodLabel,
  groupBy,
  groups,
  rows,
  isDraft,
  lockedAt,
  selectedEmployeeIds,
  onClose,
}: PayrollExportDialogProps & { initialDocument: PayrollDocument }) {
  const [category, setCategory] = useState<EmployeeCategory>("casual");
  const [document, setDocument] = useState<PayrollDocument>(initialDocument);
  /** Kelompok yang dicentang; bawaan semua */
  const [checkedKeys, setCheckedKeys] = useState<string[]>(() => groups.map((group) => group.key));
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  // Pengaturan dokumen: kembali ke bawaan setiap kali dialog dibuka.
  const initialSignDate = defaultSignDate(lockedAt);
  const [signDate, setSignDate] = useState(initialSignDate);
  /** Tulisan DRAF; hanya bisa dipilih selama periode belum dikunci */
  const [showDraft, setShowDraft] = useState(isDraft);
  const minSignDate = firstSignDate(period);
  const signDateError = !signDate
    ? "Tanggal tanda tangan wajib diisi"
    : signDate < minSignDate
      ? "Tanggal tanda tangan paling awal tanggal 1 bulan periode"
      : undefined;
  const withDraft = isDraft && showDraft;
  const [downloading, setDownloading] = useState(false);

  const categoryInfo = EMPLOYEE_CATEGORIES.find((item) => item.value === category) ?? EMPLOYEE_CATEGORIES[0];
  const documentInfo = findPayrollDocument(document);
  // SPKL + ada centang di halaman = hanya karyawan yang dicentang.
  const onlySelected = documentInfo.isSpkl && selectedEmployeeIds.length > 0;

  // Karyawan yang ikut file: kategori ini, punya isi untuk dokumen ini, (SPKL) dicentang.
  const includedRows = rows.filter(
    (row) =>
      row.employment_status === categoryInfo.employmentStatus &&
      rowInDocument(row, document) &&
      (!onlySelected || selectedEmployeeIds.includes(row.employee_id)),
  );
  const countOf = (key: string) => includedRows.filter((row) => row.group_key === key).length;
  const availableKeys = groups.filter((group) => countOf(group.key) > 0).map((group) => group.key);
  const chosenKeys = availableKeys.filter((key) => checkedKeys.includes(key));
  const isAllChosen = availableKeys.length > 0 && chosenKeys.length === availableKeys.length;
  const employeeCount = includedRows.filter((row) => chosenKeys.includes(row.group_key)).length;

  /** Ganti kategori: Daily Worker tidak punya Lembur DW, jadi SPKL yang memuat DW diganti SPKL Lembur Reguler. */
  function changeCategory(value: EmployeeCategory) {
    setCategory(value);
    if (value !== "casual" && documentInfo.casualOnly) setDocument("spkl_reguler");
  }

  function toggleGroup(key: string) {
    setCheckedKeys((previous) => (previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key]));
  }

  async function download() {
    setDownloading(true);
    try {
      const query = new URLSearchParams({
        period,
        group_by: groupBy,
        employee_category: category,
        document,
        format,
        sign_date: signDate,
        show_draft: withDraft ? "1" : "0",
      });
      // Semua kelompok dicentang = tidak dikirim (backend memakai semua kelompok).
      if (!isAllChosen) query.set("group_keys", chosenKeys.join(","));
      if (onlySelected) query.set("employee_ids", selectedEmployeeIds.join(","));

      const fileName = await apiDownload(`/api/payroll/export?${query}`, fallbackFileName());
      toast.success(`${documentInfo.label} berhasil diunduh`, { description: fileName });
      onClose();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
      toast.error("File gagal diunduh", { description: message });
    } finally {
      setDownloading(false);
    }
  }

  /** Nama file CADANGAN (kalau backend tidak mengirim nama), formatnya sama dengan backend. */
  function fallbackFileName(): string {
    const title = document === "payroll" ? "Payroll" : documentInfo.label;
    const groupPart =
      chosenKeys.length === 1 ? groups.find((group) => group.key === chosenKeys[0])?.name : `${chosenKeys.length} Kelompok`;
    return `${title} ${categoryInfo.label} - ${groupPart} - ${periodLabel}${withDraft ? " (DRAF)" : ""}.${format}`;
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && !downloading && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ekspor Dokumen — {periodLabel}</DialogTitle>
          <DialogDescription>
            Setiap file berisi rekap kelompok yang dipilih, lalu rincian per karyawan per kelompok.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <ChoiceField
            id="export-category"
            label="Kategori"
            options={EMPLOYEE_CATEGORIES.map((item) => ({ value: item.value, label: item.label }))}
            value={category}
            onChange={(value) => changeCategory(value as EmployeeCategory)}
            disabled={downloading}
          />

          <ChoiceField
            id="export-document"
            label="Jenis Dokumen"
            // Daily Worker tidak punya Lembur DW.
            options={PAYROLL_DOCUMENTS.filter((item) => category === "casual" || !item.casualOnly)}
            value={document}
            onChange={(value) => setDocument(value as PayrollDocument)}
            disabled={downloading}
            vertical
            note={
              onlySelected
                ? `SPKL hanya untuk ${selectedEmployeeIds.length} karyawan yang dicentang di halaman.`
                : category === "casual"
                  ? "SPKL hanya berisi karyawan yang punya lembur jenis itu."
                  : "Karyawan Daily Worker hanya punya Lembur Reguler, jadi SPKL yang tersedia hanya SPKL Lembur Reguler."
            }
          />

          <FieldSet>
            <FieldLegend variant="label">Kelompok ({groupByLabel(groupBy)})</FieldLegend>
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <label className="flex cursor-pointer items-center gap-2 border-b border-border pb-2 typo-label-m">
                <Checkbox
                  checked={isAllChosen}
                  onCheckedChange={(checked) => setCheckedKeys(checked ? groups.map((group) => group.key) : [])}
                  disabled={downloading || availableKeys.length === 0}
                />
                Pilih semua ({availableKeys.length})
              </label>
              {groups.map((group) => {
                const count = countOf(group.key);
                return (
                  <label
                    key={group.key}
                    className="flex cursor-pointer items-center gap-2 typo-body-s has-disabled:cursor-not-allowed has-disabled:text-fg-disabled"
                  >
                    <Checkbox
                      checked={count > 0 && checkedKeys.includes(group.key)}
                      onCheckedChange={() => toggleGroup(group.key)}
                      disabled={downloading || count === 0}
                    />
                    <span className="min-w-0 flex-1 truncate">{group.name}</span>
                    <span className="shrink-0 text-fg-tertiary">{count} karyawan</span>
                  </label>
                );
              })}
            </div>
            <FieldNote>
              {availableKeys.length === 0
                ? `tidak ada ${categoryInfo.label} untuk ${documentInfo.label} pada periode ini.`
                : chosenKeys.length === 0
                  ? "pilih minimal satu kelompok."
                  : `${employeeCount} karyawan dari ${chosenKeys.length} kelompok akan diekspor. Ubah pengelompokan lewat "Kelompokkan berdasarkan" di halaman.`}
            </FieldNote>
          </FieldSet>

          <ChoiceField
            id="export-format"
            label="Format"
            options={EXPORT_FORMATS}
            value={format}
            onChange={(value) => setFormat(value as ExportFormat)}
            disabled={downloading}
          />

          <FieldSet>
            <FieldLegend>Pengaturan Dokumen</FieldLegend>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <DateField
                  id="export-sign-date"
                  label="Tanggal Tanda Tangan"
                  value={signDate}
                  onChange={setSignDate}
                  minDate={minSignDate}
                  fromYear={Number(period.slice(0, 4))}
                  error={signDateError}
                  disabled={downloading}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSignDate(initialSignDate)}
                disabled={downloading || signDate === initialSignDate}
                className={signDateError ? "mb-6" : undefined}
              >
                <RotateCcw />
                Bawaan
              </Button>
            </div>
            <FieldNote>
              dipakai di semua blok tanda tangan (rekap &amp; setiap kelompok). Bawaannya{" "}
              {lockedAt ? "tanggal periode dikunci" : "hari ini"}; paling awal tanggal 1 bulan periode.
            </FieldNote>

            {isDraft ? (
              <Field orientation="horizontal">
                <Switch id="export-show-draft" checked={showDraft} onCheckedChange={setShowDraft} disabled={downloading} />
                <FieldLabel htmlFor="export-show-draft">Tampilkan tulisan DRAF di dokumen &amp; nama file</FieldLabel>
              </Field>
            ) : (
              <p className="typo-body-s text-fg-secondary">Periode sudah dikunci, jadi dokumen tanpa tulisan DRAF.</p>
            )}
            {isDraft && (
              <FieldNote>periode belum dikunci; matikan untuk mencetak versi tanpa tulisan DRAF.</FieldNote>
            )}
          </FieldSet>
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={downloading}>
            Batal
          </Button>
          <Button type="button" onClick={download} disabled={downloading || chosenKeys.length === 0 || Boolean(signDateError)}>
            {downloading ? <Spinner /> : <Download />}
            {downloading ? "Mengunduh..." : "Unduh"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Pilihan tunggal berbentuk tombol radio (selalu ada yang terpilih). */
function ChoiceField({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
  vertical = false,
  note,
}: {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  /** true = pilihan bertumpuk ke bawah (untuk label panjang) */
  vertical?: boolean;
  note?: string;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        aria-label={label}
        className={vertical ? "flex flex-col gap-2" : "flex flex-wrap gap-x-6 gap-y-2"}
      >
        {options.map((option) => (
          <label key={option.value} htmlFor={`${id}-${option.value}`} className="flex cursor-pointer items-center gap-2 typo-body-m">
            <RadioGroupItem id={`${id}-${option.value}`} value={option.value} />
            {option.label}
          </label>
        ))}
      </RadioGroup>
      {note && <FieldNote>{note}</FieldNote>}
    </Field>
  );
}
