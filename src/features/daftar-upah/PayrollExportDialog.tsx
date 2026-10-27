"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mestakara/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@mestakara/ui/field";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { FieldNote } from "@/components/shared/FieldNote";
import { SelectField } from "@/components/shared/FormFields";
import { ApiError, apiDownload } from "@/lib/http-client";
import { EXPORT_FORMATS, groupByLabel, type ExportFormat } from "@/lib/payroll-rules";
import type { PayrollGroup, PayrollGroupBy } from "@/types/api/payroll";

/** Dokumen yang diekspor. null = dialog tertutup. */
export type ExportDocument = "daftar-upah" | "spkl";

interface PayrollExportDialogProps {
  document: ExportDocument | null;
  period: string;
  periodLabel: string;
  /** Pengelompokan yang sedang dipilih di halaman (ekspor mengikutinya) */
  groupBy: PayrollGroupBy;
  groups: PayrollGroup[];
  /** true = periode masih draf (file bertanda DRAF) */
  isDraft: boolean;
  /** Karyawan yang dicentang (khusus SPKL: hanya mereka); kosong = semua */
  selectedEmployeeIds: string[];
  onClose: () => void;
}

/** Pilihan "Isi": "" = semua kelompok, selain itu kunci satu kelompok. */
const ALL = "";

/**
 * Dialog EKSPOR Daftar Upah / SPKL:
 *
 *   Menurut  : Kelompok Daftar Upah  (mengikuti pilihan "Kelompokkan berdasarkan" di halaman)
 *   Isi      : [Semua kelompok ▾]  atau satu kelompok
 *   Jenis    : [Lembur Reguler ▾]  (khusus SPKL)
 *   Format   : [Excel ▾] / PDF
 *                                                [Batal] [⬇ Unduh]
 *
 * Susunan file mengikuti file Excel lama (dibuat backend). Penanda tangan dari menu Penanda Tangan.
 */
export function PayrollExportDialog(props: PayrollExportDialogProps) {
  if (!props.document) return null;
  return <ExportDialogContent key={props.document} {...props} document={props.document} />;
}

function ExportDialogContent({
  document,
  period,
  periodLabel,
  groupBy,
  groups,
  isDraft,
  selectedEmployeeIds,
  onClose,
}: PayrollExportDialogProps & { document: ExportDocument }) {
  const isSpkl = document === "spkl";
  const [groupKey, setGroupKey] = useState(ALL);
  const [spklType, setSpklType] = useState<"reguler" | "dw">("reguler");
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    try {
      const query = new URLSearchParams({ period, group_by: groupBy, format });
      if (groupKey) query.set("group_key", groupKey);
      if (isSpkl) {
        query.set("type", spklType);
        if (selectedEmployeeIds.length > 0) query.set("employee_ids", selectedEmployeeIds.join(","));
      }

      const fileName = await apiDownload(`/api/payroll/${isSpkl ? "spkl" : "export"}?${query}`, fallbackFileName());
      toast.success(`${isSpkl ? "SPKL" : "Daftar Upah"} berhasil diunduh`, { description: fileName });
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
    const title = isSpkl ? `SPKL Lembur ${spklType === "dw" ? "DW" : "Reguler"}` : "Daftar Upah Karyawan Casual & DW";
    const groupName = groups.find((group) => group.key === groupKey)?.name;
    return `${title} - ${groupByLabel(groupBy)}${groupName ? ` - ${groupName}` : ""} - ${periodLabel}${isDraft ? " (DRAF)" : ""}.${format}`;
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && !downloading && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Ekspor {isSpkl ? "SPKL" : "Daftar Upah"} — {periodLabel}
          </DialogTitle>
          <DialogDescription>
            Dikelompokkan menurut {groupByLabel(groupBy)} (ubah lewat pilihan &quot;Kelompokkan berdasarkan&quot; di halaman).
            {isDraft && " Periode masih Draf, jadi file bertanda DRAF."}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <SelectField
            id="export-group"
            label="Isi"
            options={groups.map((group) => ({ value: group.key, label: group.name }))}
            emptyLabel={isSpkl ? "Semua kelompok" : "Semua kelompok (+ REKAP & PAYROLL)"}
            value={groupKey}
            onChange={setGroupKey}
            disabled={downloading}
          />
          {isSpkl && (
            <ChoiceField
              id="export-spkl-type"
              label="Jenis Lembur"
              options={[
                { value: "reguler", label: "Lembur Reguler" },
                { value: "dw", label: "Lembur DW" },
              ]}
              value={spklType}
              onChange={(value) => setSpklType(value as "reguler" | "dw")}
              disabled={downloading}
              note={
                selectedEmployeeIds.length > 0
                  ? `hanya ${selectedEmployeeIds.length} karyawan yang dicentang.`
                  : "semua karyawan yang punya lembur jenis ini."
              }
            />
          )}
          <ChoiceField
            id="export-format"
            label="Format"
            options={EXPORT_FORMATS}
            value={format}
            onChange={(value) => setFormat(value as ExportFormat)}
            disabled={downloading}
          />
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={downloading}>
            Batal
          </Button>
          <Button type="button" onClick={download} disabled={downloading}>
            {downloading ? <Spinner /> : <Download />}
            {downloading ? "Mengunduh..." : "Unduh"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Pilihan yang SELALU terisi (tanpa pilihan kosong "Pilih ..." seperti SelectField). */
function ChoiceField({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
  note,
}: {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  note?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="w-full">
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {note && <FieldNote>{note}</FieldNote>}
    </Field>
  );
}
