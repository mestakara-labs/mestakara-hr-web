/**
 * KARYAWAN CONTOH (DUMMY) beserta biografi, riwayat pendidikan, dan data batihnya.
 *
 * Karyawan dibuat otomatis oleh `position()` (helpers.ts): setiap jabatan di SK
 * mendapat 1 atau beberapa karyawan contoh, dan semuanya dikumpulkan di
 * `seedEmployees` (helpers.ts). Siapa memegang jabatan apa dicatat di
 * penugasan (assignments.ts).
 *
 * Isinya dibuat dengan POLA TETAP (bukan acak), jadi datanya selalu sama
 * setiap kali server dijalankan.
 */
import { isNikRequired } from "@/lib/employee-rules";
import type { EducationItem, EmployeeProfileResource, FamilyMemberItem } from "@/types/api/employee";

/**
 * Karyawan seperti yang DISIMPAN. Tanpa isian yang dihitung saat data dibaca:
 *   - `position`           (dari penugasan jabatan yang aktif)
 *   - `education`, `major` (dari jenjang tertinggi di `educations`)
 *   - status kepegawaian   (`active_status`, `inactive_since`, `service_months`, dari usulan Penambahan / Penonaktifan)
 *   - kelengkapan          (`missing_fields`)
 *   - alamat file          (`certificate_file_url`)
 * Ditambah `file_data`: ISI file yang diunggah (khusus data mock, supaya file bisa dibuka lagi).
 */
export type EmployeeRecord = Omit<
  EmployeeProfileResource,
  "position" | "active_positions" | "education" | "major" | "educations" | "active_status" | "inactive_since" | "service_months" | "missing_fields"
> & {
  educations: EducationItem[];
  /**
   * Isi file dalam teks base64, per kunci "ijazah-<id pendidikan>".
   * File tanpa isi (data contoh) dibuka sebagai PDF contoh.
   */
  file_data: Record<string, string>;
};

const MALE_NAMES = ["Asep", "Dedi", "Ujang", "Budi", "Agus", "Dadang", "Hendra", "Iwan", "Rudi", "Cecep"];
const FEMALE_NAMES = ["Siti", "Rina", "Neng", "Euis", "Yanti", "Lina", "Wulan", "Dewi", "Nita", "Sri"];
const LAST_NAMES = [
  "Saepudin", "Rahmawati", "Kurniawan", "Hidayat", "Permana", "Nurhayati",
  "Setiawan", "Lestari", "Gunawan", "Suryani", "Firmansyah", "Komalasari",
];
const CITIES = ["Bandung", "Bogor", "Sukabumi", "Garut", "Cianjur", "Subang", "Tasikmalaya", "Purwakarta"];
const OCCUPATIONS = ["Ibu Rumah Tangga", "Wiraswasta", "Guru", "Karyawan Swasta", "PNS"];

/** Pendidikan terakhir contoh menurut level BRM: makin tinggi jabatannya, makin tinggi pendidikannya. */
const LAST_EDUCATION_BY_BRM: Record<number, { level: string; major: string | null }[]> = {
  1: [{ level: "S2", major: "Manajemen" }],
  2: [{ level: "S2", major: "Manajemen" }, { level: "S1", major: "Agribisnis" }],
  3: [{ level: "S1", major: "Akuntansi" }, { level: "S1", major: "Teknik Sipil" }, { level: "S1", major: "Pariwisata" }],
  4: [{ level: "S1", major: "Administrasi Bisnis" }, { level: "D3", major: "Perhotelan" }],
  5: [{ level: "D3", major: "Akuntansi" }, { level: "SMA/SMK", major: "IPS" }],
  6: [{ level: "SMA/SMK", major: "Teknik Mesin" }, { level: "SMP", major: null }],
};

/** Keterangan setiap jenjang contoh: lama studi, usia saat lulus, dan nama sekolah/kampusnya. */
const EDUCATION_STEPS: Record<string, { years: number; graduationAge: number; institution: (city: string) => string }> = {
  SD: { years: 6, graduationAge: 12, institution: (city) => `SD Negeri 1 ${city}` },
  SMP: { years: 3, graduationAge: 15, institution: (city) => `SMP Negeri 2 ${city}` },
  "SMA/SMK": { years: 3, graduationAge: 18, institution: (city) => `SMA Negeri 3 ${city}` },
  D3: { years: 3, graduationAge: 21, institution: () => "Politeknik Negeri Bandung" },
  S1: { years: 4, graduationAge: 22, institution: () => "Universitas Padjadjaran" },
  S2: { years: 2, graduationAge: 25, institution: () => "Institut Teknologi Bandung" },
};

/** Gelar belakang S1 contoh menurut jurusan. */
const S1_TITLE_BY_MAJOR: Record<string, string> = {
  Akuntansi: "S.E.",
  Manajemen: "S.E.",
  Agribisnis: "S.P.",
  "Teknik Sipil": "S.T.",
  Pariwisata: "S.Par.",
  "Administrasi Bisnis": "S.A.B.",
};

/**
 * Tanggal lahir TETAP untuk beberapa karyawan contoh (karpel, Karyawan Tetap, pensiun usia 55),
 * supaya kolom "Status Pensiun" di Data Karyawan punya contoh di kategori yang dekat
 * (dihitung per Oktober 2026):
 *   pegawai-0028 -> pensiun 1 Nov 2026  (≤ 1 bulan)
 *   pegawai-0160 -> pensiun 20 Des 2026 (> 1 ≤ 3 bulan)
 *   pegawai-0179 -> pensiun 15 Mar 2027 (> 3 ≤ 6 bulan)
 */
const NEAR_RETIREMENT_BIRTH_DATES: Record<string, string> = {
  "pegawai-0028": "1971-11-01",
  "pegawai-0160": "1971-12-20",
  "pegawai-0179": "1972-03-15",
};

/**
 * Buat `count` karyawan contoh untuk jabatan dengan level `brmLevel`.
 * `firstNumber` = nomor urut karyawan pertama, mis. 12 -> "pegawai-0012", "pegawai-0013", ...
 *
 * Nomor telepon sengaja memakai awalan 0800 (nomor bebas pulsa, bukan nomor HP),
 * supaya tombol WhatsApp bisa dicoba tanpa mengirim chat ke orang sungguhan.
 */
export function createDummyEmployees(count: number, brmLevel: number, firstNumber: number): EmployeeRecord[] {
  const employees: EmployeeRecord[] = [];

  for (let i = 0; i < count; i++) {
    const n = firstNumber + i;
    const id = `pegawai-${String(n).padStart(4, "0")}`;

    // Laki-laki dan perempuan berselang-seling, tapi tidak persis 50:50.
    const isFemale = n % 5 === 1 || n % 5 === 3;
    const firstNames = isFemale ? FEMALE_NAMES : MALE_NAMES;
    const firstName = firstNames[n % firstNames.length];
    const lastName = LAST_NAMES[Math.floor(n / 10) % LAST_NAMES.length];

    // Usia 21–56 tahun; pimpinan (BRM kecil) cenderung lebih tua.
    // Beberapa karyawan sengaja dibuat mendekati usia pensiun (55/56 tahun).
    const age = Math.min(56, 21 + ((n * 7) % 33) + (6 - brmLevel) * 2);
    const birthYear = 2026 - age;
    // Tanggal masuk contoh: usia 21–24 tahun, paling lambat 2021 (sebelum penugasan contoh pertama),
    // tapi minimal usia 18 tahun (karyawan termuda lahir 2005 -> masuk 2023, sebelum SK Nov 2023).
    const hireYear = Math.max(birthYear + 18, Math.min(2021, birthYear + 21 + (n % 4)));
    const city = CITIES[n % CITIES.length];
    const employmentStatus = dummyEmploymentStatus(n, brmLevel);
    // Sebagian karyawan casual / daily worker sengaja dibuat tanpa NIK (NIK opsional untuk mereka).
    const hasNik = isNikRequired(employmentStatus) || n % 2 === 0;
    const maritalStatus = age < 26 ? "Belum Kawin" : "Kawin";

    employees.push({
      id,
      employment_status: employmentStatus,
      nik: hasNik ? `2023${String(n).padStart(4, "0")}` : null,
      registration_number: null,
      name: `${firstName} ${lastName}`,
      ktp_number: `3201${String(birthYear).slice(2)}${String(n).padStart(10, "0")}`,
      gender: isFemale ? "Perempuan" : "Laki-laki",
      birth_place: city,
      birth_date:
        NEAR_RETIREMENT_BIRTH_DATES[id] ??
        `${birthYear}-${String((n % 12) + 1).padStart(2, "0")}-${String((n % 28) + 1).padStart(2, "0")}`,
      // Bulan Januari–Oktober saja, supaya tetap sebelum SK struktur organisasi (9 Nov 2023).
      hire_date: `${hireYear}-${String((n % 10) + 1).padStart(2, "0")}-01`,
      religion: n % 13 === 0 ? "Kristen" : n % 17 === 0 ? "Katolik" : "Islam",
      marital_status: maritalStatus,
      phone: `0800-1000-${String(n).padStart(4, "0")}`,
      // Sebagian karyawan punya nomor WhatsApp tersendiri; sisanya sama dengan nomor telepon (null).
      whatsapp: n % 3 === 0 ? `0800-2000-${String(n).padStart(4, "0")}` : null,
      email: `${firstName}.${lastName}@agrowisata.test`.toLowerCase(),
      address: `Jl. Raya ${city} No. ${(n % 90) + 1}, ${city}`,
      photo_url: null,
      educations: createDummyEducations(id, n, brmLevel, birthYear, city),
      family_members:
        maritalStatus === "Kawin" ? createDummyFamily(id, n, isFemale, lastName, birthYear, city) : [],
      // Dasar penambahannya (SK struktur organisasi) ada di usulan Penambahan "data awal" (activations.ts).
      file_data: {},
    });
  }

  return employees;
}

/**
 * Status karyawan contoh: pimpinan (BRM-1 s.d. BRM-4) selalu karyawan tetap;
 * makin ke bawah makin banyak karyawan PKWT, casual, dan daily worker.
 */
function dummyEmploymentStatus(n: number, brmLevel: number): string {
  if (brmLevel <= 4) return "Karyawan Tetap";
  if (brmLevel === 5) return n % 3 === 0 ? "Karyawan PKWT" : "Karyawan Tetap";

  const statuses = ["Karyawan Tetap", "Karyawan PKWT", "Karyawan Casual", "Karyawan Daily Worker"];
  return statuses[n % statuses.length];
}

/**
 * Riwayat pendidikan contoh: dari SD sampai pendidikan terakhirnya, jenjang tertinggi di atas.
 * Lulusan S2 menempuh S1 dulu; lulusan D3 tidak menempuh S1.
 */
function createDummyEducations(
  employeeId: string,
  n: number,
  brmLevel: number,
  birthYear: number,
  city: string,
): EducationItem[] {
  const choices = LAST_EDUCATION_BY_BRM[brmLevel] ?? LAST_EDUCATION_BY_BRM[6];
  const last = choices[n % choices.length];

  const path = ["SD", "SMP", "SMA/SMK"];
  if (last.level === "D3") path.push("D3");
  if (last.level === "S1" || last.level === "S2") path.push("S1");
  if (last.level === "S2") path.push("S2");
  const levelsTaken = path.slice(0, path.indexOf(last.level) + 1);

  const educations = levelsTaken.map((level): EducationItem => {
    const step = EDUCATION_STEPS[level];
    const graduationYear = birthYear + step.graduationAge;
    const isCollege = ["D3", "S1", "S2"].includes(level);

    // Jurusan: jenjang terakhir memakai jurusan pilihan; S1 sebelum S2 = Manajemen.
    const major = level === last.level ? last.major : level === "S1" ? "Manajemen" : null;

    let titleBack: string | null = null;
    if (level === "D3") titleBack = "A.Md.";
    if (level === "S1") titleBack = S1_TITLE_BY_MAJOR[major ?? ""] ?? "S.E.";
    if (level === "S2") titleBack = "M.M.";

    return {
      id: `${employeeId}-pendidikan-${level.replace("/", "-").toLowerCase()}`,
      level,
      institution: step.institution(city),
      major,
      city: isCollege ? "Bandung" : city,
      start_year: String(graduationYear - step.years),
      graduation_year: String(graduationYear),
      gpa: isCollege ? `3,${String(10 + (n % 80)).padStart(2, "0")}` : null,
      title_front: null,
      title_back: titleBack,
      certificate_number: `IJZ-${graduationYear}-${String(n).padStart(4, "0")}`,
      certificate_file: null,
    };
  });

  return educations.reverse();
}

/** Data batih contoh: pasangan + 0–3 anak. Anak berusia 21 tahun ke atas tidak lagi ditanggung. */
function createDummyFamily(
  employeeId: string,
  n: number,
  isFemale: boolean,
  lastName: string,
  birthYear: number,
  city: string,
): FamilyMemberItem[] {
  const spouseFirstNames = isFemale ? MALE_NAMES : FEMALE_NAMES;

  const members: FamilyMemberItem[] = [
    {
      id: `${employeeId}-batih-pasangan`,
      relationship: isFemale ? "Suami" : "Istri",
      name: `${spouseFirstNames[(n + 3) % spouseFirstNames.length]} ${LAST_NAMES[(n + 5) % LAST_NAMES.length]}`,
      ktp_number: null,
      gender: isFemale ? "Laki-laki" : "Perempuan",
      birth_place: city,
      birth_date: `${birthYear + 1}-0${(n % 9) + 1}-1${n % 9}`,
      occupation: OCCUPATIONS[n % OCCUPATIONS.length],
      dependent_status: "Ditanggung",
    },
  ];

  const childCount = n % 4; // 0–3 anak
  for (let child = 1; child <= childCount; child++) {
    const childBirthYear = birthYear + 25 + child * 2;
    if (childBirthYear > 2025) break; // karyawan yang masih muda belum punya anak sebanyak itu

    const isDaughter = (n + child) % 2 === 0;
    const childFirstNames = isDaughter ? FEMALE_NAMES : MALE_NAMES;

    members.push({
      id: `${employeeId}-batih-anak-${child}`,
      relationship: "Anak",
      name: `${childFirstNames[(n + child) % childFirstNames.length]} ${lastName}`,
      ktp_number: null,
      gender: isDaughter ? "Perempuan" : "Laki-laki",
      birth_place: city,
      birth_date: `${childBirthYear}-0${(child % 9) + 1}-15`,
      occupation: null,
      dependent_status: 2026 - childBirthYear >= 21 ? "Tidak ditanggung" : "Ditanggung",
    });
  }

  return members;
}
