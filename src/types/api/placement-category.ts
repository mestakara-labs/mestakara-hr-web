/**
 * KATEGORI OBJEK PENEMPATAN (master data).
 *
 * Kelompok besar objek penempatan, mis. "Penginapan", "Wahana", "Restoran", atau "Cafe".
 *
 *   Kategori Objek (Wahana) -> Objek Penempatan (Flying Fox) -> tersedia di Sub Unit (Gunung Mas, ...)
 */

/** Satu kategori, seperti yang dikirim GET /api/placement-categories. */
export interface PlacementCategoryResource {
  id: string;
  /** Nama kategori, mis. "Penginapan" */
  name: string;
  /** Keterangan tambahan. null kalau tidak diisi. */
  description: string | null;
  /** Jumlah objek penempatan di kategori ini (dihitung server). */
  object_count: number;
}

/** Isian form kategori yang dikirim saat tambah (POST) dan ubah (PUT). */
export interface PlacementCategoryPayload {
  name: string;
  description: string;
}
