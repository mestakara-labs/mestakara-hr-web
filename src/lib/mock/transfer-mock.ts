/**
 * DATA CONTOH (MOCK) MUTASI & PENEMPATAN — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/transfers/**:
 *
 *   GET    /transfers                         daftar usulan
 *   POST   /transfers                         buat usulan (multipart)
 *   POST   /transfers/preview                 perkiraan perubahan atasan (sebelum disimpan)
 *   GET    /transfers/{id}                    detail usulan
 *   PUT    /transfers/{id}                    ubah usulan Draf / Menunggu Dokumen (multipart)
 *   DELETE /transfers/{id}                    hapus usulan Draf
 *   POST   /transfers/{id}/activate           unggah scan SK bertanda tangan -> Berlaku
 *   POST   /transfers/{id}/cancel             batalkan usulan
 *   POST   /transfers/{id}/basis-document     simpan dokumen dasar (Draf / Menunggu Dokumen)
 *   POST   /transfers/{id}/items/{item}/excerpt   unggah scan petikan SK satu karyawan
 *   GET    /transfers/{id}/documents          unduh dokumen (SK, petikan, scan)
 *
 * Form dikirim sebagai `multipart/form-data` (karena ada file):
 *   - isian teks: type, effective_date, ... (lihat TransferPayload)
 *   - items: daftar karyawan, sebagai teks JSON
 *   - action: "draft" (simpan sebagai Draf) atau "submit" (simpan & lanjutkan)
 *   - file signed_file (scan SK bertanda tangan), atau keep_signed_file = "1"
 *   - file basis_document_file (dokumen dasar), atau keep_basis_document_file = "1"
 */
import {
  ASSIGNMENT_STATUSES,
  canBeSupervisor,
  DEFINITIVE_STATUS,
  getAssignmentPeriod,
  isAssignmentActive,
  needsSupervisor,
} from "@/lib/assignment-rules";
import { ACTIVATION_STATUS, EMPLOYEE_ACTIVE_STATUS } from "@/lib/activation-rules";
import { checkFile, DOCUMENT_RULE } from "@/lib/file-rules";
import { checkSigner, cleanSigner } from "@/lib/signer-rules";
import {
  checkBasisDocument,
  toStatusDocument,
  DOCUMENT_MODE,
  DOCUMENT_MODES,
  INITIAL_PLACEMENT,
  isTransferEditable,
  requiresFromAssignment,
  TRANSFER_STATUS,
  TRANSFER_TYPES,
} from "@/lib/transfer-rules";
import type { UploadedFileInfo } from "@/types/api/employee";
import type {
  BasisDocumentText,
  TransferItemPayload,
  TransferPayload,
  TransferPreviewResource,
  TransferResource,
} from "@/types/api/transfer";

import { failure, success, type MockResult } from "./mock-response";
import type { TransferItemRecord, TransferRecord } from "./organization/transfers";
import { createId, getEmployeeActiveStatus, getStore } from "./organization-store";
import { createSamplePdf } from "./sample-pdf";
import { unitSignerError } from "./status-document-mock";
import { generateTransferDocument, type GeneratedDocument } from "./transfer-documents";
import { applyTransfer, revertTransfer } from "./transfer-plan";
import { previewSupervisorChanges, toTransferResource } from "./transfer-resource";

type Errors = Record<string, string[]>;

/** "draft" = simpan sebagai Draf (pemeriksaan ringan); "submit" = simpan & lanjutkan (pemeriksaan lengkap). */
type SaveAction = "draft" | "submit";

/** File yang dikirim form: file baru, "lama" (file lama dipertahankan), atau null (tidak ada). */
type SentFile = File | "lama" | null;

// ---------------------------------------------------------------------------
// Membaca
// ---------------------------------------------------------------------------

/** Pengganti backend `GET /transfers`. Terbaru di atas. */
export function mockListTransfers(): MockResult<TransferResource[]> {
  const transfers = [...getStore().transfers].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return success("Daftar usulan mutasi", transfers.map(toTransferResource));
}

/** Pengganti backend `GET /transfers/{id}`. */
export function mockGetTransfer(id: string): MockResult<TransferResource | null> {
  const transfer = findTransfer(id);
  if (!transfer) return failure(404, "Usulan mutasi tidak ditemukan.");

  return success("Detail usulan mutasi", toTransferResource(transfer));
}

/** Pengganti backend `POST /transfers/preview`: perkiraan perubahan atasan untuk isian yang belum disimpan. */
export function mockPreviewTransfer(payload: { items: TransferItemPayload[] }): MockResult<TransferPreviewResource> {
  const items = (payload.items ?? []).map((item) => ({
    id: item.id,
    employee_id: item.employee_id,
    from_assignment_id: item.from_assignment_id || null,
    position_id: item.position_id,
    restore_subordinates: Boolean(item.restore_subordinates),
  }));

  return success("Perkiraan perubahan atasan", previewSupervisorChanges(items));
}

// ---------------------------------------------------------------------------
// Menyimpan
// ---------------------------------------------------------------------------

/** Pengganti backend `POST /transfers`. */
export async function mockCreateTransfer(
  form: FormData,
  userName: string,
): Promise<MockResult<TransferResource | null>> {
  const { payload, action } = readForm(form);
  const signedFile = fileOf(form, "signed_file");
  const basisFile = fileOf(form, "basis_document_file");

  const errors = validateTransfer(payload, action, null, { signedFile, basisFile });
  if (errors) return failure(422, "Isian usulan mutasi belum benar.", errors);

  const transfer: TransferRecord = {
    id: createId("mutasi"),
    ...cleanPayload(payload),
    status: TRANSFER_STATUS.draft,
    items: toItemRecords(payload.items, []),
    basis_document_file: null,
    basis_document_file_data: null,
    signed_file: null,
    signed_file_data: null,
    applied: null,
    created_at: new Date().toISOString(),
    created_by: userName,
    activated_at: null,
    cancelled_at: null,
    cancelled_by: null,
    cancel_reason: null,
  };
  getStore().transfers.push(transfer);

  if (basisFile) await saveBasisFile(transfer, basisFile);
  await finishSave(transfer, action, form, userName);

  return success(saveMessage(transfer), toTransferResource(transfer), 201);
}

/** Pengganti backend `PUT /transfers/{id}`. Hanya untuk usulan Draf & Menunggu Dokumen. */
export async function mockUpdateTransfer(
  id: string,
  form: FormData,
  userName: string,
): Promise<MockResult<TransferResource | null>> {
  const transfer = findTransfer(id);
  if (!transfer) return failure(404, "Usulan mutasi tidak ditemukan.");
  if (!isTransferEditable(transfer.status)) {
    return failure(409, `Usulan berstatus ${transfer.status} tidak bisa diubah.`);
  }

  const { payload, action } = readForm(form);
  const signedFile = fileOf(form, "signed_file");
  const keepsSignedFile = form.get("keep_signed_file") === "1" && transfer.signed_file !== null;
  const basisFile = fileOf(form, "basis_document_file");
  const keepsBasisFile = form.get("keep_basis_document_file") === "1" && transfer.basis_document_file !== null;

  const errors = validateTransfer(payload, action, id, {
    signedFile: signedFile ?? (keepsSignedFile ? "lama" : null),
    basisFile: basisFile ?? (keepsBasisFile ? "lama" : null),
  });
  if (errors) return failure(422, "Isian usulan mutasi belum benar.", errors);

  Object.assign(transfer, cleanPayload(payload), {
    items: toItemRecords(payload.items, transfer.items),
  });
  if (!keepsSignedFile) {
    transfer.signed_file = null;
    transfer.signed_file_data = null;
  }
  if (!keepsBasisFile) {
    transfer.basis_document_file = null;
    transfer.basis_document_file_data = null;
  }

  if (basisFile) await saveBasisFile(transfer, basisFile);
  await finishSave(transfer, action, form, userName);

  return success(saveMessage(transfer), toTransferResource(transfer));
}

/** Pengganti backend `DELETE /transfers/{id}`. Hanya usulan Draf yang boleh dihapus. */
export function mockDeleteTransfer(id: string): MockResult<null> {
  const store = getStore();
  const transfer = findTransfer(id);
  if (!transfer) return failure(404, "Usulan mutasi tidak ditemukan.");
  if (transfer.status !== TRANSFER_STATUS.draft) {
    return failure(409, "Hanya usulan berstatus Draf yang bisa dihapus. Usulan lain dibatalkan.");
  }

  store.transfers = store.transfers.filter((item) => item.id !== id);
  return success("Draf usulan mutasi berhasil dihapus.", null);
}

/**
 * Pengganti backend `POST /transfers/{id}/activate`: unggah scan SK kolektif yang
 * sudah ditandatangani -> usulan BERLAKU. Hanya untuk usulan Menunggu Dokumen.
 * Isian usulan diperiksa ulang, karena data bisa berubah sejak usulan disimpan.
 */
export async function mockActivateTransfer(
  id: string,
  form: FormData,
  userName: string,
): Promise<MockResult<TransferResource | null>> {
  const transfer = findTransfer(id);
  if (!transfer) return failure(404, "Usulan mutasi tidak ditemukan.");
  if (transfer.status !== TRANSFER_STATUS.waiting) {
    return failure(409, `Usulan berstatus ${transfer.status} tidak bisa diaktifkan.`);
  }

  const signedFile = fileOf(form, "signed_file");
  if (!signedFile) return failure(422, "Scan SK belum diunggah.", { signed_file: ["Unggah scan SK yang sudah ditandatangani"] });

  const errors = validateTransfer(toPayload(transfer), "submit", id, {
    signedFile,
    basisFile: transfer.basis_document_file ? "lama" : null,
  });
  if (errors?.signed_file) return failure(422, "Scan SK belum benar.", { signed_file: errors.signed_file });
  if (errors) {
    return failure(422, "Ada isian usulan yang sudah tidak sesuai dengan data terbaru. Ubah usulannya terlebih dahulu.", errors);
  }

  await saveSignedFile(transfer, signedFile);
  applyTransfer(transfer, userName);

  return success("Scan SK diunggah. Usulan mutasi sekarang berlaku.", toTransferResource(transfer));
}

/**
 * Pengganti backend `POST /transfers/{id}/basis-document`: simpan DOKUMEN DASAR usulan
 * dari halaman detail. Hanya untuk usulan Draf & Menunggu Dokumen.
 * Isiannya sama dengan form (basis_document_*), termasuk keep_basis_document_file.
 */
export async function mockSaveBasisDocument(id: string, form: FormData): Promise<MockResult<TransferResource | null>> {
  const transfer = findTransfer(id);
  if (!transfer) return failure(404, "Usulan mutasi tidak ditemukan.");
  if (!isTransferEditable(transfer.status)) {
    return failure(409, `Dokumen dasar usulan berstatus ${transfer.status} tidak bisa diubah.`);
  }

  const document = readBasisDocument(form);
  const basisFile = fileOf(form, "basis_document_file");
  const keepsBasisFile = form.get("keep_basis_document_file") === "1" && transfer.basis_document_file !== null;

  const errors: Errors = {};
  validateBasisDocument(document, basisFile ?? (keepsBasisFile ? "lama" : null), errors);
  if (Object.keys(errors).length > 0) return failure(422, "Isian dokumen dasar belum benar.", errors);

  Object.assign(transfer, cleanBasisDocument(document));
  if (!keepsBasisFile) {
    transfer.basis_document_file = null;
    transfer.basis_document_file_data = null;
  }
  if (basisFile) await saveBasisFile(transfer, basisFile);

  return success("Dokumen dasar berhasil disimpan.", toTransferResource(transfer));
}

/**
 * Pengganti backend `POST /transfers/{id}/cancel`.
 *   - Menunggu Dokumen -> Dibatalkan (alasan opsional)
 *   - Berlaku          -> Dibatalkan, semua perubahannya dikembalikan (alasan WAJIB)
 *   - Draf             -> ditolak (hapus saja)
 */
export function mockCancelTransfer(
  id: string,
  payload: { reason?: string },
  userName: string,
): MockResult<TransferResource | null> {
  const transfer = findTransfer(id);
  if (!transfer) return failure(404, "Usulan mutasi tidak ditemukan.");

  const reason = (payload.reason ?? "").trim();

  if (transfer.status === TRANSFER_STATUS.draft) {
    return failure(409, "Usulan berstatus Draf tidak perlu dibatalkan. Hapus saja drafnya.");
  }
  if (transfer.status === TRANSFER_STATUS.cancelled) {
    return failure(409, "Usulan ini sudah dibatalkan.");
  }

  if (transfer.status === TRANSFER_STATUS.effective) {
    if (!reason) return failure(422, "Alasan pembatalan wajib diisi.", { reason: ["Alasan Pembatalan wajib diisi"] });

    const blockedReason = revertTransfer(transfer, userName, reason);
    if (blockedReason) return failure(409, blockedReason);
  }

  transfer.status = TRANSFER_STATUS.cancelled;
  transfer.cancelled_at = new Date().toISOString();
  transfer.cancelled_by = userName;
  transfer.cancel_reason = reason || null;

  return success("Usulan mutasi berhasil dibatalkan.", toTransferResource(transfer));
}

/**
 * Pengganti backend `POST /transfers/{id}/items/{itemId}/excerpt`: unggah scan PETIKAN SK
 * satu karyawan. Kalau usulan sudah berlaku, file dokumen dasar penugasan barunya ikut diganti.
 */
export async function mockUploadExcerpt(
  id: string,
  itemId: string,
  form: FormData,
): Promise<MockResult<TransferResource | null>> {
  const transfer = findTransfer(id);
  if (!transfer) return failure(404, "Usulan mutasi tidak ditemukan.");
  if (transfer.status !== TRANSFER_STATUS.waiting && transfer.status !== TRANSFER_STATUS.effective) {
    return failure(409, "Petikan SK hanya bisa diunggah untuk usulan Menunggu Dokumen atau Berlaku.");
  }

  const item = transfer.items.find((entry) => entry.id === itemId);
  if (!item) return failure(404, "Karyawan tidak ditemukan di usulan ini.");

  const file = fileOf(form, "excerpt_file");
  if (!file) return failure(422, "Scan petikan belum diunggah.", { excerpt_file: ["Pilih file scan petikan SK"] });

  const fileError = checkFile(file, DOCUMENT_RULE);
  if (fileError) return failure(422, "Scan petikan belum benar.", { excerpt_file: [fileError] });

  item.excerpt_file = { name: file.name, size: file.size, type: file.type };
  item.excerpt_file_data = Buffer.from(await file.arrayBuffer()).toString("base64");

  // Sudah berlaku -> file dokumen dasar penugasan barunya diganti petikan ini.
  const newAssignment = getStore().assignments.find((entry) => entry.id === item.new_assignment_id);
  if (newAssignment) {
    newAssignment.decree_file = item.excerpt_file;
    newAssignment.decree_file_data = item.excerpt_file_data;
  }

  return success("Scan petikan SK berhasil diunggah.", toTransferResource(transfer));
}

/**
 * Pengganti backend `GET /transfers/{id}/documents`.
 *   type=sk                   SK kolektif hasil template (format pdf / doc)
 *   type=petikan&item={id}    petikan SK satu karyawan hasil template (format pdf / doc)
 *   type=scan                 scan SK kolektif bertanda tangan
 *   type=scan-petikan&item=   scan petikan SK satu karyawan
 *   type=dasar                dokumen dasar mutasi
 * null = dokumen tidak ada.
 */
export function mockGetTransferDocument(
  id: string,
  query: { type: string; item: string | null; format: string },
): GeneratedDocument | null {
  const transfer = findTransfer(id);
  if (!transfer) return null;

  const decreeLabel = `SK No. ${transfer.decree_number ?? "-"}`;

  if (query.type === "scan") {
    return storedFile(transfer.signed_file, transfer.signed_file_data, decreeLabel);
  }

  if (query.type === "scan-petikan") {
    const item = transfer.items.find((entry) => entry.id === query.item);
    return item ? storedFile(item.excerpt_file, item.excerpt_file_data, decreeLabel) : null;
  }

  if (query.type === "dasar") {
    const basisLabel = `${transfer.basis_document_type ?? "Dokumen"} No. ${transfer.basis_document_number ?? "-"}`;
    return storedFile(transfer.basis_document_file, transfer.basis_document_file_data, basisLabel);
  }

  // Dokumen hasil template baru bisa dibuat setelah nomor & tanggal SK diisi (bukan Draf).
  if (transfer.status === TRANSFER_STATUS.draft) return null;

  const format = query.format === "doc" ? "doc" : "pdf";
  if (query.type === "sk") return generateTransferDocument(toTransferResource(transfer), null, format);
  if (query.type === "petikan" && query.item) return generateTransferDocument(toTransferResource(transfer), query.item, format);

  return null;
}

// ---------------------------------------------------------------------------
// Alat bantu: membaca form & menyimpan
// ---------------------------------------------------------------------------

function findTransfer(id: string): TransferRecord | undefined {
  return getStore().transfers.find((item) => item.id === id);
}

/** Ambil isian dari FormData. Isian yang tidak dikirim dianggap kosong. */
function readForm(form: FormData): { payload: TransferPayload; action: SaveAction } {
  const text = (key: string) => String(form.get(key) ?? "").trim();

  let items: TransferItemPayload[] = [];
  try {
    const parsed: unknown = JSON.parse(text("items") || "[]");
    if (Array.isArray(parsed)) items = parsed as TransferItemPayload[];
  } catch {
    items = [];
  }

  return {
    action: text("action") === "draft" ? "draft" : "submit",
    payload: {
      type: text("type"),
      effective_date: text("effective_date"),
      notes: text("notes"),
      ...readBasisDocument(form),
      decree_number: text("decree_number"),
      decree_date: text("decree_date"),
      signer_source: text("signer_source"),
      signer_assignment_id: text("signer_assignment_id"),
      signer_name: text("signer_name"),
      signer_position: text("signer_position"),
      document_mode: text("document_mode"),
      items: items.map((item) => ({
        id: String(item.id ?? ""),
        employee_id: String(item.employee_id ?? ""),
        from_assignment_id: String(item.from_assignment_id ?? ""),
        position_id: String(item.position_id ?? ""),
        assignment_status: String(item.assignment_status ?? ""),
        sub_unit_id: String(item.sub_unit_id ?? ""),
        placement_object_ids: Array.isArray(item.placement_object_ids) ? item.placement_object_ids.map(String) : [],
        supervisor_assignment_ids: Array.isArray(item.supervisor_assignment_ids)
          ? item.supervisor_assignment_ids.map(String)
          : [],
        end_date: String(item.end_date ?? ""),
        notes: String(item.notes ?? ""),
        restore_subordinates: Boolean(item.restore_subordinates),
      })),
    },
  };
}

/** Ambil isian teks dokumen dasar dari FormData. */
function readBasisDocument(form: FormData): BasisDocumentText {
  const text = (key: string) => String(form.get(key) ?? "").trim();

  return {
    basis_document_type: text("basis_document_type"),
    basis_document_number: text("basis_document_number"),
    basis_document_date: text("basis_document_date"),
    basis_signer_source: text("basis_signer_source"),
    basis_signer_assignment_id: text("basis_signer_assignment_id"),
    basis_signer_name: text("basis_signer_name"),
    basis_signer_position: text("basis_signer_position"),
  };
}

/** Isian teks dokumen dasar -> bentuk yang disimpan (isian kosong jadi null). */
function cleanBasisDocument(document: BasisDocumentText) {
  const signer = cleanSigner(toStatusDocument(document));
  return {
    basis_document_type: document.basis_document_type || null,
    basis_document_number: document.basis_document_number || null,
    basis_document_date: document.basis_document_date || null,
    basis_signer_source: signer.signer_source,
    basis_signer_assignment_id: signer.signer_assignment_id,
    basis_signer_name: signer.signer_name,
    basis_signer_position: signer.signer_position,
  };
}

/** Isian usulan -> bentuk yang disimpan (isian kosong jadi null). */
function cleanPayload(payload: TransferPayload) {
  return {
    type: payload.type,
    effective_date: payload.effective_date || null,
    notes: payload.notes || null,
    ...cleanBasisDocument(payload),
    decree_number: payload.decree_number || null,
    decree_date: payload.decree_date || null,
    ...cleanSigner(payload),
    document_mode: payload.document_mode || null,
  };
}

/** Isian karyawan -> item yang disimpan. Scan petikan item lama (id sama) dipertahankan. */
function toItemRecords(items: TransferItemPayload[], previous: TransferItemRecord[]): TransferItemRecord[] {
  return items.map((item) => {
    const old = previous.find((entry) => entry.id === item.id);

    return {
      // Baris baru dari browser ("baru-...") diberi id tetap.
      id: old ? old.id : createId("mutasi-item"),
      employee_id: item.employee_id,
      from_assignment_id: item.from_assignment_id || null,
      position_id: item.position_id,
      assignment_status: item.assignment_status,
      sub_unit_id: item.sub_unit_id,
      placement_object_ids: item.placement_object_ids,
      supervisor_assignment_ids: item.supervisor_assignment_ids,
      end_date: item.end_date || null,
      notes: item.notes || null,
      restore_subordinates: item.restore_subordinates,
      excerpt_file: old?.excerpt_file ?? null,
      excerpt_file_data: old?.excerpt_file_data ?? null,
      new_assignment_id: null,
    };
  });
}

/** Usulan yang tersimpan -> bentuk isian (untuk pemeriksaan ulang saat diaktifkan). */
function toPayload(transfer: TransferRecord): TransferPayload {
  return {
    type: transfer.type,
    effective_date: transfer.effective_date ?? "",
    notes: transfer.notes ?? "",
    basis_document_type: transfer.basis_document_type ?? "",
    basis_document_number: transfer.basis_document_number ?? "",
    basis_document_date: transfer.basis_document_date ?? "",
    basis_signer_source: transfer.basis_signer_source ?? "",
    basis_signer_assignment_id: transfer.basis_signer_assignment_id ?? "",
    basis_signer_name: transfer.basis_signer_name ?? "",
    basis_signer_position: transfer.basis_signer_position ?? "",
    decree_number: transfer.decree_number ?? "",
    decree_date: transfer.decree_date ?? "",
    signer_source: transfer.signer_source ?? "",
    signer_assignment_id: transfer.signer_assignment_id ?? "",
    signer_name: transfer.signer_name ?? "",
    signer_position: transfer.signer_position ?? "",
    // Saat diaktifkan, scan SK justru sedang diunggah, jadi dianggap jalur "Unggah".
    document_mode: DOCUMENT_MODE.upload,
    items: transfer.items.map((item) => ({
      id: item.id,
      employee_id: item.employee_id,
      from_assignment_id: item.from_assignment_id ?? "",
      position_id: item.position_id,
      assignment_status: item.assignment_status,
      sub_unit_id: item.sub_unit_id,
      placement_object_ids: item.placement_object_ids,
      supervisor_assignment_ids: item.supervisor_assignment_ids,
      end_date: item.end_date ?? "",
      notes: item.notes ?? "",
      restore_subordinates: item.restore_subordinates,
    })),
  };
}

/**
 * Langkah terakhir menyimpan usulan:
 *   - "draft"                    -> status Draf
 *   - "submit" + jalur Template  -> status Menunggu Dokumen (SK dibuat dari template)
 *   - "submit" + jalur Unggah    -> scan SK disimpan, usulan langsung BERLAKU
 */
async function finishSave(transfer: TransferRecord, action: SaveAction, form: FormData, userName: string) {
  if (action === "draft") {
    transfer.status = TRANSFER_STATUS.draft;
    return;
  }

  if (transfer.document_mode === DOCUMENT_MODE.template) {
    transfer.status = TRANSFER_STATUS.waiting;
    return;
  }

  const signedFile = fileOf(form, "signed_file");
  if (signedFile) await saveSignedFile(transfer, signedFile);
  applyTransfer(transfer, userName);
}

/** Pesan sukses sesuai status akhir usulan. */
function saveMessage(transfer: TransferRecord): string {
  if (transfer.status === TRANSFER_STATUS.draft) return "Draf usulan mutasi berhasil disimpan.";
  if (transfer.status === TRANSFER_STATUS.waiting) {
    return "Usulan mutasi disimpan. Unduh SK, tanda tangani, lalu unggah scan-nya supaya berlaku.";
  }
  return "Usulan mutasi berhasil disimpan dan sudah berlaku.";
}

/** Ambil file dari FormData. null kalau tidak ada file yang dikirim. */
function fileOf(form: FormData, key: string): File | null {
  const value = form.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

/** Simpan file dokumen dasar (keterangan + isi file dalam base64). */
async function saveBasisFile(transfer: TransferRecord, file: File) {
  transfer.basis_document_file = { name: file.name, size: file.size, type: file.type };
  transfer.basis_document_file_data = Buffer.from(await file.arrayBuffer()).toString("base64");
}

/** Simpan scan SK kolektif (keterangan + isi file dalam base64). */
async function saveSignedFile(transfer: TransferRecord, file: File) {
  transfer.signed_file = { name: file.name, size: file.size, type: file.type };
  transfer.signed_file_data = Buffer.from(await file.arrayBuffer()).toString("base64");
}

/**
 * File yang tersimpan -> siap diunduh. Data contoh tanpa isi file diganti PDF contoh
 * bertuliskan `sampleLabel`, mis. "SK No. 2A44/P/2026.10.01-031".
 */
function storedFile(info: UploadedFileInfo | null, data: string | null, sampleLabel: string): GeneratedDocument | null {
  if (!info) return null;
  if (data) return { bytes: Buffer.from(data, "base64"), type: info.type, name: info.name };

  return {
    bytes: createSamplePdf(["SCAN DOKUMEN CONTOH (DATA MOCK)", sampleLabel]),
    type: "application/pdf",
    name: info.name,
  };
}

// ---------------------------------------------------------------------------
// Pemeriksaan isian
// ---------------------------------------------------------------------------

/**
 * Periksa isian usulan. Hasilnya pesan error per isian, atau null kalau semua benar.
 * Error per karyawan memakai nama isian "items.<id item>.<isian>", mis. "items.baru-1.position_id".
 *
 * @param action      "draft" = pemeriksaan ringan; "submit" = lengkap
 * @param currentId   id usulan yang sedang diubah (null saat tambah baru)
 * @param files       signedFile = scan SK bertanda tangan, basisFile = file dokumen dasar
 */
function validateTransfer(
  payload: TransferPayload,
  action: SaveAction,
  currentId: string | null,
  files: { signedFile: SentFile; basisFile: SentFile },
): Errors | null {
  const errors: Errors = {};
  const isSubmit = action === "submit";

  // --- Isian bersama ------------------------------------------------------------
  if (!payload.type) errors.type = ["Pilih Jenis Mutasi"];
  else if (!TRANSFER_TYPES.includes(payload.type)) errors.type = ["Jenis Mutasi tidak dikenal"];

  if (payload.items.length === 0) errors.items = ["Pilih minimal satu karyawan"];

  if (isSubmit) {
    validateDecree(payload, currentId, files.signedFile, errors);
    validateBasisDocument(payload, files.basisFile, errors);
  } else {
    // Draf: isian dokumen dasar boleh belum lengkap, tapi file yang dikirim tetap harus benar.
    const fileError = files.basisFile instanceof File ? checkFile(files.basisFile, DOCUMENT_RULE) : undefined;
    if (fileError) errors.basis_document_file = [fileError];
  }

  // --- Per karyawan ------------------------------------------------------------
  const employeeIds = payload.items.map((item) => item.employee_id);
  for (const item of payload.items) {
    const key = (field: string) => `items.${item.id}.${field}`;

    if (employeeIds.filter((id) => id === item.employee_id).length > 1) {
      errors[key("employee_id")] = ["Karyawan ini dipilih lebih dari sekali"];
      continue;
    }

    const employeeError = checkEmployee(item.employee_id, currentId);
    if (employeeError) {
      errors[key("employee_id")] = [employeeError];
      continue;
    }

    if (isSubmit) Object.assign(errors, validateItem(item, payload, key));
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/** Isian SK: nomor (tidak boleh kembar), tanggal, penandatangan, cara dokumen, dan scan SK. */
function validateDecree(
  payload: TransferPayload,
  currentId: string | null,
  signedFile: SentFile,
  errors: Errors,
) {
  const { transfers } = getStore();

  if (!payload.effective_date) errors.effective_date = ["Pilih TMT Berlaku"];
  if (!payload.decree_date) errors.decree_date = ["Pilih Tanggal SK"];

  if (!payload.decree_number) {
    errors.decree_number = ["Nomor SK wajib diisi"];
  } else {
    const isUsed = transfers.some(
      (item) =>
        item.id !== currentId &&
        item.status !== TRANSFER_STATUS.cancelled &&
        item.decree_number?.toLowerCase() === payload.decree_number.toLowerCase(),
    );
    if (isUsed) errors.decree_number = [`Nomor SK "${payload.decree_number}" sudah dipakai usulan lain`];
  }

  // Penandatangan SK wajib: Unit (pejabat yang sedang menjabat) / Kantor Regional / Head Office.
  for (const [field, message] of Object.entries(checkSigner(payload, true))) errors[field] = [message];
  const signerError = unitSignerError(payload);
  if (signerError) errors.signer_assignment_id = [signerError];

  if (!payload.document_mode) errors.document_mode = ["Pilih cara menyiapkan dokumen SK"];
  else if (!DOCUMENT_MODES.includes(payload.document_mode)) errors.document_mode = ["Cara dokumen tidak dikenal"];
  else if (payload.document_mode === DOCUMENT_MODE.upload && !signedFile) {
    errors.signed_file = ["Unggah scan SK yang sudah ditandatangani"];
  }

  const fileError = signedFile instanceof File ? checkFile(signedFile, DOCUMENT_RULE) : undefined;
  if (fileError) errors.signed_file = [fileError];
}

/**
 * Dokumen dasar (opsional): kalau salah satu isiannya diisi, jenis, nomor, tanggal & file wajib
 * (+ penandatangan kalau SK; lihat checkBasisDocument), dan file-nya harus PDF/JPG/PNG maks. 5 MB.
 */
function validateBasisDocument(document: BasisDocumentText, basisFile: SentFile, errors: Errors) {
  for (const [field, message] of Object.entries(checkBasisDocument(document, basisFile !== null))) {
    errors[field] = [message];
  }

  const signerError = unitSignerError(toStatusDocument(document));
  if (signerError) errors.basis_signer_assignment_id = [signerError];

  const fileError = basisFile instanceof File ? checkFile(basisFile, DOCUMENT_RULE) : undefined;
  if (fileError) errors.basis_document_file = [fileError];
}

/**
 * Karyawan harus ada, berstatus AKTIF, dan tidak sedang ada di usulan lain yang belum selesai
 * (Mutasi Draf / Menunggu Dokumen, atau Penambahan Draf). Hasilnya pesan error, atau null.
 */
function checkEmployee(employeeId: string, currentId: string | null): string | null {
  const { activations, employees, terminations, transfers } = getStore();
  const inDraft = (usulan: { status: string; items: { employee_id: string }[] }[]) =>
    usulan.some((entry) => entry.status === ACTIVATION_STATUS.draft && entry.items.some((item) => item.employee_id === employeeId));

  if (!employeeId) return "Pilih Karyawan";
  if (!employees.some((item) => item.id === employeeId)) return "Karyawan tidak ditemukan";
  if (getEmployeeActiveStatus(employeeId) !== EMPLOYEE_ACTIVE_STATUS.active) {
    return "Hanya karyawan Aktif yang bisa dimutasi. Aktifkan dulu lewat Penambahan Karyawan.";
  }
  if (inDraft(activations)) return "Karyawan ini sedang ada di usulan Penambahan (Draf)";
  if (inDraft(terminations)) return "Karyawan ini sedang ada di usulan Penonaktifan (Draf)";

  const openTransfer = transfers.find(
    (transfer) =>
      transfer.id !== currentId &&
      isTransferEditable(transfer.status) &&
      transfer.items.some((item) => item.employee_id === employeeId),
  );
  if (openTransfer) {
    // Cth. "usulan Rotasi No. 2A44/P/2026.10.01-031 (Menunggu Dokumen)" atau "usulan Promosi (Draf)"
    const numberText = openTransfer.decree_number ? ` No. ${openTransfer.decree_number}` : "";
    return `Karyawan ini sedang ada di usulan ${openTransfer.type}${numberText} (${openTransfer.status})`;
  }

  return null;
}

/** Pemeriksaan lengkap satu karyawan (aturan penugasan + aturan mutasi). */
function validateItem(item: TransferItemPayload, payload: TransferPayload, key: (field: string) => string): Errors {
  const { assignments, placementObjects, positions, subUnits } = getStore();
  const errors: Errors = {};

  // Penugasan karyawan ini yang belum selesai (sedang berjalan atau akan datang).
  const current = assignments.filter(
    (assignment) => assignment.employee_id === item.employee_id && getAssignmentPeriod(assignment) !== "Selesai",
  );
  const from = current.find((assignment) => assignment.id === item.from_assignment_id);
  /** Penugasan yang TETAP berjalan setelah mutasi (semua, kecuali yang diakhiri). */
  const remaining = current.filter((assignment) => assignment.id !== item.from_assignment_id);

  // Penugasan lama
  if (payload.type === INITIAL_PLACEMENT) {
    if (current.length > 0) {
      errors[key("employee_id")] = ["Karyawan ini sudah punya jabatan aktif. Pakai jenis mutasi lain."];
    }
  } else if (!item.from_assignment_id) {
    if (requiresFromAssignment(payload.type)) errors[key("from_assignment_id")] = ["Pilih jabatan lama yang diakhiri"];
  } else if (!from) {
    errors[key("from_assignment_id")] = ["Jabatan lama harus penugasan karyawan ini yang masih berjalan"];
  } else if (payload.effective_date && payload.effective_date <= from.start_date) {
    errors[key("from_assignment_id")] = ["TMT Berlaku harus setelah TMT Mulai jabatan lama"];
  }

  // Jabatan, status, tempat tugas
  const position = positions.find((entry) => entry.id === item.position_id);
  if (!item.position_id) errors[key("position_id")] = ["Pilih Jabatan"];
  else if (!position) errors[key("position_id")] = ["Jabatan tidak ditemukan"];
  else if (remaining.some((assignment) => assignment.position_id === item.position_id)) {
    errors[key("position_id")] = ["Karyawan ini masih memegang jabatan yang sama"];
  }

  if (!item.assignment_status) errors[key("assignment_status")] = ["Pilih Status Jabatan"];
  else if (!ASSIGNMENT_STATUSES.includes(item.assignment_status)) errors[key("assignment_status")] = ["Status Jabatan tidak dikenal"];
  else if (
    // Kalau jabatan lama belum dipilih, cukup pesan "Pilih jabatan lama" di atas yang tampil.
    !errors[key("from_assignment_id")] &&
    !errors[key("employee_id")] &&
    item.assignment_status === DEFINITIVE_STATUS &&
    remaining.some((assignment) => assignment.assignment_status === DEFINITIVE_STATUS)
  ) {
    errors[key("assignment_status")] = [
      "Karyawan ini masih Definitif di jabatan lain. Pilih jabatan itu sebagai jabatan lama yang diakhiri.",
    ];
  }

  if (!item.sub_unit_id) errors[key("sub_unit_id")] = ["Pilih Sub Unit"];
  else if (!subUnits.some((entry) => entry.id === item.sub_unit_id)) errors[key("sub_unit_id")] = ["Sub unit tidak ditemukan"];

  // Objek penempatan (opsional, bisa lebih dari satu): semuanya harus ada dan tersedia di sub unit yang dipilih.
  for (const objectId of item.placement_object_ids) {
    const placementObject = placementObjects.find((entry) => entry.id === objectId);
    if (!placementObject) {
      errors[key("placement_object_ids")] = ["Objek penempatan tidak ditemukan"];
    } else if (!placementObject.sub_unit_ids.includes(item.sub_unit_id)) {
      errors[key("placement_object_ids")] = [`Objek "${placementObject.name}" tidak tersedia di sub unit yang dipilih`];
    }
  }

  // Atasan langsung
  if (position) {
    if (item.supervisor_assignment_ids.length === 0) {
      if (needsSupervisor(position.brm_level)) errors[key("supervisor_assignment_ids")] = ["Pilih minimal satu Atasan Langsung"];
    } else {
      const allValid = item.supervisor_assignment_ids.every((supervisorId) => {
        const supervisor = assignments.find((entry) => entry.id === supervisorId);
        const supervisorPosition = positions.find((entry) => entry.id === supervisor?.position_id);
        if (!supervisor || !supervisorPosition) return false;

        const candidate = {
          id: supervisor.id,
          employee_id: supervisor.employee_id,
          brm_level: supervisorPosition.brm_level,
          is_active: isAssignmentActive(supervisor),
        };
        return canBeSupervisor(candidate, position.brm_level, item.employee_id, null);
      });

      if (!allValid) {
        errors[key("supervisor_assignment_ids")] = [
          "Atasan Langsung harus penugasan aktif karyawan lain dengan level BRM lebih tinggi",
        ];
      }
    }
  }

  // TMT Selesai (opsional)
  if (item.end_date && payload.effective_date && item.end_date < payload.effective_date) {
    errors[key("end_date")] = ["TMT Selesai tidak boleh lebih awal dari TMT Berlaku"];
  }

  return errors;
}
