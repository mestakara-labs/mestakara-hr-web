/**
 * ISIAN WIZARD PENONAKTIFAN KARYAWAN: bentuk datanya, isian awal, pemeriksaan per langkah,
 * dan cara mengirimnya. Dipisah dari tampilan supaya file langkah tetap pendek.
 *
 *   1. Pilih Karyawan          -> items (karyawan Aktif)
 *   2. Dasar & Dokumen         -> jenis, TMT nonaktif, alasan / unit tujuan; dokumen WAJIB (kolektif / per orang)
 *   3. Pratinjau Dampak        -> hanya dilihat (dihitung server)
 *   4. Tinjau & Simpan
 */
import { ACTIVATION_STATUS, checkStatusDocument, DOCUMENT_SCOPE, EMPLOYEE_ACTIVE_STATUS } from "@/lib/activation-rules";
import { toDateText } from "@/lib/date";
import {
  requiresDestinationUnit,
  requiresTerminationReason,
  TERMINATION_TYPE,
} from "@/lib/termination-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { EmployeeProfileResource } from "@/types/api/employee";
import type { ActivationResource, StatusDocumentResource } from "@/types/api/employee-activation";
import type { TerminationItemPayload, TerminationResource } from "@/types/api/employee-termination";

import { getEmployeeRetirement } from "@/features/karyawan/employee-retirement";
import { EMPTY_DOCUMENT_FORM, type StatusDocumentFormValues } from "@/features/penambahan/StatusDocumentFields";

/** Judul setiap langkah wizard, urut dari langkah 1. */
export const PENONAKTIFAN_STEPS = ["Pilih Karyawan", "Dasar & Dokumen", "Pratinjau Dampak", "Tinjau & Simpan"];

/** Satu karyawan di wizard. */
export interface PenonaktifanItemValues extends StatusDocumentFormValues {
  /** Id item tersimpan, atau id sementara "baru-..." */
  id: string;
  employee_id: string;
  type: string;
  /** TMT nonaktif = hari pertama tidak aktif */
  effective_date: string;
  reason: string;
  destination_unit: string;
  notes: string;
}

/** Semua isian wizard. Dokumen kolektif ada di isian StatusDocumentFormValues. */
export interface PenonaktifanFormValues extends StatusDocumentFormValues {
  document_scope: string;
  notes: string;
  items: PenonaktifanItemValues[];
}

/** Data pilihan yang dibutuhkan wizard. */
export interface PenonaktifanData {
  employees: EmployeeProfileResource[];
  /** Untuk pilihan penandatangan dari Unit */
  assignments: AssignmentResource[];
  /** Untuk menandai karyawan yang sedang ada di usulan lain */
  terminations: TerminationResource[];
  activations: ActivationResource[];
}

/** Pesan error per isian, mis. { "items.baru-1.effective_date": "Pilih TMT Nonaktif" }. */
export type StepErrors = Record<string, string>;

/** Nama isian error satu karyawan, mis. "items.baru-1.effective_date". */
export function itemErrorKey(itemId: string, field: string): string {
  return `items.${itemId}.${field}`;
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

/**
 * Tanggal pensiun karyawan ("YYYY-MM-DD"), untuk TMT otomatis jenis Pensiun.
 * "" kalau karyawan tidak punya masa pensiun (bukan Tetap / tanpa tanggal lahir).
 */
export function retirementDateOf(employee: EmployeeProfileResource | undefined): string {
  return employee ? (getEmployeeRetirement(employee)?.date ?? "") : "";
}

/**
 * Ganti jenis satu karyawan. Jenis Pensiun: TMT otomatis diisi tanggal pensiunnya
 * (masih bisa diubah manual setelahnya).
 */
export function withType(
  item: PenonaktifanItemValues,
  type: string,
  employee: EmployeeProfileResource | undefined,
): PenonaktifanItemValues {
  const retirementDate = type === TERMINATION_TYPE.retirement ? retirementDateOf(employee) : "";
  return { ...item, type, effective_date: retirementDate || item.effective_date };
}

/** Karyawan baru di wizard (dari "Pilih Karyawan"). */
export function newItem(employee: EmployeeProfileResource): PenonaktifanItemValues {
  return {
    ...EMPTY_DOCUMENT_FORM,
    id: `baru-${crypto.randomUUID().slice(0, 8)}`,
    employee_id: employee.id,
    type: "",
    effective_date: "",
    reason: "",
    destination_unit: "",
    notes: "",
  };
}

/** Isian awal: kosong untuk usulan baru, atau isi usulan Draf yang dilanjutkan. */
export function initialValues(termination?: TerminationResource): PenonaktifanFormValues {
  return {
    ...toDocumentForm(termination?.document ?? null),
    document_scope: termination?.document_scope ?? DOCUMENT_SCOPE.collective,
    notes: termination?.notes ?? "",
    items: (termination?.items ?? []).map((item) => ({
      ...toDocumentForm(item.document),
      id: item.id,
      employee_id: item.employee.id,
      type: item.type,
      effective_date: item.effective_date,
      reason: item.reason ?? "",
      destination_unit: item.destination_unit ?? "",
      notes: item.notes ?? "",
    })),
  };
}

/**
 * Karyawan yang bisa dipilih: AKTIF, belum ada di usulan ini, tidak sedang di usulan
 * Penonaktifan / Penambahan Draf lain, dan belum terjadwal nonaktif (usulan Berlaku lain).
 * (Usulan Mutasi yang masih terbuka diperiksa oleh server.)
 */
export function findCandidates(
  data: PenonaktifanData,
  selectedIds: string[],
  terminationId: string | null,
): EmployeeProfileResource[] {
  const today = toDateText(new Date());
  const busyIds = new Set([
    ...data.terminations
      .filter((termination) => termination.id !== terminationId && termination.status !== ACTIVATION_STATUS.cancelled)
      .flatMap((termination) =>
        termination.items
          // Usulan Berlaku yang TMT-nya sudah lewat tidak menghalangi (karyawannya sudah aktif lagi).
          .filter((item) => termination.status === ACTIVATION_STATUS.draft || item.effective_date > today)
          .map((item) => item.employee.id),
      ),
    ...data.activations
      .filter((activation) => activation.status === ACTIVATION_STATUS.draft)
      .flatMap((activation) => activation.items.map((item) => item.employee.id)),
  ]);

  return data.employees.filter(
    (employee) =>
      employee.active_status === EMPLOYEE_ACTIVE_STATUS.active && !selectedIds.includes(employee.id) && !busyIds.has(employee.id),
  );
}

// ---------------------------------------------------------------------------
// Pemeriksaan per langkah (aturan lengkapnya diperiksa lagi oleh server)
// ---------------------------------------------------------------------------

/** Langkah 1: minimal satu karyawan. */
export function checkEmployeeStep(values: PenonaktifanFormValues): StepErrors {
  return values.items.length === 0 ? { items: "Pilih minimal satu karyawan" } : {};
}

/** Langkah 2: jenis, TMT, alasan / unit tujuan, dan dokumen (WAJIB). */
export function checkBasisStep(values: PenonaktifanFormValues): StepErrors {
  const errors: StepErrors = {};
  const isCollective = values.document_scope === DOCUMENT_SCOPE.collective;

  for (const item of values.items) {
    const key = (field: string) => itemErrorKey(item.id, field);

    if (!item.type) errors[key("type")] = "Pilih Jenis Penonaktifan";
    if (!item.effective_date) errors[key("effective_date")] = "Pilih TMT Nonaktif";
    if (requiresTerminationReason(item.type) && !item.reason.trim()) errors[key("reason")] = "Alasan wajib diisi";
    if (requiresDestinationUnit(item.type) && !item.destination_unit.trim()) {
      errors[key("destination_unit")] = "Unit Tujuan wajib diisi";
    }

    if (!isCollective) {
      for (const [field, message] of Object.entries(checkStatusDocument(item, item.document_file !== null, true))) {
        errors[key(field)] = message;
      }
    }
  }

  if (isCollective) Object.assign(errors, checkStatusDocument(values, values.document_file !== null, true));
  return errors;
}

/** Nama isian -> langkah tempat isian itu berada (untuk membuka langkah yang bermasalah). */
export function stepOfError(field: string): number {
  const name = field.split(".").pop() ?? field;
  return field === "items" || name === "employee_id" ? 1 : 2;
}

// ---------------------------------------------------------------------------
// Mengirim
// ---------------------------------------------------------------------------

/**
 * Isian wizard -> FormData (multipart) untuk /api/employee-terminations:
 *   - isian teks + items (JSON)
 *   - action: "draft" / "submit"
 *   - file baru: document_file (kolektif), document_file_<id item> (per orang); keep_* = file lama dipertahankan
 */
export function toFormData(values: PenonaktifanFormValues, action: "draft" | "submit"): FormData {
  const form = new FormData();
  const { document_file, items, ...text } = values;

  for (const [key, value] of Object.entries(text)) form.append(key, value);
  form.append("action", action);

  if (document_file instanceof File) form.append("document_file", document_file);
  else if (document_file) form.append("keep_document_file", "1");

  const rows: TerminationItemPayload[] = items.map(({ document_file: itemFile, ...item }) => {
    if (itemFile instanceof File) form.append(`document_file_${item.id}`, itemFile);
    return { ...item, keep_document_file: itemFile !== null && !(itemFile instanceof File) };
  });
  form.append("items", JSON.stringify(rows));

  return form;
}
