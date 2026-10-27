"use client";

import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";

import type { SearchOption } from "@/components/shared/SearchSelect";
import { StatusDocumentFields } from "@/features/penambahan/StatusDocumentFields";
import { fromStatusDocument, toStatusDocument } from "@/lib/transfer-rules";

import type { BasisDocumentValues } from "./mutasi-form-values";

interface BasisDocumentFieldsProps {
  values: BasisDocumentValues;
  /** Dipanggil dengan SELURUH isian dokumen dasar yang baru */
  onChange: (values: BasisDocumentValues) => void;
  /** Pesan error per isian, mis. { basis_document_number: "Nomor Dokumen wajib diisi" } */
  errors: Record<string, string>;
  disabled: boolean;
  /** Calon penandatangan dari unit sendiri (lihat toSignerOptions) */
  signerOptions: SearchOption[];
}

/**
 * Isian DOKUMEN DASAR MUTASI & PENEMPATAN — sama dengan dokumen dasar Penambahan / Penonaktifan:
 *
 *   (i) Opsional, namun sangat disarankan ...
 *   Jenis Dokumen [SK / Memo / Nota Dinas / ... ▾]   Nomor Dokumen [      ]   Tanggal [📅]
 *   File Dokumen [ Tarik & lepas file / Pilih File ]
 *   Penandatangan  ○ Unit ○ Kantor Regional ○ Head Office   (wajib kalau jenisnya SK)
 *
 * Semua isian opsional, tapi begitu salah satunya diisi, Jenis, Nomor, Tanggal, dan File menjadi WAJIB.
 * Isian mutasi berawalan `basis_`, jadi diterjemahkan dulu ke isian dokumen umum (toStatusDocument).
 *
 * Dipakai di wizard (langkah 3 — Dokumen) dan di dialog "Dokumen Dasar" halaman detail.
 */
export function BasisDocumentFields({ values, onChange, errors, disabled, signerOptions }: BasisDocumentFieldsProps) {
  // Pesan error "basis_document_type" -> "document_type", dst.
  const documentErrors = Object.fromEntries(
    Object.entries(errors)
      .filter(([field]) => field.startsWith("basis_"))
      .map(([field, message]) => [field.slice("basis_".length), message]),
  );

  return (
    <div className="flex flex-col gap-5">
      <Alert variant="info">
        <Info />
        <AlertDescription>
          {/* Dibungkus <p> supaya teks tebalnya tetap sebaris dengan kalimatnya */}
          <p>
            Bagian ini opsional, namun <strong>sangat disarankan untuk dilengkapi</strong> sebagai dasar
            pertanggungjawaban. Lampirkan dokumen yang menjadi dasar mutasi/penempatan, seperti Memo, Nota Dinas,
            Disposisi, atau SK (penandatangan wajib). Jika SK mutasi yang diunggah sudah dapat dijadikan dasar, bagian ini
            boleh dikosongkan.
          </p>
        </AlertDescription>
      </Alert>

      <StatusDocumentFields
        idPrefix="basis"
        values={{ ...toStatusDocument(values), document_file: values.basis_document_file }}
        onChange={({ document_file, ...document }) =>
          onChange({ ...fromStatusDocument(document), basis_document_file: document_file })
        }
        errors={documentErrors}
        disabled={disabled}
        signerOptions={signerOptions}
      />
    </div>
  );
}
