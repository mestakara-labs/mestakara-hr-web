/**
 * KELOMPOK DAFTAR UPAH (master data) — pengelompokan "legacy" seperti di file Excel Daftar Upah lama,
 * mis. "Gunung Mas", "F&B Gunung Mas", "Bosscha Staff", "Petugas Parkir".
 *
 * Diisi (opsional) per karyawan di Skema Upah, lalu dipakai saat Daftar Upah dikelompokkan "Legacy".
 */

/** Satu kelompok, seperti yang dikirim GET /api/payroll-groups. */
export interface PayrollGroupResource {
  id: string;
  name: string;
  /** Urutan tampil di Daftar Upah (kecil = lebih dulu) */
  sort_order: number;
  /** Keterangan tambahan. null kalau tidak diisi. */
  description: string | null;
}

/** Isian form kelompok yang dikirim saat tambah (POST) dan ubah (PUT). */
export interface PayrollGroupPayload {
  name: string;
  sort_order: number;
  description: string;
}
