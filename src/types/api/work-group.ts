/**
 * REGU KERJA: sekelompok karyawan yang bergantian mengisi shift dengan satu pola kerja,
 * mis. "House Keeping Gunung Mas" (4 orang, pola 3 shift + tengah, bergilir tiap minggu).
 *
 * Aturan rotasinya ada di lib/schedule-rules.ts.
 */

/** Satu anggota regu (aktif maupun riwayat). */
export interface GroupMemberResource {
  id: string;
  employee: { id: string; name: string; nik: string | null; photo_url: string | null };
  /** Slot saat anggota bergabung */
  start_slot: { id: string; code: string; name: string };
  start_date: string;
  /** null = masih aktif tanpa batas */
  end_date: string | null;
  /** Aktif hari ini? */
  is_active: boolean;
  /** "Akan Datang" (belum tiba tanggal bergabung), "Aktif", atau "Selesai" — dihitung server */
  period: "Akan Datang" | "Aktif" | "Selesai";
  /** Kode slot yang dipegang HARI INI (hasil rotasi). null = tidak aktif hari ini. */
  current_slot_code: string | null;
}

/** Satu regu kerja, seperti yang dikirim GET /api/work-groups. */
export interface WorkGroupResource {
  id: string;
  /** Nama regu (unik), mis. "House Keeping Gunung Mas" */
  name: string;
  sub_unit: { id: string; name: string };
  placement_object: { id: string; name: string } | null;
  work_pattern: { id: string; name: string; cycle_days: number };
  /** Ketua regu (opsional) */
  leader: { employee_id: string; name: string } | null;
  /** "Tetap" atau "Bergilir" */
  rotation_mode: string;
  /** Bergilir: semua anggota maju satu slot setiap sekian hari, mis. 7 */
  rotate_every_days: number;
  /** Tanggal Mulai Berlaku Jadwal = hari ke-1 pola & putaran ke-0, "YYYY-MM-DD" */
  anchor_date: string;
  description: string | null;
  /** Semua anggota, aktif di atas, lalu riwayat */
  members: GroupMemberResource[];
  /** Jumlah anggota yang belum selesai (Aktif + Akan Datang) */
  active_member_count: number;
  /** Jumlah slot di pola */
  slot_count: number;
}

/** Satu anggota BARU: karyawan + slot yang dipegangnya pada tanggal bergabung. */
export interface NewMemberPayload {
  employee_id: string;
  start_slot_id: string;
}

/**
 * Isian wizard regu kerja yang dikirim saat tambah (POST) dan ubah (PUT). "" = kosong.
 * Regu dan anggota barunya disimpan SEKALIGUS.
 */
export interface WorkGroupPayload {
  name: string;
  sub_unit_id: string;
  placement_object_id: string;
  work_pattern_id: string;
  leader_employee_id: string;
  rotation_mode: string;
  rotate_every_days: number;
  anchor_date: string;
  description: string;
  /** Anggota baru (boleh kosong = simpan tanpa menambah anggota) */
  members: NewMemberPayload[];
  /** Tanggal bergabung anggota baru. Saat tambah regu = anchor_date. */
  members_start_date: string;
}

/** Akhiri keanggotaan: PUT /api/work-groups/{id}/members/{memberId} */
export interface EndMemberPayload {
  end_date: string;
}

// ---------------------------------------------------------------------------
// Proyeksi jadwal (dihitung dari rumus rotasi, TIDAK disimpan)
// ---------------------------------------------------------------------------

/** Satu sel proyeksi: anggota × tanggal. */
export interface ProjectionCell {
  date: string;
  /** null = anggota tidak aktif pada tanggal itu */
  slot_code: string | null;
  /** null = libur (atau tidak aktif) */
  shift_id: string | null;
}

/** Satu baris proyeksi: satu anggota. */
export interface ProjectionRow {
  member_id: string;
  employee: { id: string; name: string };
  cells: ProjectionCell[];
}

/** Slot kosong pada suatu tanggal yang shiftnya tidak ada yang mengisi. */
export interface ProjectionVacancy {
  date: string;
  slot_code: string;
  shift_id: string;
}

/** Hasil GET /api/work-groups/{id}/projection?from=&to= */
export interface ProjectionResource {
  from: string;
  to: string;
  /** Semua tanggal dari `from` sampai `to` */
  dates: string[];
  rows: ProjectionRow[];
  /** Hanya slot kosong yang punya shift (bukan libur) */
  vacancies: ProjectionVacancy[];
}
