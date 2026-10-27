/**
 * HARI LIBUR CONTOH (data awal mock) — BUKAN kalender libur resmi.
 * Kalender resmi nanti diisi Admin SDM sesuai SKB pemerintah setiap tahun.
 */

/** Hari libur seperti yang DISIMPAN. */
export interface HolidayRecord {
  id: string;
  date: string;
  name: string;
  type: string;
  description: string | null;
}

export const mockHolidays: HolidayRecord[] = [
  { id: "libur-2026-01-01", date: "2026-01-01", name: "Tahun Baru Masehi", type: "Libur Nasional", description: null },
  { id: "libur-2026-05-01", date: "2026-05-01", name: "Hari Buruh Internasional", type: "Libur Nasional", description: null },
  { id: "libur-2026-06-01", date: "2026-06-01", name: "Hari Lahir Pancasila", type: "Libur Nasional", description: null },
  { id: "libur-2026-08-17", date: "2026-08-17", name: "Hari Kemerdekaan RI", type: "Libur Nasional", description: null },
  {
    id: "libur-2026-11-11",
    date: "2026-11-11",
    name: "Libur Perusahaan (contoh)",
    type: "Libur Perusahaan",
    description: "Contoh penanda libur di kalender jadwal November.",
  },
  { id: "libur-2026-12-24", date: "2026-12-24", name: "Cuti Bersama Natal", type: "Cuti Bersama", description: null },
  { id: "libur-2026-12-25", date: "2026-12-25", name: "Hari Raya Natal", type: "Libur Nasional", description: null },
];
