/**
 * COST CENTER (master data), dari SAP AMCO.
 *
 * Dipakai di biodata karyawan (dengan riwayat) dan nanti di Daftar Upah (kolom CC, uraian).
 * Contoh: { code: "4A44AGR007", name: "Tiket & Parkir" }.
 */

/** Satu cost center, seperti yang dikirim GET /api/cost-centers. */
export interface CostCenterResource {
  id: string;
  /** Kode SAP, mis. "4A44AGR007" (unik) */
  code: string;
  /** Uraian, mis. "Tiket & Parkir" */
  name: string;
  /** Keterangan tambahan. null kalau tidak diisi. */
  description: string | null;
}

/** Isian form cost center yang dikirim saat tambah (POST) dan ubah (PUT). */
export interface CostCenterPayload {
  code: string;
  name: string;
  description: string;
}
