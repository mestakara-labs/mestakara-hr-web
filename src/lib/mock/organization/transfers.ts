/**
 * USULAN MUTASI & PENEMPATAN seperti yang DISIMPAN di data mock, beserta contohnya.
 *
 * Nama-nama (karyawan, jabatan, dst.) tidak disimpan di sini; yang disimpan hanya
 * id-nya. Namanya ditempelkan saat dibaca (lihat toTransferResource() di organization-store.ts).
 */
import type { UploadedFileInfo } from "@/types/api/employee";

import type { AssignmentRecord } from "./assignments";

/** Satu karyawan di dalam usulan. */
export interface TransferItemRecord {
  id: string;
  employee_id: string;
  /** Penugasan lama yang diakhiri. null = tidak ada. */
  from_assignment_id: string | null;
  position_id: string;
  assignment_status: string;
  sub_unit_id: string;
  /** Objek penempatan, bisa lebih dari satu. [] = tanpa objek. */
  placement_object_ids: string[];
  /** Id PENUGASAN atasan untuk penugasan baru */
  supervisor_assignment_ids: string[];
  /** TMT Selesai penugasan baru (mis. Plh). null = tanpa batas waktu. */
  end_date: string | null;
  notes: string | null;
  restore_subordinates: boolean;
  /** Scan petikan SK karyawan ini (opsional) */
  excerpt_file: UploadedFileInfo | null;
  excerpt_file_data: string | null;
  /** Penugasan baru yang dibuat saat usulan berlaku. null = belum berlaku. */
  new_assignment_id: string | null;
}

/**
 * Apa saja yang diubah saat usulan BERLAKU, supaya bisa dikembalikan kalau usulan dibatalkan.
 * (Penugasan baru yang dibuat dicatat di setiap item: `new_assignment_id`.)
 */
export interface AppliedChanges {
  /** Penugasan lama yang diakhiri, beserta TMT Selesai-nya SEBELUM diakhiri */
  ended: { assignment_id: string; previous_end_date: string | null }[];
  /** Catatan riwayat atasan yang dibuat usulan ini (pengalihan bawahan otomatis) */
  supervisor_change_ids: string[];
}

/** Satu usulan mutasi. */
export interface TransferRecord {
  id: string;
  type: string;
  status: string;
  effective_date: string | null;
  notes: string | null;
  /** Dokumen dasar mutasi (opsional) */
  basis_document_type: string | null;
  basis_document_number: string | null;
  basis_document_date: string | null;
  basis_document_file: UploadedFileInfo | null;
  basis_document_file_data: string | null;
  /** Penandatangan dokumen dasar (wajib kalau jenisnya SK); sama seperti penandatangan SK di bawah */
  basis_signer_source: string | null;
  basis_signer_assignment_id: string | null;
  basis_signer_name: string | null;
  basis_signer_position: string | null;
  decree_number: string | null;
  decree_date: string | null;
  /** Penandatangan SK: "Unit" (pilih penugasan) / "Kantor Regional" / "Head Office" (nama & jabatan diketik) */
  signer_source: string | null;
  signer_assignment_id: string | null;
  signer_name: string | null;
  signer_position: string | null;
  document_mode: string | null;
  /** Scan SK kolektif bertanda tangan */
  signed_file: UploadedFileInfo | null;
  signed_file_data: string | null;
  items: TransferItemRecord[];
  /** Diisi saat usulan berlaku; null = belum berlaku / sudah dibatalkan */
  applied: AppliedChanges | null;
  created_at: string;
  created_by: string;
  activated_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
}

/** Dokumen dasar yang belum diisi sama sekali. */
const EMPTY_BASIS_DOCUMENT = {
  basis_document_type: null,
  basis_document_number: null,
  basis_document_date: null,
  basis_document_file: null,
  basis_document_file_data: null,
  basis_signer_source: null,
  basis_signer_assignment_id: null,
  basis_signer_name: null,
  basis_signer_position: null,
};

/**
 * Contoh usulan supaya halaman Mutasi & Penempatan tidak kosong:
 *   1. Rotasi 2 admin, SK sudah dibuat dari template -> Menunggu Dokumen
 *   2. Promosi 1 Admin I menjadi Asisten, baru Draf
 *
 * Karyawannya diambil dari penugasan contoh (assignments.ts). Atasan & sub unit penugasan
 * baru disamakan dengan pemegang jabatan tujuan yang sekarang.
 */
export function createSeedTransfers(assignments: AssignmentRecord[]): TransferRecord[] {
  const firstHolder = (positionId: string) =>
    assignments.find((item) => item.position_id === positionId && item.end_date === null);

  /** Satu item: pemegang pertama `fromPositionId` dipindah ke `toPositionId`. */
  function moveItem(itemId: string, fromPositionId: string, toPositionId: string): TransferItemRecord | null {
    const from = firstHolder(fromPositionId);
    const target = firstHolder(toPositionId);
    if (!from || !target) return null;

    return {
      id: itemId,
      employee_id: from.employee_id,
      from_assignment_id: from.id,
      position_id: toPositionId,
      assignment_status: "Definitif",
      sub_unit_id: target.sub_unit_id,
      placement_object_ids: [...target.placement_object_ids],
      supervisor_assignment_ids: [...target.supervisor_assignment_ids],
      end_date: null,
      notes: null,
      restore_subordinates: false,
      excerpt_file: null,
      excerpt_file_data: null,
      new_assignment_id: null,
    };
  }

  const manager = firstHolder("manager");
  const transfers: TransferRecord[] = [];

  const rotationItems = [
    moveItem("mutasi-contoh-1-a", "admin-gudang", "admin-pengadaan"),
    moveItem("mutasi-contoh-1-b", "admin-kas-bank", "admin-tata-buku"),
  ].filter((item) => item !== null);

  if (rotationItems.length > 0) {
    transfers.push({
      id: "mutasi-contoh-1",
      type: "Rotasi",
      status: "Menunggu Dokumen",
      effective_date: "2026-11-01",
      notes: "Penyegaran tugas di bagian Administrasi & Keuangan",
      // Sengaja tanpa dokumen dasar, supaya pop-up peringatannya bisa dicoba.
      ...EMPTY_BASIS_DOCUMENT,
      decree_number: "2A44/P/2026.10.01-031",
      decree_date: "2026-10-01",
      signer_source: manager ? "Unit" : null,
      signer_assignment_id: manager?.id ?? null,
      signer_name: null,
      signer_position: null,
      document_mode: "Template",
      signed_file: null,
      signed_file_data: null,
      items: rotationItems,
      applied: null,
      created_at: "2026-10-01T02:00:00.000Z",
      created_by: "Admin SDM",
      activated_at: null,
      cancelled_at: null,
      cancelled_by: null,
      cancel_reason: null,
    });
  }

  const promotionItem = moveItem("mutasi-contoh-2-a", "admin-1-umum", "asisten-umum");
  if (promotionItem) {
    transfers.push({
      id: "mutasi-contoh-2",
      type: "Promosi",
      status: "Draf",
      effective_date: null,
      notes: null,
      ...EMPTY_BASIS_DOCUMENT,
      decree_number: null,
      decree_date: null,
      signer_source: null,
      signer_assignment_id: null,
      signer_name: null,
      signer_position: null,
      document_mode: null,
      signed_file: null,
      signed_file_data: null,
      items: [promotionItem],
      applied: null,
      created_at: "2026-10-05T03:30:00.000Z",
      created_by: "Admin SDM",
      activated_at: null,
      cancelled_at: null,
      cancelled_by: null,
      cancel_reason: null,
    });
  }

  return transfers;
}
