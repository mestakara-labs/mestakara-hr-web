/**
 * DATA CONTOH (MOCK) USULAN PENONAKTIFAN KARYAWAN — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/employee-terminations/**:
 *
 *   GET    /employee-terminations                   daftar usulan
 *   POST   /employee-terminations                   buat usulan (multipart)
 *   POST   /employee-terminations/preview           Pratinjau Dampak (JSON, tanpa menyimpan)
 *   GET    /employee-terminations/{id}              detail usulan
 *   PUT    /employee-terminations/{id}              ubah usulan Draf (multipart)
 *   DELETE /employee-terminations/{id}              hapus usulan Draf
 *   POST   /employee-terminations/{id}/documents    ganti dokumen (usulan Berlaku)
 *   POST   /employee-terminations/{id}/cancel       batalkan usulan Berlaku (alasan wajib)
 *   GET    /employee-terminations/{id}/files        buka file dokumen (?item= untuk per orang)
 *
 * Form dikirim sebagai `multipart/form-data` dengan bentuk yang sama seperti Penambahan:
 *   - isian teks: document_scope, notes, document_* + signer_* (dokumen kolektif)
 *   - items: daftar karyawan (teks JSON), termasuk dokumen per orang
 *   - action: "draft" (Simpan sebagai Draf) atau "submit" (Simpan & Berlakukan)
 *   - file document_file (kolektif) / document_file_<id item> (per orang); keep_document_file = "1"
 */
import {
  ACTIVATION_STATUS,
  DOCUMENT_SCOPE,
  DOCUMENT_SCOPES,
  EMPLOYEE_ACTIVE_STATUS,
} from "@/lib/activation-rules";
import { formatDate } from "@/lib/date";
import {
  isTerminationEditable,
  requiresDestinationUnit,
  requiresTerminationReason,
  TERMINATION_TYPES,
} from "@/lib/termination-rules";
import { isTransferEditable } from "@/lib/transfer-rules";
import type {
  TerminationItemPayload,
  TerminationPayload,
  TerminationPreviewPayload,
  TerminationPreviewResource,
  TerminationResource,
} from "@/types/api/employee-termination";

import { failure, success, type MockResult } from "./mock-response";
import { EMPTY_DOCUMENT } from "./organization/activations";
import type { TerminationItemRecord, TerminationRecord } from "./organization/terminations";
import { createId, getEmployeeActiveStatus, getStore } from "./organization-store";
import {
  clearDocument,
  fileOf,
  readDocumentValues,
  readFiles,
  saveDocument,
  storedDocumentFile,
  validateDocument,
  validateFileOnly,
  type SentFile,
  type SentFiles,
} from "./status-document-mock";
import { applyTermination, revertTermination, toPlannedImpacts } from "./termination-apply";
import { toTerminationResource } from "./termination-resource";
import type { GeneratedDocument } from "./transfer-documents";

type Errors = Record<string, string[]>;

/** "draft" = Simpan sebagai Draf (pemeriksaan ringan); "submit" = Simpan & Berlakukan (lengkap). */
type SaveAction = "draft" | "submit";

/** Tanggal yang sangat jauh: status pada tanggal ini = status setelah semua usulan Berlaku tiba. */
const FAR_FUTURE = "9999-12-31";

// ---------------------------------------------------------------------------
// Membaca
// ---------------------------------------------------------------------------

/** Pengganti backend `GET /employee-terminations`. Terbaru di atas. */
export function mockListTerminations(): MockResult<TerminationResource[]> {
  const terminations = [...getStore().terminations].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return success("Daftar usulan penonaktifan karyawan", terminations.map(toTerminationResource));
}

/** Pengganti backend `GET /employee-terminations/{id}`. */
export function mockGetTermination(id: string): MockResult<TerminationResource | null> {
  const termination = findTermination(id);
  if (!termination) return failure(404, "Usulan penonaktifan tidak ditemukan.");

  return success("Detail usulan penonaktifan", toTerminationResource(termination));
}

/** Pengganti backend `POST /employee-terminations/preview`: PRATINJAU DAMPAK, tanpa menyimpan. */
export function mockPreviewTermination(payload: Partial<TerminationPreviewPayload>): MockResult<TerminationPreviewResource> {
  const items = (payload.items ?? []).map((item) => ({
    id: String(item.id ?? ""),
    employee_id: String(item.employee_id ?? ""),
    effective_date: String(item.effective_date ?? ""),
  }));
  return success("Pratinjau dampak penonaktifan", toPlannedImpacts(items));
}

// ---------------------------------------------------------------------------
// Menyimpan
// ---------------------------------------------------------------------------

/** Pengganti backend `POST /employee-terminations`. */
export async function mockCreateTermination(
  form: FormData,
  userName: string,
): Promise<MockResult<TerminationResource | null>> {
  const { payload, action } = readForm(form);
  const files = readFiles(form, payload.items, null);

  const errors = validateTermination(payload, action, null, files);
  if (errors) return failure(422, "Isian usulan penonaktifan belum benar.", errors);

  const termination: TerminationRecord = {
    ...EMPTY_DOCUMENT,
    id: createId("penonaktifan"),
    status: ACTIVATION_STATUS.draft,
    document_scope: payload.document_scope || DOCUMENT_SCOPE.collective,
    notes: payload.notes || null,
    items: [],
    supervisor_change_ids: [],
    created_at: new Date().toISOString(),
    created_by: userName,
    activated_at: null,
    cancelled_at: null,
    cancelled_by: null,
    cancel_reason: null,
  };
  getStore().terminations.push(termination);

  await saveContent(termination, payload, files);
  if (action === "submit") applyTermination(termination, userName);

  return success(saveMessage(termination), toTerminationResource(termination), 201);
}

/** Pengganti backend `PUT /employee-terminations/{id}`. Hanya usulan Draf. */
export async function mockUpdateTermination(
  id: string,
  form: FormData,
  userName: string,
): Promise<MockResult<TerminationResource | null>> {
  const termination = findTermination(id);
  if (!termination) return failure(404, "Usulan penonaktifan tidak ditemukan.");
  if (!isTerminationEditable(termination.status)) {
    return failure(409, `Usulan berstatus ${termination.status} tidak bisa diubah. Ganti dokumen atau batalkan dari halaman detail.`);
  }

  const { payload, action } = readForm(form);
  const files = readFiles(form, payload.items, termination);

  const errors = validateTermination(payload, action, id, files);
  if (errors) return failure(422, "Isian usulan penonaktifan belum benar.", errors);

  await saveContent(termination, payload, files);
  if (action === "submit") applyTermination(termination, userName);

  return success(saveMessage(termination), toTerminationResource(termination));
}

/** Pengganti backend `DELETE /employee-terminations/{id}`. Hanya Draf. */
export function mockDeleteTermination(id: string): MockResult<null> {
  const store = getStore();
  const termination = findTermination(id);
  if (!termination) return failure(404, "Usulan penonaktifan tidak ditemukan.");
  if (termination.status !== ACTIVATION_STATUS.draft) {
    return failure(409, "Hanya usulan berstatus Draf yang bisa dihapus. Usulan Berlaku dibatalkan.");
  }

  store.terminations = store.terminations.filter((item) => item.id !== id);
  return success("Draf usulan penonaktifan berhasil dihapus.", null);
}

/**
 * Pengganti backend `POST /employee-terminations/{id}/documents`: ganti SATU dokumen usulan
 * yang sudah Berlaku. `item_id` kosong = dokumen kolektif; diisi = dokumen per orang.
 */
export async function mockSaveTerminationDocument(
  id: string,
  form: FormData,
): Promise<MockResult<TerminationResource | null>> {
  const termination = findTermination(id);
  if (!termination) return failure(404, "Usulan penonaktifan tidak ditemukan.");
  if (termination.status !== ACTIVATION_STATUS.effective) {
    return failure(409, "Dokumen dari halaman detail hanya untuk usulan Berlaku. Usulan Draf diubah lewat wizard.");
  }

  const itemId = String(form.get("item_id") ?? "");
  const item = termination.items.find((entry) => entry.id === itemId);
  if (itemId && !item) return failure(404, "Karyawan tidak ditemukan di usulan ini.");
  const target = item ?? termination;

  const values = readDocumentValues((key) => String(form.get(key) ?? "").trim());
  const newFile = fileOf(form, "document_file");
  const file: SentFile = newFile ?? (form.get("keep_document_file") === "1" && target.document_file ? "lama" : null);

  const errors: Errors = {};
  validateDocument(values, file, errors, "", true);
  if (Object.keys(errors).length > 0) return failure(422, "Isian dokumen belum benar.", errors);

  await saveDocument(target, values, file);
  return success("Dokumen berhasil disimpan.", toTerminationResource(termination));
}

/**
 * Pengganti backend `POST /employee-terminations/{id}/cancel`: batalkan usulan BERLAKU.
 * Jabatan, keanggotaan regu, dan atasan bawahan dikembalikan. Alasan wajib.
 */
export function mockCancelTermination(
  id: string,
  payload: { reason?: string },
  userName: string,
): MockResult<TerminationResource | null> {
  const termination = findTermination(id);
  if (!termination) return failure(404, "Usulan penonaktifan tidak ditemukan.");
  if (termination.status === ACTIVATION_STATUS.draft) {
    return failure(409, "Usulan berstatus Draf tidak perlu dibatalkan. Hapus saja drafnya.");
  }
  if (termination.status === ACTIVATION_STATUS.cancelled) return failure(409, "Usulan ini sudah dibatalkan.");

  const reason = (payload.reason ?? "").trim();
  if (!reason) return failure(422, "Alasan pembatalan wajib diisi.", { reason: ["Alasan Pembatalan wajib diisi"] });

  const blockedReason = revertTermination(termination, userName, reason);
  if (blockedReason) return failure(409, blockedReason);

  termination.status = ACTIVATION_STATUS.cancelled;
  termination.cancelled_at = new Date().toISOString();
  termination.cancelled_by = userName;
  termination.cancel_reason = reason;

  return success("Usulan penonaktifan berhasil dibatalkan. Karyawannya kembali Aktif.", toTerminationResource(termination));
}

/** Pengganti backend `GET /employee-terminations/{id}/files?item=`. null = file tidak ada. */
export function mockGetTerminationFile(id: string, itemId: string | null): GeneratedDocument | null {
  const termination = findTermination(id);
  if (!termination) return null;

  if (!itemId) return storedDocumentFile(termination);
  const item = termination.items.find((entry) => entry.id === itemId);
  return item ? storedDocumentFile(item) : null;
}

// ---------------------------------------------------------------------------
// Alat bantu: membaca form & menyimpan
// ---------------------------------------------------------------------------

function findTermination(id: string): TerminationRecord | undefined {
  return getStore().terminations.find((item) => item.id === id);
}

/** Ambil isian dari FormData. Isian yang tidak dikirim dianggap kosong. */
function readForm(form: FormData): { payload: TerminationPayload; action: SaveAction } {
  const text = (key: string) => String(form.get(key) ?? "").trim();

  let rawItems: Record<string, unknown>[] = [];
  try {
    const parsed: unknown = JSON.parse(text("items") || "[]");
    if (Array.isArray(parsed)) rawItems = parsed as Record<string, unknown>[];
  } catch {
    rawItems = [];
  }

  const items = rawItems.map((raw): TerminationItemPayload => {
    const itemText = (key: string) => String(raw[key] ?? "").trim();
    return {
      ...readDocumentValues(itemText),
      id: itemText("id"),
      employee_id: itemText("employee_id"),
      type: itemText("type"),
      effective_date: itemText("effective_date"),
      reason: itemText("reason"),
      destination_unit: itemText("destination_unit"),
      notes: itemText("notes"),
      keep_document_file: Boolean(raw.keep_document_file),
    };
  });

  return {
    action: text("action") === "submit" ? "submit" : "draft",
    payload: { ...readDocumentValues(text), document_scope: text("document_scope"), notes: text("notes"), items },
  };
}

/** Simpan isi usulan (dokumen kolektif + item) dari isian yang sudah diperiksa. */
async function saveContent(termination: TerminationRecord, payload: TerminationPayload, files: SentFiles) {
  termination.document_scope = payload.document_scope || DOCUMENT_SCOPE.collective;
  termination.notes = payload.notes || null;
  const isCollective = termination.document_scope === DOCUMENT_SCOPE.collective;

  if (isCollective) await saveDocument(termination, payload, files.collective);
  else clearDocument(termination);

  const previous = termination.items;
  termination.items = [];
  for (const item of payload.items) {
    const old = previous.find((entry) => entry.id === item.id);
    const record: TerminationItemRecord = {
      ...(old ?? EMPTY_DOCUMENT),
      // Baris baru dari browser ("baru-...") diberi id tetap.
      id: old ? old.id : createId("penonaktifan-item"),
      employee_id: item.employee_id,
      type: item.type,
      effective_date: item.effective_date,
      reason: item.reason || null,
      destination_unit: requiresDestinationUnit(item.type) ? item.destination_unit || null : null,
      notes: item.notes || null,
      ended_assignments: [],
      ended_memberships: [],
    };

    if (isCollective) clearDocument(record);
    else await saveDocument(record, item, files.perItem.get(item.id) ?? null);
    termination.items.push(record);
  }
}

/** Pesan sukses sesuai status akhir usulan. */
function saveMessage(termination: TerminationRecord): string {
  if (termination.status === ACTIVATION_STATUS.draft) return "Draf usulan penonaktifan berhasil disimpan.";
  return `Usulan penonaktifan berlaku: ${termination.items.length} karyawan nonaktif mulai TMT masing-masing.`;
}

// ---------------------------------------------------------------------------
// Pemeriksaan isian
// ---------------------------------------------------------------------------

/**
 * Periksa isian usulan. Hasilnya pesan error per isian, atau null kalau semua benar.
 * Error per karyawan memakai nama isian "items.<id item>.<isian>".
 *   - Draf   : karyawan valid & tidak dobel, file yang dikirim benar
 *   - Submit : semua aturan (karyawan Aktif, jenis, TMT, alasan / unit tujuan, dokumen WAJIB)
 */
function validateTermination(
  payload: TerminationPayload,
  action: SaveAction,
  currentId: string | null,
  files: SentFiles,
): Errors | null {
  const errors: Errors = {};
  const isSubmit = action === "submit";
  const scope = payload.document_scope || DOCUMENT_SCOPE.collective;

  if (!DOCUMENT_SCOPES.includes(scope)) errors.document_scope = ["Pilihan dokumen tidak dikenal"];
  if (isSubmit && payload.items.length === 0) errors.items = ["Pilih minimal satu karyawan"];

  // Dokumen kolektif WAJIB saat submit. Draf: hanya file yang diperiksa.
  if (scope === DOCUMENT_SCOPE.collective) {
    if (isSubmit) validateDocument(payload, files.collective, errors, "", true);
    else validateFileOnly(files.collective, "document_file", errors);
  }

  const employeeIds = payload.items.map((item) => item.employee_id);
  for (const item of payload.items) {
    const prefix = `items.${item.id}.`;
    const key = (field: string) => `${prefix}${field}`;

    if (employeeIds.filter((id) => id === item.employee_id).length > 1) {
      errors[key("employee_id")] = ["Karyawan ini ada lebih dari sekali di usulan"];
      continue;
    }
    const employeeError = checkEmployee(item.employee_id, currentId, isSubmit);
    if (employeeError) {
      errors[key("employee_id")] = [employeeError];
      continue;
    }

    const file = files.perItem.get(item.id) ?? null;
    if (!isSubmit) {
      if (scope === DOCUMENT_SCOPE.perPerson) validateFileOnly(file, key("document_file"), errors);
      continue;
    }

    Object.assign(errors, validateItem(item, key));
    if (scope === DOCUMENT_SCOPE.perPerson) validateDocument(item, file, errors, prefix, true);
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Karyawan harus ada, tidak sedang di usulan lain yang belum selesai (Penonaktifan / Penambahan
 * Draf, Mutasi Draf / Menunggu Dokumen), dan (saat submit) sedang Aktif & belum terjadwal nonaktif.
 */
function checkEmployee(employeeId: string, currentId: string | null, isSubmit: boolean): string | null {
  const { activations, employees, terminations, transfers } = getStore();
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) return "Karyawan tidak ditemukan";

  const inDraft = (usulan: { id: string; status: string; items: { employee_id: string }[] }[]) =>
    usulan.some(
      (entry) =>
        entry.id !== currentId &&
        entry.status === ACTIVATION_STATUS.draft &&
        entry.items.some((item) => item.employee_id === employeeId),
    );
  if (inDraft(terminations)) return `${employee.name} sedang ada di usulan Penonaktifan lain (Draf)`;
  if (inDraft(activations)) return `${employee.name} sedang ada di usulan Penambahan (Draf)`;

  const openTransfer = transfers.find(
    (transfer) => isTransferEditable(transfer.status) && transfer.items.some((item) => item.employee_id === employeeId),
  );
  if (openTransfer) return `${employee.name} sedang ada di usulan Mutasi ${openTransfer.type} (${openTransfer.status})`;

  if (!isSubmit) return null;

  if (getEmployeeActiveStatus(employeeId) !== EMPLOYEE_ACTIVE_STATUS.active) {
    return `${employee.name} tidak sedang Aktif`;
  }
  if (getEmployeeActiveStatus(employeeId, FAR_FUTURE) === EMPLOYEE_ACTIVE_STATUS.inactive) {
    return `${employee.name} sudah terjadwal nonaktif lewat usulan Penonaktifan lain`;
  }
  return null;
}

/** TMT aktif TERAKHIR karyawan (usulan Penambahan Berlaku). "" kalau tidak ada. */
function lastActivationDate(employeeId: string): string {
  return getStore()
    .activations.filter((activation) => activation.status === ACTIVATION_STATUS.effective)
    .flatMap((activation) => activation.items)
    .filter((item) => item.employee_id === employeeId)
    .reduce((latest, item) => (item.effective_date > latest ? item.effective_date : latest), "");
}

/** Pemeriksaan lengkap satu karyawan: jenis, TMT, alasan, dan unit tujuan. */
function validateItem(item: TerminationItemPayload, key: (field: string) => string): Errors {
  const errors: Errors = {};

  if (!item.type) errors[key("type")] = ["Pilih Jenis Penonaktifan"];
  else if (!TERMINATION_TYPES.includes(item.type)) errors[key("type")] = ["Jenis Penonaktifan tidak dikenal"];

  const activeSince = lastActivationDate(item.employee_id);
  if (!item.effective_date) errors[key("effective_date")] = ["Pilih TMT Nonaktif"];
  else if (activeSince && item.effective_date <= activeSince) {
    errors[key("effective_date")] = ["TMT Nonaktif harus setelah TMT Aktif karyawan"];
  } else {
    // Jabatan yang baru akan dimulai pada / setelah TMT tidak bisa diakhiri.
    const laterAssignment = getStore().assignments.find(
      (assignment) => assignment.employee_id === item.employee_id && assignment.start_date >= item.effective_date,
    );
    if (laterAssignment) {
      errors[key("effective_date")] = [`Karyawan punya jabatan yang baru mulai ${formatDate(laterAssignment.start_date)}. Pilih TMT setelahnya.`];
    }
  }

  if (requiresTerminationReason(item.type) && !item.reason) errors[key("reason")] = ["Alasan wajib diisi"];
  if (requiresDestinationUnit(item.type) && !item.destination_unit) errors[key("destination_unit")] = ["Unit Tujuan wajib diisi"];

  return errors;
}
