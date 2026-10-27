/**
 * PENANDA TANGAN DOKUMEN UPAH (Daftar Upah & SPKL), diatur di menu Penanda Tangan.
 *
 * Satu SUSUNAN = beberapa BAGIAN berurutan; setiap bagian berisi satu orang atau lebih:
 *
 *   [ { label: "Dibuat Oleh",    signers: [ Herma (manual) ] },
 *     { label: "Diperiksa Oleh", signers: [ Asep (karyawan), Iyus (manual) ] }, ... ]
 *
 * Susunan diatur di tiga tempat: Umum, per Kelompok Daftar Upah, dan per Bidang.
 * Kelompok / bidang yang susunannya null memakai susunan Umum (begitu juga tempatnya).
 * Sheet REKAP, "Tanpa Kelompok", dan "Tanpa Bidang" selalu memakai Umum.
 * Aturan tampilannya ada di src/lib/signature-rules.ts.
 */

/** Asal orang penanda tangan: dipilih dari daftar karyawan, atau nama & jabatan diketik. */
export type SignerSource = "karyawan" | "manual";

/** Satu orang seperti yang DIKIRIM saat menyimpan. */
export type SignerPayload = { source: "karyawan"; employee_id: string } | { source: "manual"; name: string; position: string };

/**
 * Satu orang seperti yang dikirim server. Untuk "karyawan", nama & jabatan selalu dari data karyawan
 * terbaru (tidak bisa diubah); untuk "manual", apa adanya seperti diketik.
 */
export interface SignerResource {
  source: SignerSource;
  employee_id: string | null;
  name: string;
  position: string;
}

/** Satu bagian tanda tangan, mis. "Diperiksa Oleh" berisi dua orang. */
export interface SignatureSection<TSigner> {
  label: string;
  signers: TSigner[];
}

/** Isi `data` GET /api/signature-settings/general (penanda tangan Umum). */
export interface GeneralSignatureSetting {
  /** Tempat penandatanganan, mis. "Gunung Mas" */
  place: string;
  payroll_sections: SignatureSection<SignerResource>[];
  spkl_sections: SignatureSection<SignerResource>[];
  updated_at: string | null;
  updated_by: string | null;
}

/** Isian PUT /api/signature-settings/general. Kedua susunan wajib berisi minimal satu bagian. */
export interface GeneralSignaturePayload {
  place: string;
  payroll_sections: SignatureSection<SignerPayload>[];
  spkl_sections: SignatureSection<SignerPayload>[];
}

/** Ringkasan satu susunan di daftar: jumlah bagian & orang. null = memakai Umum. */
export type SignatureSummary = { sections: number; signers: number } | null;

/** Satu baris daftar GET /api/signature-settings/payroll-groups atau /divisions. */
export interface OwnerSignatureSummary {
  /** Id kelompok / bidang */
  id: string;
  name: string;
  /** null = memakai tempat Umum */
  place: string | null;
  payroll: SignatureSummary;
  spkl: SignatureSummary;
}

/** Isi `data` GET /api/signature-settings/payroll-groups/{id} atau /divisions/{id}. */
export interface OwnerSignatureSetting {
  id: string;
  name: string;
  place: string | null;
  /** null = memakai susunan Umum */
  payroll_sections: SignatureSection<SignerResource>[] | null;
  spkl_sections: SignatureSection<SignerResource>[] | null;
  updated_at: string | null;
  updated_by: string | null;
}

/** Isian PUT /api/signature-settings/payroll-groups/{id} atau /divisions/{id}. */
export interface OwnerSignaturePayload {
  place: string | null;
  payroll_sections: SignatureSection<SignerPayload>[] | null;
  spkl_sections: SignatureSection<SignerPayload>[] | null;
}
