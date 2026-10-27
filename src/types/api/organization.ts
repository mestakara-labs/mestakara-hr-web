/**
 * Satu pegawai yang memegang sebuah jabatan, diambil dari PENUGASAN JABATAN yang aktif.
 * Kalau seorang karyawan memegang dua jabatan (mis. Definitif + Plt), ia muncul dua kali:
 * sekali di setiap jabatan, dengan `assignment_id` yang berbeda.
 */
export interface EmployeeResource {
  /** Id karyawan */
  id: string;
  /** Id penugasan jabatannya */
  assignment_id: string;
  /** "Definitif", "Plt", dst. */
  assignment_status: string;
  nik: string;
  name: string;
  email: string;
  /** Nomor telepon, mis. "0812-3456-7890" */
  phone: string;
  /** Nomor WhatsApp; sama dengan `phone` kalau karyawan tidak punya nomor WA tersendiri */
  whatsapp: string;
  sub_unit_name: string;
  /** Nama objek penempatan, bisa lebih dari satu. Kosong = tanpa objek. */
  placement_object_names: string[];
  /**
   * Id PENUGASAN atasan langsungnya (garis staffing per orang), diatur per orang (lihat menu Jabatan Karyawan).
   * Kosong untuk pimpinan utama. Bisa lebih dari satu.
   */
  supervisor_assignment_ids: string[];
}

/**
 * Satu jabatan di struktur organisasi.
 *
 * Contoh:
 *   {
 *     id: "asisten-personalia",
 *     code: "JAB-015",
 *     title: "Asisten Personalia",
 *     division_id: "administrasi-keuangan",
 *     division_name: "Administrasi & Keuangan",
 *     brm_level: 3,
 *     job_grade: 12,
 *     description: null,
 *     employees: [ { id, assignment_id, nik, name, ... } ],
 *   }
 */
export interface PositionResource {
  id: string;
  /** Kode jabatan, mis. "JAB-015" */
  code: string;
  title: string;
  /** Id bidang (master Bidang). null untuk jabatan BRM-1 yang tidak masuk bidang mana pun. */
  division_id: string | null;
  /** Nama bidangnya, mis. "Umum dan Legal". Ikut dikirim supaya tidak perlu dicari lagi. */
  division_name: string | null;
  /**
   * Level jabatan BRM: 1 = pimpinan utama (Manager), 2 = Asisten Manager, dst. sampai 6.
   * Di SK masih memakai istilah "Strata" dengan urutan terbalik: BRM-1 = Strata 6, BRM-6 = Strata 1.
   */
  brm_level: number;
  /** Job Grade jabatan, angka bulat 1–99. null = belum diisi (tampil "-"). */
  job_grade: number | null;
  /** Keterangan tambahan, mis. wilayah cakupan "Bogor, Sukabumi". null kalau tidak ada. */
  description: string | null;
  /**
   * Pegawai yang memegang jabatan ini (bisa lebih dari satu orang), dari penugasan aktif.
   * Garis atasan di bagan digambar per ORANG dari `employees[].supervisor_assignment_ids`.
   */
  employees: EmployeeResource[];
}

/** Isian form jabatan yang dikirim saat tambah (POST) dan ubah (PUT). */
export interface PositionPayload {
  code: string;
  title: string;
  /** null kalau Level BRM belum dipilih */
  brm_level: number | null;
  /** null = Job Grade dikosongkan */
  job_grade: number | null;
  /** Kosongkan ("") untuk jabatan BRM-1 tanpa bidang */
  division_id: string;
  description: string;
}

/** Isi `data` dari GET /api/organization */
export interface OrganizationResource {
  /** Nomor SK dasar struktur organisasi */
  decree_number: string;
  /** Tanggal SK, format "YYYY-MM-DD" */
  decree_date: string;
  positions: PositionResource[];
}
