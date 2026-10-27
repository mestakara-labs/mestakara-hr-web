/**
 * Aturan validasi form yang dipakai SEMUA form di aplikasi.
 *
 * Setiap aturan mengembalikan pesan error, atau `undefined` kalau isiannya
 * sudah benar. Format pesannya seragam:
 *
 *   "<Label> wajib diisi"          kotak isian masih kosong
 *   "Pilih <Label>"                pilihan (dropdown) belum dipilih
 *   "Format <Label> tidak valid"   isian ada, tapi bentuknya salah
 *
 * Cara pakai di form — satu baris per isian, lalu serahkan ke `useFormSubmit`:
 *
 *   validate: (form) => ({
 *     // beberapa aturan untuk satu isian digabung dengan `??`:
 *     // aturan pertama yang gagal, pesannya yang ditampilkan
 *     login: requireText(form.login, "NIK / Email") ?? mustBeNikOrEmail(form.login, "NIK / Email"),
 *     password: requireText(form.password, "Kata Sandi"),
 *   }),
 *
 * Aturan format (`mustBeNikOrEmail`) tidak memeriksa isian kosong —
 * pasangkan dengan `requireText` kalau isiannya wajib.
 */

/** Kotak isian wajib diisi. */
export function requireText(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} wajib diisi`;
}

/** Pilihan (dropdown) wajib dipilih. Kosong = "" atau null. */
export function requireSelection(value: string | number | null, label: string): string | undefined {
  return value === "" || value === null ? `Pilih ${label}` : undefined;
}

/** Pilihan ganda wajib berisi minimal satu. */
export function requireAtLeastOne(values: unknown[], label: string): string | undefined {
  return values.length > 0 ? undefined : `Pilih minimal satu ${label}`;
}

/** Harus berisi angka saja, sebanyak `length` digit (mis. No. KTP 16 digit). Kosong dianggap lolos. */
export function mustBeDigits(value: string, label: string, length: number): string | undefined {
  const text = value.trim();
  if (!text) return undefined;

  return new RegExp(`^\\d{${length}}$`).test(text) ? undefined : `${label} harus ${length} digit angka`;
}

/** Harus berupa nomor telepon: angka, boleh diawali "+" dan diberi "-" atau spasi. Kosong dianggap lolos. */
export function mustBePhone(value: string, label: string): string | undefined {
  const text = value.trim();
  if (!text) return undefined;

  return /^\+?[\d\s-]{8,20}$/.test(text) ? undefined : `Format ${label} tidak valid`;
}

/** Harus berupa alamat email, mis. nama@ptpn1.co.id. Kosong dianggap lolos. */
export function mustBeEmail(value: string, label: string): string | undefined {
  const text = value.trim();
  if (!text) return undefined;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? undefined : `Format ${label} tidak valid`;
}

/**
 * Harus berupa NIK (hanya angka, mis. 10928374)
 * atau alamat email (mis. nama@ptpn1.co.id).
 */
export function mustBeNikOrEmail(value: string, label: string): string | undefined {
  const text = value.trim();
  if (!text) return undefined;

  const isNik = /^\d+$/.test(text);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

  return isNik || isEmail ? undefined : `Format ${label} tidak valid`;
}
