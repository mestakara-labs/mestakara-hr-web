/**
 * SUB UNIT (master data).
 *
 * Sub unit = lokasi / unit kerja tempat karyawan ditugaskan,
 * mis. "Kantor Induk" atau "Agrowisata Gunung Mas".
 * Sub unit TIDAK terikat ke bidang mana pun.
 */

/** Satu sub unit, seperti yang dikirim GET /api/sub-units. */
export interface SubUnitResource {
  id: string;
  /** Nama sub unit, mis. "Agrowisata Rancabali" */
  name: string;
  /** Kode afdeling, mis. "AFD03" (huruf besar, unik). null kalau belum diisi. */
  afdeling_code: string | null;
  /** Keterangan tambahan. null kalau tidak diisi. */
  description: string | null;
  /** Jumlah penugasan jabatan AKTIF di sub unit ini (dihitung server). */
  assignment_count: number;
  /** Jumlah objek penempatan yang tersedia di sub unit ini (dihitung server). */
  object_count: number;
}

/** Isian form sub unit yang dikirim saat tambah (POST) dan ubah (PUT). */
export interface SubUnitPayload {
  name: string;
  /** "" = tanpa kode afdeling */
  afdeling_code: string;
  description: string;
}
