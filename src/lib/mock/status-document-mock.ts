/**
 * ALAT BANTU DOKUMEN DASAR usulan Penambahan (dan nanti Penonaktifan) di data mock:
 * membaca isian dari form, memeriksa, menyimpan file, dan mengubahnya ke bentuk API.
 *
 * Satu dokumen = jenis + nomor + tanggal + file + penandatangan, dengan nama isian:
 *   kolektif   : document_type, document_number, ..., file "document_file"
 *   per orang  : isian yang sama di item (JSON), file "document_file_<id item>"
 */
import { checkStatusDocument, type StatusDocumentValues } from "@/lib/activation-rules";
import { isAssignmentActive } from "@/lib/assignment-rules";
import { checkFile, DOCUMENT_RULE } from "@/lib/file-rules";
import { cleanSigner, SIGNER_SOURCE, type SignerValues } from "@/lib/signer-rules";
import type { StatusDocumentResource } from "@/types/api/employee-activation";

import { EMPTY_DOCUMENT, type StoredDocument } from "./organization/activations";
import { getStore } from "./organization-store";
import { createSamplePdf } from "./sample-pdf";
import type { GeneratedDocument } from "./transfer-documents";

/** File yang dikirim form: file baru, "lama" (file lama dipertahankan), atau null (tidak ada). */
export type SentFile = File | "lama" | null;

/** Ambil isian dokumen dari objek teks (form kolektif atau item JSON). */
export function readDocumentValues(read: (key: string) => string): StatusDocumentValues {
  return {
    document_type: read("document_type"),
    document_number: read("document_number"),
    document_date: read("document_date"),
    signer_source: read("signer_source"),
    signer_assignment_id: read("signer_assignment_id"),
    signer_name: read("signer_name"),
    signer_position: read("signer_position"),
  };
}

/** Ambil file dari FormData. null kalau tidak ada file yang dikirim. */
export function fileOf(form: FormData, key: string): File | null {
  const value = form.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

/**
 * Periksa satu dokumen. Pesan error ditulis ke `errors` dengan awalan `prefix`
 * (mis. "" untuk kolektif, "items.<id>." untuk per orang).
 * `required` = dokumen wajib ada (penonaktifan). Penandatangan Unit harus pejabat yang sedang menjabat.
 */
export function validateDocument(
  values: StatusDocumentValues,
  file: SentFile,
  errors: Record<string, string[]>,
  prefix = "",
  required = false,
) {
  for (const [field, message] of Object.entries(checkStatusDocument(values, file !== null, required))) {
    errors[`${prefix}${field}`] = [message];
  }

  const signerError = unitSignerError(values);
  if (signerError) errors[`${prefix}signer_assignment_id`] = [signerError];

  const fileError = file instanceof File ? checkFile(file, DOCUMENT_RULE) : undefined;
  if (fileError) errors[`${prefix}document_file`] = [fileError];
}

/**
 * Simpan isian dokumen ke record. File: baru -> disimpan, "lama" -> dipertahankan, null -> dikosongkan.
 */
export async function saveDocument(target: StoredDocument, values: StatusDocumentValues, file: SentFile) {
  Object.assign(target, {
    document_type: values.document_type || null,
    document_number: values.document_number.trim() || null,
    document_date: values.document_date || null,
    ...cleanSigner(values),
  });

  if (file instanceof File) {
    target.document_file = { name: file.name, size: file.size, type: file.type };
    target.document_file_data = Buffer.from(await file.arrayBuffer()).toString("base64");
  } else if (file === null) {
    target.document_file = null;
    target.document_file_data = null;
  }
}

/** Kosongkan dokumen (mis. saat ganti dari Kolektif ke Per Orang). */
export function clearDocument(target: StoredDocument) {
  Object.assign(target, EMPTY_DOCUMENT);
}

/** Apakah dokumen ini sudah ada isinya (minimal file)? */
export function hasStoredDocument(document: StoredDocument): boolean {
  return document.document_file !== null;
}

/** Dokumen tersimpan -> bentuk API. null kalau belum diisi sama sekali. */
export function toDocumentResource(document: StoredDocument, fileUrl: string): StatusDocumentResource | null {
  if (!document.document_type && !document.document_file) return null;

  return {
    type: document.document_type ?? "",
    number: document.document_number ?? "",
    date: document.document_date ?? "",
    file: document.document_file,
    file_url: document.document_file ? fileUrl : null,
    signer: toSignerResource(document),
  };
}

/** Penandatangan dari Unit harus pejabat yang SEDANG menjabat. Hasilnya pesan error, atau null. */
export function unitSignerError(values: Pick<SignerValues, "signer_source" | "signer_assignment_id">): string | null {
  if (values.signer_source !== SIGNER_SOURCE.unit || !values.signer_assignment_id) return null;
  const signer = getStore().assignments.find((item) => item.id === values.signer_assignment_id);
  return !signer || !isAssignmentActive(signer) ? "Penandatangan harus pejabat yang sedang menjabat" : null;
}

/** Isian penandatangan yang DISIMPAN (null = kosong). */
type StoredSigner = Pick<StoredDocument, "signer_source" | "signer_assignment_id" | "signer_name" | "signer_position">;

/**
 * Penandatangan tersimpan -> nama & jabatan (Unit: diambil dari penugasannya).
 * Dipakai dokumen Penambahan / Penonaktifan dan SK & dokumen dasar Mutasi.
 */
export function toSignerResource(document: StoredSigner): StatusDocumentResource["signer"] {
  if (!document.signer_source) return null;

  if (document.signer_source === SIGNER_SOURCE.unit) {
    const { assignments, employees, positions } = getStore();
    const assignment = assignments.find((item) => item.id === document.signer_assignment_id);
    return {
      source: document.signer_source,
      assignment_id: document.signer_assignment_id,
      name: employees.find((item) => item.id === assignment?.employee_id)?.name ?? "-",
      position_title: positions.find((item) => item.id === assignment?.position_id)?.title ?? "-",
    };
  }

  return {
    source: document.signer_source,
    assignment_id: null,
    name: document.signer_name ?? "-",
    position_title: document.signer_position ?? "-",
  };
}

/** Dokumen tersimpan -> isian (untuk pemeriksaan ulang). */
export function toDocumentValues(document: StoredDocument): StatusDocumentValues {
  return {
    document_type: document.document_type ?? "",
    document_number: document.document_number ?? "",
    document_date: document.document_date ?? "",
    signer_source: document.signer_source ?? "",
    signer_assignment_id: document.signer_assignment_id ?? "",
    signer_name: document.signer_name ?? "",
    signer_position: document.signer_position ?? "",
  };
}

/** File dokumen tersimpan -> siap dibuka. Data contoh tanpa isi diganti PDF contoh. */
export function storedDocumentFile(document: StoredDocument): GeneratedDocument | null {
  if (!document.document_file) return null;
  if (document.document_file_data) {
    return {
      bytes: Buffer.from(document.document_file_data, "base64"),
      type: document.document_file.type,
      name: document.document_file.name,
    };
  }

  return {
    bytes: createSamplePdf([
      "SCAN DOKUMEN CONTOH (DATA MOCK)",
      `${document.document_type ?? "Dokumen"} No. ${document.document_number ?? "-"}`,
    ]),
    type: "application/pdf",
    name: document.document_file.name,
  };
}

// ---------------------------------------------------------------------------
// File yang dikirim bersama form usulan (Penambahan / Penonaktifan)
// ---------------------------------------------------------------------------

/** File yang dikirim: kolektif + per orang (per id item dari browser). */
export interface SentFiles {
  collective: SentFile;
  perItem: Map<string, SentFile>;
}

/**
 * Baca file usulan dari FormData: `document_file` (kolektif) dan `document_file_<id item>` (per orang).
 * File lama dipertahankan ("lama") kalau `keep_*` dikirim dan file lamanya memang ada.
 */
export function readFiles(
  form: FormData,
  items: { id: string; keep_document_file: boolean }[],
  current: { document_file: StoredDocument["document_file"]; items: { id: string; document_file: StoredDocument["document_file"] }[] } | null,
): SentFiles {
  const keepCollective = form.get("keep_document_file") === "1" && Boolean(current?.document_file);
  const perItem = new Map<string, SentFile>();

  for (const item of items) {
    const old = current?.items.find((entry) => entry.id === item.id);
    const newFile = fileOf(form, `document_file_${item.id}`);
    perItem.set(item.id, newFile ?? (item.keep_document_file && old?.document_file ? "lama" : null));
  }

  return { collective: fileOf(form, "document_file") ?? (keepCollective ? "lama" : null), perItem };
}

/** Draf: dokumen boleh belum lengkap, tapi file yang dikirim tetap harus benar. */
export function validateFileOnly(file: SentFile, field: string, errors: Record<string, string[]>) {
  const scratch: Record<string, string[]> = {};
  validateDocument(readDocumentValues(() => ""), file instanceof File ? file : null, scratch);
  if (scratch.document_file && file instanceof File) errors[field] = scratch.document_file;
}
