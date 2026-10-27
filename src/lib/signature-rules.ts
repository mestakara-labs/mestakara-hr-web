/**
 * ATURAN MENU PENANDA TANGAN (Daftar Upah & SPKL).
 * Bentuk datanya dijelaskan di src/types/api/signature.ts.
 */
import type { SignatureSummary } from "@/types/api/signature";

/** Tempat penandatanganan bawaan. */
export const DEFAULT_SIGNING_PLACE = "Gunung Mas";

/** Contoh nama bagian, untuk placeholder isian. */
export const SECTION_LABEL_EXAMPLES = ["Dibuat Oleh", "Diperiksa Oleh", "Perhitungan Dibenarkan Oleh", "Disetujui Oleh"];

/** Pemilik penanda tangan selain Umum: per Kelompok Daftar Upah atau per Bidang. */
export type SignatureOwnerKind = "kelompok" | "bidang";

/** Judul, alamat API, dan alamat halaman setiap jenis pemilik. */
export const SIGNATURE_OWNERS: Record<SignatureOwnerKind, { title: string; apiPath: string; pagePath: string }> = {
  kelompok: {
    title: "Kelompok Daftar Upah",
    apiPath: "/api/signature-settings/payroll-groups",
    pagePath: "/dashboard/upah/penanda-tangan/kelompok",
  },
  bidang: {
    title: "Bidang",
    apiPath: "/api/signature-settings/divisions",
    pagePath: "/dashboard/upah/penanda-tangan/bidang",
  },
};

/** Ringkasan susunan untuk tabel: { 3, 4 } -> "3 bagian · 4 orang"; null -> "Memakai penanda tangan Umum". */
export function describeSignatureSummary(summary: SignatureSummary): string {
  return summary ? `${summary.sections} bagian · ${summary.signers} orang` : "Memakai penanda tangan Umum";
}
