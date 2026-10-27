/**
 * Alat bantu tanggal. Di aplikasi ini tanggal disimpan & dikirim sebagai teks
 * "YYYY-MM-DD" (mis. "1990-05-20"), dan ditampilkan sebagai "20 Mei 1990".
 */

/** Ubah "YYYY-MM-DD" menjadi Date (jam 00:00 waktu setempat). */
export function parseDate(text: string): Date {
  const [year, month, day] = text.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Ubah Date menjadi "YYYY-MM-DD". */
export function toDateText(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Usia dalam tahun penuh pada tanggal `today`, mis. lahir 1990-05-20 -> 36 (per Okt 2026). */
export function getAge(birthDate: string, today: Date = new Date()): number {
  const birth = parseDate(birthDate);
  let age = today.getFullYear() - birth.getFullYear();

  // Belum berulang tahun di tahun ini -> kurangi satu.
  const birthdayThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (today < birthdayThisYear) age--;

  return age;
}

/**
 * Jumlah BULAN penuh sejak `dateText` sampai `today`. Dipakai untuk usia dan masa kerja.
 * Cth. sejak 1971-02-20, hari ini 2026-10-09 -> 55 tahun 7 bulan -> 667.
 */
export function monthsSince(dateText: string, today: Date = new Date()): number {
  const start = parseDate(dateText);
  let months = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());

  // Tanggalnya belum tercapai di bulan ini -> bulan ini belum genap.
  if (today.getDate() < start.getDate()) months--;

  return months;
}

/** Usia dalam BULAN penuh pada tanggal `today` (dipakai untuk mengurutkan usia). */
export function getAgeInMonths(birthDate: string, today: Date = new Date()): number {
  return monthsSince(birthDate, today);
}

/**
 * Lama waktu dari jumlah bulan (bulan 0 / tahun 0 tidak ditulis):
 *   667 -> "55 tahun 7 bulan";  660 -> "55 tahun";  5 -> "5 bulan";  0 -> "kurang dari 1 bulan"
 */
export function formatMonths(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) return months === 0 ? "kurang dari 1 bulan" : `${months} bulan`;
  return months === 0 ? `${years} tahun` : `${years} tahun ${months} bulan`;
}

/**
 * Tanggal `date` ditambah sekian bulan. Kalau tanggalnya tidak ada di bulan tujuan,
 * dipakai tanggal terakhir bulan itu: 31 Jan + 1 bulan -> 28/29 Feb (bukan 3 Maret).
 */
export function addMonths(date: Date, months: number): Date {
  const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + months + 1, 0).getDate();
  return new Date(date.getFullYear(), date.getMonth() + months, Math.min(date.getDate(), lastDayOfTargetMonth));
}

/** Nama bulan, urut dari Januari (indeks 0). */
export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Selisih hari dari `from` ke `to` (bisa negatif): ("2026-10-05", "2026-10-14") -> 9. */
export function daysBetween(from: string, to: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / msPerDay);
}

/** Tanggal ditambah sekian hari: ("2026-10-31", 1) -> "2026-11-01". */
export function addDays(dateText: string, days: number): string {
  const date = parseDate(dateText);
  date.setDate(date.getDate() + days);
  return toDateText(date);
}

/** Hari dalam seminggu: 1 = Senin ... 7 = Minggu. */
export function isoWeekday(dateText: string): number {
  return ((parseDate(dateText).getDay() + 6) % 7) + 1;
}

/** Senin pada minggu tanggal ini: "2026-10-10" (Sabtu) -> "2026-10-05". */
export function mondayOf(dateText: string): string {
  return addDays(dateText, 1 - isoWeekday(dateText));
}

/** Nama hari dari teks tanggal: "2026-10-12" -> "Senin". */
export function formatDayName(text: string): string {
  return parseDate(text).toLocaleDateString("id-ID", { weekday: "long" });
}

/** "2026-10-08" -> "8 Oktober 2026". Teks kosong -> "". */
export function formatDate(text: string | null): string {
  if (!text) return "";
  return parseDate(text).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/** "2026-10-09T08:15:00.000Z" -> "9 Oktober 2026, 15.15" (jam setempat). */
export function formatDateTime(isoText: string): string {
  return new Date(isoText).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
