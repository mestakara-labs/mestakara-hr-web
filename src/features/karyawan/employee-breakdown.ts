/**
 * Hitungan untuk kartu "Sebaran Karyawan per Status Karyawan" di halaman Data Karyawan.
 *
 * Hasilnya tabel silang: satu baris per kelompok (mis. per Sub Unit), satu kolom per Status Karyawan.
 *
 *   Sub Unit          | Tetap | PKWT | Casual | Daily Worker | Total
 *   Kantor Induk      |   40  |  10  |   5    |      3       |   58
 *   Gunung Mas        |   ... |      |        |              |
 *   Belum ditempatkan |   ... |      |        |              |
 *
 * CARA MENAMBAH PENGELOMPOKAN BARU (mis. per Agama):
 *   tambahkan satu objek ke BREAKDOWN_GROUPS di bawah. Tab di kartu ikut bertambah sendiri.
 */
import { BRM_LEVEL_ORDER, getBrmLevel } from "@/features/organisasi/brm-level";
import { EDUCATION_OPTIONS, EMPLOYMENT_STATUS_OPTIONS, GENDER_OPTIONS } from "@/lib/employee-rules";
import type { EmployeeProfileResource } from "@/types/api/employee";

/** Nama baris untuk karyawan yang belum memegang jabatan apa pun. */
export const UNPLACED = "Belum ditempatkan";
/** Nama baris untuk data yang belum diisi, mis. jenis kelamin draf karyawan. */
const NOT_FILLED = "Belum diisi";
const NO_DIVISION = "Tanpa Bidang";
const NO_OBJECT = "Tanpa Objek";
const NO_CATEGORY = "Tanpa Kategori";

/** Baris-baris "kosong" ini selalu diletakkan paling bawah. */
const LAST_ROWS = [NO_DIVISION, NO_OBJECT, NO_CATEGORY, NOT_FILLED, UNPLACED];

/** Kolom status: label ringkas, mis. "Karyawan PKWT" -> "PKWT". */
export const STATUS_COLUMNS = EMPLOYMENT_STATUS_OPTIONS.map((status) => ({
  status,
  label: status.replace("Karyawan ", ""),
}));

/** Satu cara mengelompokkan karyawan (= satu tab di kartu). */
interface BreakdownGroup {
  /** Kunci tab, mis. "subUnit" */
  value: string;
  /** Judul tab & judul kolom pertama, mis. "Sub Unit" */
  label: string;
  /** Nama kelompok seorang karyawan, mis. "Kantor Induk" */
  groupOf: (employee: EmployeeProfileResource) => string;
  /**
   * Urutan baris yang tetap, mis. ["BRM-1", "BRM-2", ...].
   * Kosong = baris diurutkan dari jumlah karyawan terbanyak.
   */
  order?: string[];
}

/** Daftar pengelompokan, urut sesuai urutan tab. */
export const BREAKDOWN_GROUPS: BreakdownGroup[] = [
  {
    value: "subUnit",
    label: "Sub Unit",
    groupOf: (employee) => employee.position?.sub_unit.name ?? UNPLACED,
  },
  {
    value: "division",
    label: "Bidang",
    groupOf: (employee) => (employee.position ? (employee.position.division?.name ?? NO_DIVISION) : UNPLACED),
  },
  {
    value: "placementObject",
    label: "Objek Penempatan",
    groupOf: (employee) => (employee.position ? (employee.position.placement_object?.name ?? NO_OBJECT) : UNPLACED),
  },
  {
    value: "placementCategory",
    label: "Kategori Objek",
    groupOf: (employee) => {
      if (!employee.position) return UNPLACED;
      if (!employee.position.placement_object) return NO_OBJECT;
      return employee.position.placement_object.category_name ?? NO_CATEGORY;
    },
  },
  {
    value: "brmLevel",
    label: "Level BRM",
    groupOf: (employee) => (employee.position ? getBrmLevel(employee.position.brm_level).label : UNPLACED),
    order: BRM_LEVEL_ORDER.map((level) => getBrmLevel(level).label),
  },
  {
    value: "gender",
    label: "Jenis Kelamin",
    groupOf: (employee) => employee.gender ?? NOT_FILLED,
    order: GENDER_OPTIONS,
  },
  {
    value: "education",
    label: "Pendidikan",
    // Server mengirim "-" kalau riwayat pendidikan masih kosong.
    groupOf: (employee) => (employee.education === "-" ? NOT_FILLED : employee.education),
    order: EDUCATION_OPTIONS,
  },
];

/** Satu baris tabel sebaran. */
export interface BreakdownRow {
  /** Nama kelompok, mis. "Kantor Induk" */
  label: string;
  /** Jumlah karyawan per status, urutannya sama dengan STATUS_COLUMNS */
  counts: number[];
  total: number;
}

/** Hasil hitungan satu tab: baris-baris kelompok + satu baris Total. */
export interface BreakdownTable {
  rows: BreakdownRow[];
  totalRow: BreakdownRow;
}

/**
 * Hitung tabel sebaran untuk satu pengelompokan.
 *
 * Langkahnya:
 *   1. kelompokkan karyawan dengan `group.groupOf`
 *   2. hitung jumlah per status di setiap kelompok
 *   3. urutkan baris (lihat sortRows)
 *   4. hitung baris Total
 */
export function calculateBreakdown(employees: EmployeeProfileResource[], group: BreakdownGroup): BreakdownTable {
  // 1. Nama kelompok -> karyawan di kelompok itu
  const employeesPerGroup = new Map<string, EmployeeProfileResource[]>();
  for (const employee of employees) {
    const groupName = group.groupOf(employee);
    employeesPerGroup.set(groupName, [...(employeesPerGroup.get(groupName) ?? []), employee]);
  }

  // 2. Satu baris per kelompok
  const rows = [...employeesPerGroup.entries()].map(([label, members]) => toRow(label, members));

  // 3 & 4
  return { rows: sortRows(rows, group.order), totalRow: toRow("Total", employees) };
}

/** Satu baris: jumlah karyawan per status + totalnya. */
function toRow(label: string, employees: EmployeeProfileResource[]): BreakdownRow {
  return {
    label,
    counts: STATUS_COLUMNS.map(
      (column) => employees.filter((employee) => employee.employment_status === column.status).length,
    ),
    total: employees.length,
  };
}

/**
 * Urutan baris:
 *   - kalau ada `order` (mis. Level BRM): ikut urutan itu;
 *   - kalau tidak: dari jumlah karyawan terbanyak, lalu nama A-Z;
 *   - baris "kosong" (Belum ditempatkan, Tanpa Bidang, ...) selalu paling bawah.
 */
function sortRows(rows: BreakdownRow[], order: string[] = []): BreakdownRow[] {
  /** Posisi baris di `order`; yang tidak ada di `order` ditaruh setelahnya. */
  const orderIndex = (label: string) => (order.includes(label) ? order.indexOf(label) : order.length);

  return [...rows].sort((a, b) => {
    const aIsLast = LAST_ROWS.includes(a.label) ? 1 : 0;
    const bIsLast = LAST_ROWS.includes(b.label) ? 1 : 0;
    if (aIsLast !== bIsLast) return aIsLast - bIsLast;

    if (order.length > 0 && orderIndex(a.label) !== orderIndex(b.label)) {
      return orderIndex(a.label) - orderIndex(b.label);
    }

    return b.total - a.total || a.label.localeCompare(b.label, "id");
  });
}
