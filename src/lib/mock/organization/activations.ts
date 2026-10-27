/**
 * USULAN PENAMBAHAN KARYAWAN seperti yang DISIMPAN di data mock, beserta data awalnya.
 *
 * Nama-nama (karyawan, jabatan, dst.) tidak disimpan di sini, hanya id-nya; namanya
 * ditempelkan saat dibaca (lihat activation-resource.ts).
 */
import type { UploadedFileInfo } from "@/types/api/employee";

import type { EmployeeRecord } from "./employees";

/** Satu dokumen dasar yang disimpan (kolektif di usulan, atau per orang di item). Semua null = belum ada. */
export interface StoredDocument {
  document_type: string | null;
  document_number: string | null;
  document_date: string | null;
  document_file: UploadedFileInfo | null;
  /** Isi file dalam teks base64 (khusus mock). null untuk dokumen contoh -> dibuka sebagai PDF contoh. */
  document_file_data: string | null;
  signer_source: string | null;
  signer_assignment_id: string | null;
  signer_name: string | null;
  signer_position: string | null;
}

/** Dokumen yang belum diisi sama sekali. */
export const EMPTY_DOCUMENT: StoredDocument = {
  document_type: null,
  document_number: null,
  document_date: null,
  document_file: null,
  document_file_data: null,
  signer_source: null,
  signer_assignment_id: null,
  signer_name: null,
  signer_position: null,
};

/** Satu karyawan di dalam usulan. */
export interface ActivationItemRecord extends StoredDocument {
  id: string;
  employee_id: string;
  type: string;
  /** "" = belum diisi (Draf) */
  effective_date: string;
  origin_unit: string | null;
  // Rencana penempatan (opsional). position_id null = belum ditempatkan.
  position_id: string | null;
  assignment_status: string | null;
  sub_unit_id: string | null;
  placement_object_ids: string[];
  supervisor_assignment_ids: string[];
  assignment_end_date: string | null;
  /** Penugasan yang dibuat saat usulan Berlaku. null = belum berlaku / tanpa penempatan. */
  new_assignment_id: string | null;
  notes: string | null;
}

/** Satu usulan penambahan. Dokumen kolektifnya ada di isian StoredDocument. */
export interface ActivationRecord extends StoredDocument {
  id: string;
  status: string;
  document_scope: string;
  notes: string | null;
  items: ActivationItemRecord[];
  created_at: string;
  created_by: string;
  activated_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
}

/**
 * DATA AWAL: semua karyawan contoh dianggap sudah aktif lewat satu usulan Penerimaan Baru
 * "data awal" (status Berlaku, TMT = tanggal masuk masing-masing), dengan dokumen kolektif
 * SK struktur organisasi — dokumen dasar karyawan contoh sebelum ada fitur Penambahan.
 */
export function createSeedActivations(employees: EmployeeRecord[]): ActivationRecord[] {
  return [
    {
      id: "penambahan-data-awal",
      status: "Berlaku",
      document_scope: "Kolektif",
      document_type: "SK",
      document_number: "KEP/IV.2/1667/XI/2023",
      document_date: "2023-11-09",
      document_file: { name: "SK-KEP-IV.2-1667-XI-2023.pdf", size: 1_240_000, type: "application/pdf" },
      document_file_data: null,
      signer_source: "Head Office",
      signer_assignment_id: null,
      signer_name: "Direksi PTPN I",
      signer_position: "Direktur SDM",
      notes: "Data awal karyawan sebelum ada fitur Penambahan Karyawan.",
      items: employees.map((employee, index) => ({
        ...EMPTY_DOCUMENT,
        id: `penambahan-data-awal-${index + 1}`,
        employee_id: employee.id,
        type: "Penerimaan Baru",
        effective_date: employee.hire_date ?? "",
        origin_unit: null,
        position_id: null,
        assignment_status: null,
        sub_unit_id: null,
        placement_object_ids: [],
        supervisor_assignment_ids: [],
        assignment_end_date: null,
        new_assignment_id: null,
        notes: null,
      })),
      created_at: "2023-11-09T01:00:00.000Z",
      created_by: "Sistem (data awal)",
      activated_at: "2023-11-09T01:00:00.000Z",
      cancelled_at: null,
      cancelled_by: null,
      cancel_reason: null,
    },
  ];
}
