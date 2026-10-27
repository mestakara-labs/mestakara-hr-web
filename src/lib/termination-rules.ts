/**
 * ATURAN PENONAKTIFAN KARYAWAN (usulan Penonaktifan), dipakai wizard (browser) DAN data mock (server).
 *
 * Satu usulan = satu atau banyak karyawan AKTIF yang menjadi NONAKTIF mulai TMT masing-masing:
 *
 *   Draf ──(Simpan & Berlakukan)──> Berlaku ──(Batalkan)──> Dibatalkan
 *
 * Status usulannya sama dengan Penambahan (lihat ACTIVATION_STATUS di activation-rules.ts).
 * Dokumen dasar WAJIB (hanya unggah, tanpa template): Kolektif atau Per Orang.
 *
 * Saat berlaku: jabatan & keanggotaan regu diakhiri sehari sebelum TMT, dan bawahannya
 * otomatis dialihkan ke atasan karyawan itu.
 */
import { ACTIVATION_STATUS } from "./activation-rules";

/** Jenis penonaktifan. */
export const TERMINATION_TYPE = {
  retirement: "Pensiun",
  earlyRetirement: "Pensiun Dini",
  resignation: "Mengundurkan Diri",
  dismissal: "PHK",
  contractEnd: "Kontrak Berakhir",
  transferOut: "Mutasi Keluar",
  death: "Meninggal Dunia",
} as const;

export const TERMINATION_TYPES = Object.values(TERMINATION_TYPE) as string[];

/** Pilihan jenis + keterangan singkat (untuk pilihan di wizard). */
export const TERMINATION_TYPE_OPTIONS = [
  { value: TERMINATION_TYPE.retirement, description: "Mencapai usia pensiun. TMT otomatis dari tanggal pensiun." },
  { value: TERMINATION_TYPE.earlyRetirement, description: "Pensiun sebelum usia pensiun (alasan wajib)." },
  { value: TERMINATION_TYPE.resignation, description: "Karyawan mengundurkan diri." },
  { value: TERMINATION_TYPE.dismissal, description: "Pemutusan hubungan kerja (alasan wajib)." },
  { value: TERMINATION_TYPE.contractEnd, description: "Masa kontrak (PKWT) berakhir." },
  { value: TERMINATION_TYPE.transferOut, description: "Pindah ke unit / regional / anak perusahaan lain." },
  { value: TERMINATION_TYPE.death, description: "Karyawan meninggal dunia." },
];

/** Usulan yang masih bisa diubah isinya (hanya Draf). */
export function isTerminationEditable(status: string): boolean {
  return status === ACTIVATION_STATUS.draft;
}

/** Jenis yang wajib disertai alasan. */
export function requiresTerminationReason(type: string): boolean {
  return type === TERMINATION_TYPE.dismissal || type === TERMINATION_TYPE.earlyRetirement;
}

/** Jenis yang wajib disertai unit tujuan. */
export function requiresDestinationUnit(type: string): boolean {
  return type === TERMINATION_TYPE.transferOut;
}
