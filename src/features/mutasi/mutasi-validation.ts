/**
 * PEMERIKSAAN ISIAN WIZARD, per langkah. Pesannya sama dengan pemeriksaan server
 * (lib/mock/transfer-mock.ts), supaya user tahu apa yang salah sebelum menyimpan.
 *
 * Setiap fungsi menghasilkan { nama isian: pesan }. Kosong = langkah itu sudah benar.
 * Aturan yang butuh data terbaru (mis. Definitif ganda) tetap diperiksa server saat Simpan.
 */
import { needsSupervisor } from "@/lib/assignment-rules";
import { checkSigner } from "@/lib/signer-rules";
import { checkBasisDocument, DOCUMENT_MODE, requiresFromAssignment } from "@/lib/transfer-rules";
import type { PositionResource } from "@/types/api/organization";

import { itemErrorKey, type MutasiFormValues } from "./mutasi-form-values";

export type StepErrors = Record<string, string>;

/** Langkah 1 — Pilih Karyawan: jenis mutasi & minimal satu karyawan. */
export function checkEmployeeStep(values: MutasiFormValues): StepErrors {
  const errors: StepErrors = {};

  if (!values.type) errors.type = "Pilih Jenis Mutasi";
  if (values.items.length === 0) errors.items = "Pilih minimal satu karyawan";

  return errors;
}

/** Langkah 2 — Atur Penugasan Baru: TMT dan isian setiap karyawan. */
export function checkAssignmentStep(values: MutasiFormValues, positions: PositionResource[]): StepErrors {
  const errors: StepErrors = {};

  if (!values.effective_date) errors.effective_date = "Pilih TMT Berlaku";

  for (const item of values.items) {
    const add = (field: Parameters<typeof itemErrorKey>[1], message: string) => {
      errors[itemErrorKey(item.id, field)] = message;
    };

    if (requiresFromAssignment(values.type) && !item.from_assignment_id) add("from_assignment_id", "Pilih jabatan lama yang diakhiri");
    if (!item.position_id) add("position_id", "Pilih Jabatan");
    if (!item.assignment_status) add("assignment_status", "Pilih Status Jabatan");
    if (!item.sub_unit_id) add("sub_unit_id", "Pilih Sub Unit");

    const position = positions.find((entry) => entry.id === item.position_id);
    if (position && needsSupervisor(position.brm_level) && item.supervisor_assignment_ids.length === 0) {
      add("supervisor_assignment_ids", "Pilih minimal satu Atasan Langsung");
    }

    if (item.end_date && values.effective_date && item.end_date < values.effective_date) {
      add("end_date", "TMT Selesai tidak boleh lebih awal dari TMT Berlaku");
    }
  }

  return errors;
}

/**
 * Langkah 3 — Dokumen: dokumen dasar (kalau file-nya diunggah, jenis/nomor/tanggal wajib),
 * nomor & tanggal SK, penandatangan, cara dokumen, dan scan (jalur Unggah).
 */
export function checkDocumentStep(values: MutasiFormValues): StepErrors {
  const errors: StepErrors = checkBasisDocument(values, values.basis_document_file !== null);

  if (!values.decree_number.trim()) errors.decree_number = "Nomor SK wajib diisi";
  else if (values.decree_number.trim().endsWith("-")) errors.decree_number = "Lengkapi nomor urut SK di belakang tanda \"-\"";
  if (!values.decree_date) errors.decree_date = "Pilih Tanggal SK";
  Object.assign(errors, checkSigner(values, true));
  if (!values.document_mode) errors.document_mode = "Pilih cara menyiapkan dokumen SK";
  if (values.document_mode === DOCUMENT_MODE.upload && !values.signed_file) {
    errors.signed_file = "Unggah scan SK yang sudah ditandatangani";
  }

  return errors;
}

/**
 * Langkah mana yang memuat isian bermasalah (1–3), untuk dibuka saat server menolak.
 * Isian karyawan & TMT di langkah 2, isian SK di langkah 3, sisanya langkah 1.
 */
export function stepOfError(fieldName: string): number {
  if (fieldName === "type" || fieldName === "items" || fieldName.endsWith(".employee_id")) return 1;
  if (fieldName.startsWith("items.") || fieldName === "effective_date") return 2;
  return 3;
}
