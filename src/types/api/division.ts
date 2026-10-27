/**
 * BIDANG (master data).
 *
 * Bidang = kelompok besar pekerjaan yang dipimpin satu Asisten Manager (BRM-2),
 * mis. "Administrasi & Keuangan" atau "Operasional".
 * Di kode dan di alamat API memakai kata bahasa Inggris "division".
 */

/** Satu bidang, seperti yang dikirim GET /api/divisions. */
export interface DivisionResource {
  id: string;
  /** Kode singkat, mis. "ADK" */
  code: string;
  /** Nama bidang, mis. "Administrasi & Keuangan" */
  name: string;
  /** Keterangan tambahan. null kalau tidak diisi. */
  description: string | null;
  /** Jumlah jabatan yang memakai bidang ini (dihitung server). */
  position_count: number;
}

/** Isian form bidang yang dikirim saat tambah (POST) dan ubah (PUT). */
export interface DivisionPayload {
  code: string;
  name: string;
  description: string;
}
