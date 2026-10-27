/**
 * DATA CONTOH (MOCK) USULAN PENAMBAHAN KARYAWAN — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/employee-activations/**:
 *
 *   GET    /employee-activations                   daftar usulan
 *   POST   /employee-activations                   buat usulan (multipart)
 *   GET    /employee-activations/{id}              detail usulan
 *   PUT    /employee-activations/{id}              ubah usulan Draf (multipart)
 *   DELETE /employee-activations/{id}              hapus usulan Draf
 *   POST   /employee-activations/{id}/documents    unggah / ganti dokumen (usulan Berlaku)
 *   POST   /employee-activations/{id}/cancel       batalkan usulan Berlaku (alasan wajib)
 *   GET    /employee-activations/{id}/files        buka file dokumen (?item= untuk per orang)
 *
 * Riwayat status kepegawaian per karyawan ada di status-history-mock.ts.
 *
 * Form dikirim sebagai `multipart/form-data`:
 *   - isian teks: document_scope, notes, document_* + signer_* (dokumen kolektif)
 *   - items: daftar karyawan (teks JSON), termasuk dokumen per orang & rencana penempatan
 *   - action: "draft" (Simpan sebagai Draf) atau "submit" (Simpan & Berlakukan)
 *   - file document_file (kolektif) / document_file_<id item> (per orang); keep_document_file = "1"
 */
import {
  ACTIVATION_STATUS,
  ACTIVATION_TYPE,
  allowedActivationTypes,
  DOCUMENT_SCOPE,
  DOCUMENT_SCOPES,
  EMPLOYEE_ACTIVE_STATUS,
  isActivationEditable,
} from "@/lib/activation-rules";
import {
  ASSIGNMENT_STATUSES,
  canBeSupervisor,
  isAssignmentActive,
  needsSupervisor,
} from "@/lib/assignment-rules";
import { formatDate, toDateText } from "@/lib/date";
import { findMissingEmployeeFields } from "@/lib/employee-rules";
import { isTransferEditable } from "@/lib/transfer-rules";
import type {
  ActivationItemPayload,
  ActivationPayload,
  ActivationResource,
} from "@/types/api/employee-activation";

import { applyActivation, revertActivation } from "./activation-apply";
import { toActivationResource } from "./activation-resource";
import { failure, success, type MockResult } from "./mock-response";
import { EMPTY_DOCUMENT, type ActivationItemRecord, type ActivationRecord } from "./organization/activations";
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
import type { GeneratedDocument } from "./transfer-documents";

type Errors = Record<string, string[]>;

/** "draft" = Simpan sebagai Draf (pemeriksaan ringan); "submit" = Simpan & Berlakukan (lengkap). */
type SaveAction = "draft" | "submit";

// ---------------------------------------------------------------------------
// Membaca
// ---------------------------------------------------------------------------

/** Pengganti backend `GET /employee-activations`. Terbaru di atas. */
export function mockListActivations(): MockResult<ActivationResource[]> {
  const activations = [...getStore().activations].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return success("Daftar usulan penambahan karyawan", activations.map(toActivationResource));
}

/** Pengganti backend `GET /employee-activations/{id}`. */
export function mockGetActivation(id: string): MockResult<ActivationResource | null> {
  const activation = findActivation(id);
  if (!activation) return failure(404, "Usulan penambahan tidak ditemukan.");

  return success("Detail usulan penambahan", toActivationResource(activation));
}

// ---------------------------------------------------------------------------
// Menyimpan
// ---------------------------------------------------------------------------

/** Pengganti backend `POST /employee-activations`. */
export async function mockCreateActivation(
  form: FormData,
  userName: string,
): Promise<MockResult<ActivationResource | null>> {
  const { payload, action } = readForm(form);
  const files = readFiles(form, payload.items, null);

  const errors = validateActivation(payload, action, null, files);
  if (errors) return failure(422, "Isian usulan penambahan belum benar.", errors);

  const activation: ActivationRecord = {
    ...EMPTY_DOCUMENT,
    id: createId("penambahan"),
    status: ACTIVATION_STATUS.draft,
    document_scope: payload.document_scope || DOCUMENT_SCOPE.collective,
    notes: payload.notes || null,
    items: [],
    created_at: new Date().toISOString(),
    created_by: userName,
    activated_at: null,
    cancelled_at: null,
    cancelled_by: null,
    cancel_reason: null,
  };
  getStore().activations.push(activation);

  await saveContent(activation, payload, files);
  if (action === "submit") applyActivation(activation);

  return success(saveMessage(activation), toActivationResource(activation), 201);
}

/** Pengganti backend `PUT /employee-activations/{id}`. Hanya usulan Draf. */
export async function mockUpdateActivation(
  id: string,
  form: FormData,
): Promise<MockResult<ActivationResource | null>> {
  const activation = findActivation(id);
  if (!activation) return failure(404, "Usulan penambahan tidak ditemukan.");
  if (!isActivationEditable(activation.status)) {
    return failure(409, `Usulan berstatus ${activation.status} tidak bisa diubah. Unggah dokumen atau batalkan dari halaman detail.`);
  }

  const { payload, action } = readForm(form);
  const files = readFiles(form, payload.items, activation);

  const errors = validateActivation(payload, action, id, files);
  if (errors) return failure(422, "Isian usulan penambahan belum benar.", errors);

  await saveContent(activation, payload, files);
  if (action === "submit") applyActivation(activation);

  return success(saveMessage(activation), toActivationResource(activation));
}

/** Pengganti backend `DELETE /employee-activations/{id}`. Hanya Draf; draf karyawannya tetap ada (Belum Aktif). */
export function mockDeleteActivation(id: string): MockResult<null> {
  const store = getStore();
  const activation = findActivation(id);
  if (!activation) return failure(404, "Usulan penambahan tidak ditemukan.");
  if (activation.status !== ACTIVATION_STATUS.draft) {
    return failure(409, "Hanya usulan berstatus Draf yang bisa dihapus. Usulan Berlaku dibatalkan.");
  }

  store.activations = store.activations.filter((item) => item.id !== id);
  return success("Draf usulan penambahan berhasil dihapus. Draf karyawannya tetap tersimpan (Belum Aktif).", null);
}

/**
 * Pengganti backend `POST /employee-activations/{id}/documents`: unggah / ganti SATU dokumen
 * usulan yang sudah Berlaku. `item_id` kosong = dokumen kolektif; diisi = dokumen per orang.
 * Dokumen dasar penugasan yang dibuat usulan ini ikut diperbarui.
 */
export async function mockSaveActivationDocument(
  id: string,
  form: FormData,
): Promise<MockResult<ActivationResource | null>> {
  const activation = findActivation(id);
  if (!activation) return failure(404, "Usulan penambahan tidak ditemukan.");
  if (activation.status !== ACTIVATION_STATUS.effective) {
    return failure(409, "Dokumen dari halaman detail hanya untuk usulan Berlaku. Usulan Draf diubah lewat wizard.");
  }

  const itemId = String(form.get("item_id") ?? "");
  const item = activation.items.find((entry) => entry.id === itemId);
  if (itemId && !item) return failure(404, "Karyawan tidak ditemukan di usulan ini.");
  const target = item ?? activation;

  const values = readDocumentValues((key) => String(form.get(key) ?? "").trim());
  const newFile = fileOf(form, "document_file");
  const file: SentFile = newFile ?? (form.get("keep_document_file") === "1" && target.document_file ? "lama" : null);

  const errors: Errors = {};
  validateDocument(values, file, errors, "", true);
  if (Object.keys(errors).length > 0) return failure(422, "Isian dokumen belum benar.", errors);

  await saveDocument(target, values, file);

  // Penugasan yang dibuat usulan ini memakai dokumen yang sama.
  const affected = item ? [item] : activation.items;
  for (const entry of affected) {
    const assignment = getStore().assignments.find((candidate) => candidate.id === entry.new_assignment_id);
    if (!assignment) continue;
    Object.assign(assignment, {
      decree_type: target.document_type,
      decree_number: target.document_number,
      decree_date: target.document_date,
      decree_file: target.document_file,
      decree_file_data: target.document_file_data,
    });
  }

  return success("Dokumen berhasil disimpan.", toActivationResource(activation));
}

/**
 * Pengganti backend `POST /employee-activations/{id}/cancel`: batalkan usulan BERLAKU.
 * Semua perubahannya dikembalikan (penugasan yang dibuat dihapus). Alasan wajib.
 */
export function mockCancelActivation(
  id: string,
  payload: { reason?: string },
  userName: string,
): MockResult<ActivationResource | null> {
  const activation = findActivation(id);
  if (!activation) return failure(404, "Usulan penambahan tidak ditemukan.");
  if (activation.status === ACTIVATION_STATUS.draft) {
    return failure(409, "Usulan berstatus Draf tidak perlu dibatalkan. Hapus saja drafnya.");
  }
  if (activation.status === ACTIVATION_STATUS.cancelled) return failure(409, "Usulan ini sudah dibatalkan.");

  const reason = (payload.reason ?? "").trim();
  if (!reason) return failure(422, "Alasan pembatalan wajib diisi.", { reason: ["Alasan Pembatalan wajib diisi"] });

  const blockedReason = revertActivation(activation);
  if (blockedReason) return failure(409, blockedReason);

  activation.status = ACTIVATION_STATUS.cancelled;
  activation.cancelled_at = new Date().toISOString();
  activation.cancelled_by = userName;
  activation.cancel_reason = reason;

  return success("Usulan penambahan berhasil dibatalkan.", toActivationResource(activation));
}

/** Pengganti backend `GET /employee-activations/{id}/files?item=`. null = file tidak ada. */
export function mockGetActivationFile(id: string, itemId: string | null): GeneratedDocument | null {
  const activation = findActivation(id);
  if (!activation) return null;

  if (!itemId) return storedDocumentFile(activation);
  const item = activation.items.find((entry) => entry.id === itemId);
  return item ? storedDocumentFile(item) : null;
}

// ---------------------------------------------------------------------------
// Alat bantu: membaca form & menyimpan
// ---------------------------------------------------------------------------

function findActivation(id: string): ActivationRecord | undefined {
  return getStore().activations.find((item) => item.id === id);
}

/** Ambil isian dari FormData. Isian yang tidak dikirim dianggap kosong. */
function readForm(form: FormData): { payload: ActivationPayload; action: SaveAction } {
  const text = (key: string) => String(form.get(key) ?? "").trim();

  let rawItems: Record<string, unknown>[] = [];
  try {
    const parsed: unknown = JSON.parse(text("items") || "[]");
    if (Array.isArray(parsed)) rawItems = parsed as Record<string, unknown>[];
  } catch {
    rawItems = [];
  }

  const items = rawItems.map((raw): ActivationItemPayload => {
    const itemText = (key: string) => String(raw[key] ?? "").trim();
    const list = (key: string) => (Array.isArray(raw[key]) ? (raw[key] as unknown[]).map(String) : []);
    return {
      ...readDocumentValues(itemText),
      id: itemText("id"),
      employee_id: itemText("employee_id"),
      type: itemText("type"),
      effective_date: itemText("effective_date"),
      origin_unit: itemText("origin_unit"),
      notes: itemText("notes"),
      keep_document_file: Boolean(raw.keep_document_file),
      has_placement: Boolean(raw.has_placement),
      position_id: itemText("position_id"),
      assignment_status: itemText("assignment_status"),
      sub_unit_id: itemText("sub_unit_id"),
      placement_object_ids: list("placement_object_ids"),
      supervisor_assignment_ids: list("supervisor_assignment_ids"),
      end_date: itemText("end_date"),
    };
  });

  return {
    action: text("action") === "submit" ? "submit" : "draft",
    payload: {
      ...readDocumentValues(text),
      document_scope: text("document_scope"),
      notes: text("notes"),
      items,
    },
  };
}

/** Simpan isi usulan (dokumen kolektif + item) dari isian yang sudah diperiksa. */
async function saveContent(activation: ActivationRecord, payload: ActivationPayload, files: SentFiles) {
  activation.document_scope = payload.document_scope || DOCUMENT_SCOPE.collective;
  activation.notes = payload.notes || null;
  const isCollective = activation.document_scope === DOCUMENT_SCOPE.collective;

  if (isCollective) await saveDocument(activation, payload, files.collective);
  else clearDocument(activation);

  const previous = activation.items;
  activation.items = [];
  for (const item of payload.items) {
    const old = previous.find((entry) => entry.id === item.id);
    const record: ActivationItemRecord = {
      ...(old ?? EMPTY_DOCUMENT),
      // Baris baru dari browser ("baru-...") diberi id tetap.
      id: old ? old.id : createId("penambahan-item"),
      employee_id: item.employee_id,
      type: item.type,
      effective_date: item.effective_date,
      origin_unit: item.type === ACTIVATION_TYPE.transferIn ? item.origin_unit || null : null,
      position_id: item.has_placement ? item.position_id || null : null,
      assignment_status: item.has_placement ? item.assignment_status || null : null,
      sub_unit_id: item.has_placement ? item.sub_unit_id || null : null,
      placement_object_ids: item.has_placement ? item.placement_object_ids : [],
      supervisor_assignment_ids: item.has_placement ? item.supervisor_assignment_ids : [],
      assignment_end_date: item.has_placement ? item.end_date || null : null,
      new_assignment_id: null,
      notes: item.notes || null,
    };

    if (isCollective) clearDocument(record);
    else await saveDocument(record, item, files.perItem.get(item.id) ?? null);
    activation.items.push(record);
  }
}

/** Pesan sukses sesuai status akhir usulan. */
function saveMessage(activation: ActivationRecord): string {
  if (activation.status === ACTIVATION_STATUS.draft) return "Draf usulan penambahan berhasil disimpan.";
  return `Usulan penambahan berlaku: ${activation.items.length} karyawan aktif mulai TMT masing-masing.`;
}

// ---------------------------------------------------------------------------
// Pemeriksaan isian
// ---------------------------------------------------------------------------

/**
 * Periksa isian usulan. Hasilnya pesan error per isian, atau null kalau semua benar.
 * Error per karyawan memakai nama isian "items.<id item>.<isian>".
 *   - Draf   : karyawan valid & tidak dobel, file yang dikirim benar
 *   - Submit : semua aturan (data karyawan lengkap, dasar, TMT, dokumen, penempatan)
 */
function validateActivation(
  payload: ActivationPayload,
  action: SaveAction,
  currentId: string | null,
  files: SentFiles,
): Errors | null {
  const errors: Errors = {};
  const isSubmit = action === "submit";
  const scope = payload.document_scope || DOCUMENT_SCOPE.collective;

  if (!DOCUMENT_SCOPES.includes(scope)) errors.document_scope = ["Pilihan dokumen tidak dikenal"];
  if (isSubmit && payload.items.length === 0) errors.items = ["Tambahkan minimal satu karyawan"];

  // Dokumen kolektif (opsional). Draf: hanya file yang diperiksa.
  if (scope === DOCUMENT_SCOPE.collective) {
    if (isSubmit) validateDocument(payload, files.collective, errors);
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
    if (scope === DOCUMENT_SCOPE.perPerson) validateDocument(item, file, errors, prefix);
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Karyawan harus ada, tidak sedang di usulan lain yang belum selesai (Penambahan / Penonaktifan
 * Draf, Mutasi Draf / Menunggu Dokumen), dan (saat submit) belum aktif / belum terjadwal aktif.
 */
function checkEmployee(employeeId: string, currentId: string | null, isSubmit: boolean): string | null {
  const { activations, employees, terminations, transfers } = getStore();
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) return "Karyawan tidak ditemukan";

  const otherDraft = activations.find(
    (activation) =>
      activation.id !== currentId &&
      activation.status === ACTIVATION_STATUS.draft &&
      activation.items.some((item) => item.employee_id === employeeId),
  );
  if (otherDraft) return `${employee.name} sedang ada di usulan Penambahan lain (Draf)`;

  const draftTermination = terminations.some(
    (termination) =>
      termination.status === ACTIVATION_STATUS.draft && termination.items.some((item) => item.employee_id === employeeId),
  );
  if (draftTermination) return `${employee.name} sedang ada di usulan Penonaktifan (Draf)`;

  const openTransfer = transfers.find(
    (transfer) => isTransferEditable(transfer.status) && transfer.items.some((item) => item.employee_id === employeeId),
  );
  if (openTransfer) return `${employee.name} sedang ada di usulan Mutasi ${openTransfer.type} (${openTransfer.status})`;

  if (!isSubmit) return null;

  if (getEmployeeActiveStatus(employeeId) === EMPLOYEE_ACTIVE_STATUS.active) return `${employee.name} sudah aktif`;
  // Usulan Berlaku lain yang TMT-nya belum tiba (karyawan Nonaktif boleh punya usulan lama yang sudah lewat).
  const today = toDateText(new Date());
  const scheduled = activations.some(
    (activation) =>
      activation.id !== currentId &&
      activation.status === ACTIVATION_STATUS.effective &&
      activation.items.some((item) => item.employee_id === employeeId && item.effective_date > today),
  );
  if (scheduled) return `${employee.name} sudah terjadwal aktif lewat usulan Penambahan lain`;

  const missing = findMissingEmployeeFields(employee);
  if (missing.length > 0) return `Data ${employee.name} belum lengkap: ${missing.join(", ")}`;

  return null;
}

/** Pemeriksaan lengkap satu karyawan: dasar penambahan, TMT, dan rencana penempatan. */
function validateItem(item: ActivationItemPayload, key: (field: string) => string): Errors {
  const errors: Errors = {};
  const employee = getStore().employees.find((entry) => entry.id === item.employee_id);
  const allowedTypes = allowedActivationTypes(getEmployeeActiveStatus(item.employee_id));

  if (!item.type) errors[key("type")] = ["Pilih Dasar Penambahan"];
  else if (!allowedTypes.includes(item.type)) errors[key("type")] = [`Pilih ${allowedTypes.join(" atau ")}`];

  const inactiveSince = lastTerminationDate(item.employee_id);
  if (!item.effective_date) errors[key("effective_date")] = ["Pilih TMT Aktif"];
  else if (employee?.hire_date && item.effective_date < employee.hire_date) {
    errors[key("effective_date")] = ["TMT Aktif tidak boleh sebelum Tanggal Masuk karyawan"];
  } else if (inactiveSince && item.effective_date <= inactiveSince) {
    errors[key("effective_date")] = [`TMT Aktif harus setelah TMT nonaktif terakhir (${formatDate(inactiveSince)})`];
  }

  if (item.type === ACTIVATION_TYPE.transferIn && !item.origin_unit) errors[key("origin_unit")] = ["Unit Asal wajib diisi"];

  if (item.has_placement) Object.assign(errors, validatePlacement(item, key));
  return errors;
}

/** TMT nonaktif TERAKHIR karyawan (usulan Penonaktifan Berlaku). "" kalau belum pernah nonaktif. */
function lastTerminationDate(employeeId: string): string {
  return getStore()
    .terminations.filter((termination) => termination.status === ACTIVATION_STATUS.effective)
    .flatMap((termination) => termination.items)
    .filter((item) => item.employee_id === employeeId)
    .reduce((latest, item) => (item.effective_date > latest ? item.effective_date : latest), "");
}

/** Rencana penempatan (kalau diisi): aturannya sama dengan penugasan jabatan di Mutasi. */
function validatePlacement(item: ActivationItemPayload, key: (field: string) => string): Errors {
  const { assignments, placementObjects, positions, subUnits } = getStore();
  const errors: Errors = {};

  const position = positions.find((entry) => entry.id === item.position_id);
  if (!item.position_id) errors[key("position_id")] = ["Pilih Jabatan"];
  else if (!position) errors[key("position_id")] = ["Jabatan tidak ditemukan"];

  if (!item.assignment_status) errors[key("assignment_status")] = ["Pilih Status Jabatan"];
  else if (!ASSIGNMENT_STATUSES.includes(item.assignment_status)) errors[key("assignment_status")] = ["Status Jabatan tidak dikenal"];

  if (!item.sub_unit_id) errors[key("sub_unit_id")] = ["Pilih Sub Unit"];
  else if (!subUnits.some((entry) => entry.id === item.sub_unit_id)) errors[key("sub_unit_id")] = ["Sub unit tidak ditemukan"];

  for (const objectId of item.placement_object_ids) {
    const placementObject = placementObjects.find((entry) => entry.id === objectId);
    if (!placementObject) errors[key("placement_object_ids")] = ["Objek penempatan tidak ditemukan"];
    else if (!placementObject.sub_unit_ids.includes(item.sub_unit_id)) {
      errors[key("placement_object_ids")] = [`Objek "${placementObject.name}" tidak tersedia di sub unit yang dipilih`];
    }
  }

  if (position) {
    if (item.supervisor_assignment_ids.length === 0) {
      if (needsSupervisor(position.brm_level)) errors[key("supervisor_assignment_ids")] = ["Pilih minimal satu Atasan Langsung"];
    } else {
      const allValid = item.supervisor_assignment_ids.every((supervisorId) => {
        const supervisor = assignments.find((entry) => entry.id === supervisorId);
        const supervisorPosition = positions.find((entry) => entry.id === supervisor?.position_id);
        if (!supervisor || !supervisorPosition) return false;
        return canBeSupervisor(
          { id: supervisor.id, employee_id: supervisor.employee_id, brm_level: supervisorPosition.brm_level, is_active: isAssignmentActive(supervisor) },
          position.brm_level,
          item.employee_id,
          null,
        );
      });
      if (!allValid) {
        errors[key("supervisor_assignment_ids")] = ["Atasan Langsung harus penugasan aktif karyawan lain dengan level BRM lebih tinggi"];
      }
    }
  }

  if (item.end_date && item.effective_date && item.end_date < item.effective_date) {
    errors[key("end_date")] = ["TMT Selesai tidak boleh lebih awal dari TMT Aktif"];
  }
  return errors;
}
