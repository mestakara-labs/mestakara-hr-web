/**
 * ISIAN WIZARD PENAMBAHAN KARYAWAN: bentuk datanya, isian awal, pemeriksaan per langkah,
 * dan cara mengirimnya. Dipisah dari tampilan supaya file langkah tetap pendek.
 *
 *   1. Data Karyawan                 -> items (karyawan + kelengkapan biodatanya)
 *   2. Dasar Penambahan & Dokumen    -> jenis, TMT, unit asal; dokumen kolektif / per orang
 *   3. Penempatan (boleh dilewati)   -> rencana jabatan per karyawan
 *   4. Tinjau & Simpan
 */
import {
  ACTIVATION_TYPE,
  allowedActivationTypes,
  checkStatusDocument,
  DOCUMENT_SCOPE,
} from "@/lib/activation-rules";
import { needsSupervisor } from "@/lib/assignment-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { EmployeeProfileResource } from "@/types/api/employee";
import type { ActivationItemPayload, ActivationResource, StatusDocumentResource } from "@/types/api/employee-activation";
import type { PositionResource } from "@/types/api/organization";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";

import type { PlacementValues } from "@/features/jabatan-karyawan/PlacementFields";

import { EMPTY_DOCUMENT_FORM, type StatusDocumentFormValues } from "./StatusDocumentFields";

/** Judul setiap langkah wizard, urut dari langkah 1. */
export const PENAMBAHAN_STEPS = ["Data Karyawan", "Dasar Penambahan & Dokumen", "Penempatan", "Tinjau & Simpan"];

/** Satu karyawan di wizard. */
export interface PenambahanItemValues extends StatusDocumentFormValues, PlacementValues {
  /** Id item tersimpan, atau id sementara "baru-..." */
  id: string;
  employee_id: string;
  type: string;
  effective_date: string;
  origin_unit: string;
  notes: string;
  /** true = karyawan ini langsung ditempatkan di jabatan saat usulan berlaku */
  has_placement: boolean;
}

/** Semua isian wizard. Dokumen kolektif ada di isian StatusDocumentFormValues. */
export interface PenambahanFormValues extends StatusDocumentFormValues {
  document_scope: string;
  notes: string;
  items: PenambahanItemValues[];
}

/** Data pilihan yang dibutuhkan wizard. */
export interface PenambahanData {
  employees: EmployeeProfileResource[];
  assignments: AssignmentResource[];
  positions: PositionResource[];
  subUnits: SubUnitResource[];
  placementObjects: PlacementObjectResource[];
  /** Semua usulan penambahan: untuk menandai karyawan yang sedang ada di usulan lain */
  activations: ActivationResource[];
}

/** Pesan error per isian, mis. { "items.baru-1.effective_date": "Pilih TMT Aktif" }. */
export type StepErrors = Record<string, string>;

/** Nama isian error satu karyawan, mis. "items.baru-1.effective_date". */
export function itemErrorKey(itemId: string, field: string): string {
  return `items.${itemId}.${field}`;
}

/** Id sementara untuk baris BARU (belum tersimpan). Server menggantinya dengan id tetap. */
function newRowId(): string {
  return `baru-${crypto.randomUUID().slice(0, 8)}`;
}

/** Dokumen dari server -> isian form. */
function toDocumentForm(document: StatusDocumentResource | null): StatusDocumentFormValues {
  if (!document) return EMPTY_DOCUMENT_FORM;
  return {
    document_type: document.type,
    document_number: document.number,
    document_date: document.date,
    document_file: document.file,
    signer_source: document.signer?.source ?? "",
    signer_assignment_id: document.signer?.assignment_id ?? "",
    signer_name: document.signer?.assignment_id ? "" : (document.signer?.name ?? ""),
    signer_position: document.signer?.assignment_id ? "" : (document.signer?.position_title ?? ""),
  };
}

/** Karyawan baru di wizard (dari "Pilih Karyawan"). Jenis bawaan sesuai statusnya. */
export function newItem(employee: EmployeeProfileResource): PenambahanItemValues {
  return {
    ...EMPTY_DOCUMENT_FORM,
    id: newRowId(),
    employee_id: employee.id,
    type: allowedActivationTypes(employee.active_status)[0],
    effective_date: "",
    origin_unit: "",
    notes: "",
    has_placement: false,
    position_id: "",
    assignment_status: "",
    sub_unit_id: "",
    placement_object_ids: [],
    supervisor_assignment_ids: [],
    end_date: "",
  };
}

/** Isian awal: kosong untuk usulan baru, atau isi usulan Draf yang dilanjutkan. */
export function initialValues(activation?: ActivationResource): PenambahanFormValues {
  return {
    ...toDocumentForm(activation?.document ?? null),
    document_scope: activation?.document_scope ?? DOCUMENT_SCOPE.collective,
    notes: activation?.notes ?? "",
    items: (activation?.items ?? []).map((item) => ({
      ...toDocumentForm(item.document),
      id: item.id,
      employee_id: item.employee.id,
      type: item.type,
      effective_date: item.effective_date,
      origin_unit: item.origin_unit ?? "",
      notes: item.notes ?? "",
      has_placement: item.placement !== null,
      position_id: item.placement?.position_id ?? "",
      assignment_status: item.placement?.assignment_status ?? "",
      sub_unit_id: item.placement?.sub_unit_id ?? "",
      placement_object_ids: item.placement?.placement_object_ids ?? [],
      supervisor_assignment_ids: item.placement?.supervisors.map((supervisor) => supervisor.assignment_id) ?? [],
      end_date: item.placement?.end_date ?? "",
    })),
  };
}

// ---------------------------------------------------------------------------
// Pemeriksaan per langkah (aturan lengkapnya diperiksa lagi oleh server)
// ---------------------------------------------------------------------------

/** Langkah 1: minimal satu karyawan, dan semua biodatanya lengkap. */
export function checkEmployeeStep(values: PenambahanFormValues, data: PenambahanData): StepErrors {
  if (values.items.length === 0) return { items: "Tambahkan minimal satu karyawan" };

  const errors: StepErrors = {};
  for (const item of values.items) {
    const employee = data.employees.find((entry) => entry.id === item.employee_id);
    if (employee && employee.missing_fields.length > 0) {
      errors[itemErrorKey(item.id, "employee_id")] = `Lengkapi data ${employee.name}`;
    }
  }
  return errors;
}

/** Langkah 2: jenis, TMT, unit asal, dan dokumen (opsional, tapi harus lengkap kalau diisi). */
export function checkBasisStep(values: PenambahanFormValues, data: PenambahanData): StepErrors {
  const errors: StepErrors = {};
  const isCollective = values.document_scope === DOCUMENT_SCOPE.collective;

  for (const item of values.items) {
    const key = (field: string) => itemErrorKey(item.id, field);
    const employee = data.employees.find((entry) => entry.id === item.employee_id);
    const allowed = allowedActivationTypes(employee?.active_status ?? "");

    if (!item.type) errors[key("type")] = "Pilih Dasar Penambahan";
    else if (!allowed.includes(item.type)) errors[key("type")] = `Pilih ${allowed.join(" atau ")}`;

    if (!item.effective_date) errors[key("effective_date")] = "Pilih TMT Aktif";
    else if (employee?.hire_date && item.effective_date < employee.hire_date) {
      errors[key("effective_date")] = "TMT Aktif tidak boleh sebelum Tanggal Masuk";
    }

    if (item.type === ACTIVATION_TYPE.transferIn && !item.origin_unit.trim()) errors[key("origin_unit")] = "Unit Asal wajib diisi";

    if (!isCollective) {
      for (const [field, message] of Object.entries(checkStatusDocument(item, item.document_file !== null))) {
        errors[key(field)] = message;
      }
    }
  }

  if (isCollective) Object.assign(errors, checkStatusDocument(values, values.document_file !== null));
  return errors;
}

/** Langkah 3: rencana penempatan (hanya karyawan yang dicentang "Tempatkan sekarang"). */
export function checkPlacementStep(values: PenambahanFormValues, data: PenambahanData): StepErrors {
  const errors: StepErrors = {};

  for (const item of values.items.filter((entry) => entry.has_placement)) {
    const key = (field: string) => itemErrorKey(item.id, field);
    const position = data.positions.find((entry) => entry.id === item.position_id);

    if (!item.position_id) errors[key("position_id")] = "Pilih Jabatan";
    if (!item.assignment_status) errors[key("assignment_status")] = "Pilih Status Jabatan";
    if (!item.sub_unit_id) errors[key("sub_unit_id")] = "Pilih Sub Unit";
    if (position && needsSupervisor(position.brm_level) && item.supervisor_assignment_ids.length === 0) {
      errors[key("supervisor_assignment_ids")] = "Pilih minimal satu Atasan Langsung";
    }
    if (item.end_date && item.effective_date && item.end_date < item.effective_date) {
      errors[key("end_date")] = "TMT Selesai tidak boleh lebih awal dari TMT Aktif";
    }
  }
  return errors;
}

/** Nama isian -> langkah tempat isian itu berada (untuk membuka langkah yang bermasalah). */
export function stepOfError(field: string): number {
  const name = field.split(".").pop() ?? field;
  if (field === "items" || name === "employee_id") return 1;
  if (["position_id", "assignment_status", "sub_unit_id", "placement_object_ids", "supervisor_assignment_ids", "end_date"].includes(name)) {
    return 3;
  }
  return 2;
}

/** Apakah dokumen (kolektif atau per orang) masih ada yang kosong? Dipakai pop-up peringatan. */
export function countMissingDocuments(values: PenambahanFormValues): number {
  if (values.document_scope === DOCUMENT_SCOPE.collective) return values.document_file ? 0 : values.items.length;
  return values.items.filter((item) => !item.document_file).length;
}

// ---------------------------------------------------------------------------
// Mengirim
// ---------------------------------------------------------------------------

/**
 * Isian wizard -> FormData (multipart) untuk /api/employee-activations:
 *   - isian teks + items (JSON)
 *   - action: "draft" / "submit"
 *   - file baru: document_file (kolektif), document_file_<id item> (per orang); keep_* = file lama dipertahankan
 */
export function toFormData(values: PenambahanFormValues, action: "draft" | "submit"): FormData {
  const form = new FormData();
  const { document_file, items, ...text } = values;

  for (const [key, value] of Object.entries(text)) form.append(key, value);
  form.append("action", action);

  if (document_file instanceof File) form.append("document_file", document_file);
  else if (document_file) form.append("keep_document_file", "1");

  const rows: ActivationItemPayload[] = items.map(({ document_file: itemFile, ...item }) => {
    if (itemFile instanceof File) form.append(`document_file_${item.id}`, itemFile);
    return { ...item, keep_document_file: itemFile !== null && !(itemFile instanceof File) };
  });
  form.append("items", JSON.stringify(rows));

  return form;
}
