/**
 * ISIAN WIZARD MUTASI & PENEMPATAN: bentuk datanya, isian awal, karyawan baru
 * yang ditambahkan ke usulan, dan cara mengirimnya ke server.
 *
 * Dipisah dari file tampilan (MutasiWizard.tsx, Step*.tsx) supaya file tampilan tetap pendek.
 */
import { DEFINITIVE_STATUS } from "@/lib/assignment-rules";
import { toDateText } from "@/lib/date";
import { EMPTY_SIGNER, SIGNER_SOURCE, type SignerValues } from "@/lib/signer-rules";
import {
  INITIAL_PLACEMENT,
  requiresFromAssignment,
  suggestDecreeNumber,
  TEMPORARY_ASSIGNMENT,
} from "@/lib/transfer-rules";
import type { AssignmentResource } from "@/types/api/assignment";
import type { EmployeeProfileResource, UploadedFileInfo } from "@/types/api/employee";
import type { SignerResource } from "@/types/api/employee-activation";
import type { PositionResource } from "@/types/api/organization";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";
import type {
  BasisDocumentText,
  TransferItemPayload,
  TransferItemResource,
  TransferPayload,
  TransferResource,
} from "@/types/api/transfer";

/** Isian DOKUMEN DASAR: teks + file. Dipakai wizard (langkah Dokumen) dan dialog di halaman detail. */
export interface BasisDocumentValues extends BasisDocumentText {
  /** File dokumen dasar: File = baru, UploadedFileInfo = file lama, null = belum ada */
  basis_document_file: File | UploadedFileInfo | null;
}

/** Semua isian wizard. */
export interface MutasiFormValues extends TransferPayload, BasisDocumentValues {
  /** Scan SK bertanda tangan (jalur Unggah): File = baru, UploadedFileInfo = file lama, null = belum ada */
  signed_file: File | UploadedFileInfo | null;
}

/** Data dari server yang dipakai wizard untuk pilihan-pilihannya. */
export interface WizardData {
  employees: EmployeeProfileResource[];
  /** Semua penugasan: jabatan sekarang setiap karyawan, calon atasan, dan penandatangan */
  assignments: AssignmentResource[];
  positions: PositionResource[];
  subUnits: SubUnitResource[];
  placementObjects: PlacementObjectResource[];
  /** Semua usulan: untuk menandai karyawan yang sedang ada di usulan lain */
  transfers: TransferResource[];
}

/** Bekal setiap langkah wizard: nilai, cara mengubah, pesan error, dan data pilihan. */
export interface StepProps {
  values: MutasiFormValues;
  setValues: (update: (previous: MutasiFormValues) => MutasiFormValues) => void;
  /** Pesan error per isian, mis. { "decree_number": "...", "items.baru-1.position_id": "..." } */
  errors: Record<string, string>;
  disabled: boolean;
  data: WizardData;
}

/** Nama isian error satu karyawan, mis. itemErrorKey("baru-1", "position_id") -> "items.baru-1.position_id". */
export function itemErrorKey(itemId: string, field: keyof TransferItemPayload): string {
  return `items.${itemId}.${field}`;
}

/** Id sementara untuk baris BARU (belum tersimpan), mis. "baru-1a2b3c4d". Server menggantinya dengan id tetap. */
function newRowId(): string {
  return `baru-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Penugasan karyawan yang sedang berjalan atau akan datang (belum selesai),
 * urut dari yang paling "utama": Definitif dulu.
 */
export function currentAssignmentsOf(employeeId: string, assignments: AssignmentResource[]): AssignmentResource[] {
  return assignments
    .filter((assignment) => assignment.employee.id === employeeId && assignment.period !== "Selesai")
    .sort((a, b) => Number(b.assignment_status === DEFINITIVE_STATUS) - Number(a.assignment_status === DEFINITIVE_STATUS));
}

/**
 * Jabatan lama BAWAAN untuk sebuah jenis mutasi:
 *   - Penempatan Awal & Penugasan Sementara -> tidak ada ("")
 *   - Rotasi / Promosi / Demosi             -> penugasan utama karyawan (Definitif dulu)
 */
function defaultFromAssignment(type: string, current: AssignmentResource[]): string {
  return requiresFromAssignment(type) ? (current[0]?.id ?? "") : "";
}

/**
 * Isian satu karyawan yang BARU ditambahkan ke usulan. Sub unit bawaan = sub unit
 * jabatan lamanya, supaya tidak perlu dipilih ulang kalau tidak pindah tempat.
 */
export function newItem(employeeId: string, type: string, assignments: AssignmentResource[]): TransferItemPayload {
  const current = currentAssignmentsOf(employeeId, assignments);
  const fromId = defaultFromAssignment(type, current);

  return {
    id: newRowId(),
    employee_id: employeeId,
    from_assignment_id: fromId,
    position_id: "",
    assignment_status: type === TEMPORARY_ASSIGNMENT ? "Plt" : DEFINITIVE_STATUS,
    sub_unit_id: current.find((assignment) => assignment.id === fromId)?.sub_unit.id ?? current[0]?.sub_unit.id ?? "",
    placement_object_ids: [],
    supervisor_assignment_ids: [],
    end_date: "",
    notes: "",
    restore_subordinates: false,
  };
}

/**
 * Jenis mutasi diganti -> jabatan lama setiap karyawan disesuaikan:
 * Penempatan Awal tidak punya jabatan lama; Rotasi/Promosi/Demosi wajib punya.
 */
export function adjustItemsToType(
  items: TransferItemPayload[],
  type: string,
  assignments: AssignmentResource[],
): TransferItemPayload[] {
  return items.map((item) => {
    if (type === INITIAL_PLACEMENT) return { ...item, from_assignment_id: "" };
    if (requiresFromAssignment(type) && !item.from_assignment_id) {
      return { ...item, from_assignment_id: defaultFromAssignment(type, currentAssignmentsOf(item.employee_id, assignments)) };
    }
    return item;
  });
}

/** Karyawan di usulan yang sudah tersimpan -> isian form ("" = kosong). */
function toItemValues(item: TransferItemResource): TransferItemPayload {
  return {
    id: item.id,
    employee_id: item.employee.id,
    from_assignment_id: item.from?.assignment_id ?? "",
    position_id: item.to.position_id,
    assignment_status: item.to.assignment_status,
    sub_unit_id: item.to.sub_unit_id,
    placement_object_ids: item.to.placement_object_ids,
    supervisor_assignment_ids: item.to.supervisors.map((supervisor) => supervisor.assignment_id),
    end_date: item.to.end_date ?? "",
    notes: item.notes ?? "",
    restore_subordinates: item.restore_subordinates,
  };
}

/**
 * Penandatangan dari server -> isian form. Unit: cukup id penugasannya;
 * Kantor Regional / Head Office: nama & jabatan yang diketik.
 */
export function toSignerValues(signer: SignerResource | null): SignerValues {
  if (!signer) return EMPTY_SIGNER;
  const isUnit = signer.assignment_id !== null;
  return {
    signer_source: signer.source,
    signer_assignment_id: signer.assignment_id ?? "",
    signer_name: isUnit ? "" : signer.name,
    signer_position: isUnit ? "" : signer.position_title,
  };
}

/** Dokumen dasar usulan yang sudah tersimpan -> isian form ("" = kosong). Tanpa usulan = semua kosong. */
export function toBasisDocumentValues(transfer: TransferResource | undefined): BasisDocumentValues {
  const signer = toSignerValues(transfer?.basis_document_signer ?? null);
  return {
    basis_document_type: transfer?.basis_document_type ?? "",
    basis_document_number: transfer?.basis_document_number ?? "",
    basis_document_date: transfer?.basis_document_date ?? "",
    basis_signer_source: signer.signer_source,
    basis_signer_assignment_id: signer.signer_assignment_id,
    basis_signer_name: signer.signer_name,
    basis_signer_position: signer.signer_position,
    basis_document_file: transfer?.basis_document_file ?? null,
  };
}

/** Ambil isian dokumen dasar saja (berawalan basis_) dari isian wizard. */
export function pickBasisDocument(values: BasisDocumentValues): BasisDocumentValues {
  return {
    basis_document_type: values.basis_document_type,
    basis_document_number: values.basis_document_number,
    basis_document_date: values.basis_document_date,
    basis_signer_source: values.basis_signer_source,
    basis_signer_assignment_id: values.basis_signer_assignment_id,
    basis_signer_name: values.basis_signer_name,
    basis_signer_position: values.basis_signer_position,
    basis_document_file: values.basis_document_file,
  };
}

/**
 * Isian dokumen dasar -> dimasukkan ke FormData: teks + file baru,
 * atau penanda keep_basis_document_file = file lama dipertahankan.
 */
export function appendBasisDocument(form: FormData, values: BasisDocumentValues) {
  const { basis_document_file, ...textFields } = pickBasisDocument(values);

  for (const [key, value] of Object.entries(textFields)) {
    form.append(key, value);
  }
  if (basis_document_file instanceof File) form.append("basis_document_file", basis_document_file);
  else if (basis_document_file) form.append("keep_basis_document_file", "1");
}

/** Pengaturan awal wizard yang datang dari luar (alamat halaman / data). */
export interface WizardPreset {
  /** Jenis mutasi bawaan, mis. "Penempatan Awal" (dari Data Karyawan) */
  type?: string;
  /** Karyawan yang langsung tercentang */
  employeeId?: string;
  /** Penandatangan bawaan: penugasan Manager yang sedang menjabat */
  signerAssignmentId: string;
}

/** Penandatangan bawaan: pejabat Unit (Manager yang sedang menjabat). */
function unitSigner(assignmentId: string): SignerValues {
  return { ...EMPTY_SIGNER, signer_source: assignmentId ? SIGNER_SOURCE.unit : "", signer_assignment_id: assignmentId };
}

/** Isian awal: kosong untuk usulan baru, atau data lama untuk edit. */
export function initialValues(
  transfer: TransferResource | undefined,
  preset: WizardPreset,
  assignments: AssignmentResource[],
): MutasiFormValues {
  const today = toDateText(new Date());

  if (transfer) {
    return {
      type: transfer.type,
      effective_date: transfer.effective_date ?? "",
      notes: transfer.notes ?? "",
      ...toBasisDocumentValues(transfer),
      decree_number: transfer.decree_number ?? suggestDecreeNumber(transfer.decree_date ?? today),
      decree_date: transfer.decree_date ?? today,
      ...(transfer.signer ? toSignerValues(transfer.signer) : unitSigner(preset.signerAssignmentId)),
      document_mode: transfer.document_mode ?? "",
      signed_file: transfer.signed_file,
      items: transfer.items.map(toItemValues),
    };
  }

  const type = preset.type ?? "";

  return {
    type,
    effective_date: "",
    notes: "",
    ...toBasisDocumentValues(undefined),
    decree_number: suggestDecreeNumber(today),
    decree_date: today,
    ...unitSigner(preset.signerAssignmentId),
    document_mode: "",
    signed_file: null,
    items: preset.employeeId ? [newItem(preset.employeeId, type, assignments)] : [],
  };
}

/**
 * Isian -> FormData (multipart) yang dikirim ke /api/transfers:
 *   - isian teks biasa + `items` sebagai teks JSON
 *   - `action`: "draft" atau "submit"
 *   - signed_file (file baru), atau penanda keep_signed_file = file lama dipertahankan
 *   - dokumen dasar (lihat appendBasisDocument)
 */
export function toFormData(values: MutasiFormValues, action: "draft" | "submit"): FormData {
  const { signed_file, items, ...fields } = values;
  const form = new FormData();

  // Isian teks biasa; dokumen dasar (berawalan basis_) dikirim lewat appendBasisDocument.
  for (const [key, value] of Object.entries(fields)) {
    if (!key.startsWith("basis_") && typeof value === "string") form.append(key, value);
  }
  form.append("items", JSON.stringify(items));
  form.append("action", action);

  if (signed_file instanceof File) form.append("signed_file", signed_file);
  else if (signed_file) form.append("keep_signed_file", "1");

  appendBasisDocument(form, values);

  return form;
}
