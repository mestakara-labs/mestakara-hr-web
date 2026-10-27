/**
 * PENUGASAN JABATAN = karyawan + jabatan yang dipegangnya.
 *
 * Satu penugasan berarti: "karyawan X memegang jabatan Y di sub unit Z,
 * dengan status S (Definitif / Plt / ...), sejak tanggal T".
 *
 * - Satu karyawan bisa punya beberapa penugasan (mis. Definitif di jabatan A
 *   sambil Plt di jabatan B), juga riwayat penugasan yang sudah selesai.
 * - Satu jabatan boleh dipegang beberapa orang sekaligus.
 *
 * Di menu tampil sebagai "Jabatan Karyawan". Penugasan dibuat & diakhiri lewat
 * Mutasi & Penempatan. Di kode dan di alamat API memakai kata bahasa Inggris "assignment".
 */
import type { UploadedFileInfo } from "./employee";

/** Atasan langsung sebuah penugasan: PENUGASAN milik karyawan atasannya. */
export interface AssignmentSupervisor {
  /** Id penugasan atasan (bukan id karyawan) */
  assignment_id: string;
  employee_name: string;
  position_title: string;
  /** Status penugasan atasan, mis. "Plt" */
  assignment_status: string;
}

/** Satu penugasan jabatan, seperti yang dikirim GET /api/position-assignments. */
export interface AssignmentResource {
  id: string;

  employee: { id: string; name: string; nik: string | null; photo_url: string | null };
  position: { id: string; code: string; title: string; brm_level: number; job_grade: number | null; division_name: string | null };
  sub_unit: { id: string; name: string };
  /** Objek penempatan, bisa lebih dari satu (mis. Pondokan, Bungalow). Kosong = tanpa objek (opsional). */
  placement_objects: { id: string; name: string; category_name: string }[];

  /** "Definitif", "Penugasan", "Pj", "Plt", "Plh", atau "Ptr" (lihat ASSIGNMENT_STATUS_OPTIONS) */
  assignment_status: string;
  /** Atasan langsung, bisa lebih dari satu. Kosong untuk pimpinan paling atas. */
  supervisors: AssignmentSupervisor[];

  /** TMT mulai, format "YYYY-MM-DD" */
  start_date: string;
  /** TMT selesai. null = masih berjalan */
  end_date: string | null;
  /** true kalau penugasan sedang berjalan hari ini (= `period` "Aktif") */
  is_active: boolean;
  /** "Akan Datang" (TMT mulai belum tiba), "Aktif", atau "Selesai" — dihitung server */
  period: "Akan Datang" | "Aktif" | "Selesai";
  /** Usulan Mutasi & Penempatan yang membuat penugasan ini. null = data awal (sebelum ada fitur mutasi). */
  transfer: { id: string; decree_number: string } | null;

  // --- Dokumen dasar penugasan (opsional, tapi sangat disarankan) ----------
  /** "SK", "Memo", "Surat Penugasan", atau "Lainnya" */
  decree_type: string | null;
  decree_number: string | null;
  /** Format "YYYY-MM-DD" */
  decree_date: string | null;
  decree_file: UploadedFileInfo | null;
  /**
   * Alamat untuk MEMBUKA file dokumen di tab baru, mis. "/api/position-assignments/12/decree-file".
   * null kalau belum ada file.
   */
  decree_file_url: string | null;

  notes: string | null;
}
