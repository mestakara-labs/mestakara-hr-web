/**
 * OBJEK PENEMPATAN (master data).
 *
 * Objek penempatan = wahana / fasilitas tempat karyawan bertugas sehari-hari,
 * mis. "Wahana ATV", "Tea Bridge", atau "Glamping".
 *
 *   Kategori Objek (Wisata Alam) -> Objek Penempatan (Tea Bridge) -> tersedia di Sub Unit (Gunung Mas, Malabar)
 *
 * Satu objek bisa tersedia di BEBERAPA sub unit. Contoh: Tea Bridge ada di
 * Gunung Mas dan di Malabar — fisiknya berbeda, tapi jenis objeknya sama.
 * Di form penugasan jabatan, isian objek OPSIONAL dan pilihannya hanya objek
 * yang tersedia di sub unit penugasan.
 */

/** Satu objek penempatan, seperti yang dikirim GET /api/placement-objects. */
export interface PlacementObjectResource {
  id: string;
  /** Nama objek, mis. "Tea Bridge" */
  name: string;
  /** Id kategori objek (master Kategori Objek) */
  category_id: string;
  /** Nama kategorinya, mis. "Wisata Alam". Ikut dikirim supaya tidak perlu dicari lagi. */
  category_name: string;
  /** Sub unit tempat objek ini tersedia (minimal satu) */
  sub_units: { id: string; name: string }[];
  /** Keterangan tambahan. null kalau tidak diisi. */
  description: string | null;
  /** Jumlah penugasan jabatan AKTIF di objek ini (dihitung server). */
  assignment_count: number;
}

/** Isian form objek penempatan yang dikirim saat tambah (POST) dan ubah (PUT). */
export interface PlacementObjectPayload {
  name: string;
  category_id: string;
  /** Id sub unit tempat objek tersedia (minimal satu) */
  sub_unit_ids: string[];
  description: string;
}
