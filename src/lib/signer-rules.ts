/**
 * ATURAN PENANDATANGAN DOKUMEN, dipakai semua fitur yang punya SK (Penambahan, Penonaktifan, Mutasi).
 * Dipakai form (browser) DAN data mock (server).
 *
 * Penandatangan bisa berasal dari:
 *   - Unit             -> pilih pejabat dari penugasan AKTIF di unit ini (mis. Manager)
 *   - Kantor Regional  -> pejabat di luar data unit: nama & jabatan DIKETIK
 *   - Head Office      -> sama seperti Kantor Regional
 */

export const SIGNER_SOURCE = {
  unit: "Unit",
  regional: "Kantor Regional",
  headOffice: "Head Office",
} as const;

export const SIGNER_SOURCES = Object.values(SIGNER_SOURCE) as string[];

/** Isian penandatangan ("" = kosong). */
export interface SignerValues {
  signer_source: string;
  /** Dipakai kalau sumbernya Unit: id PENUGASAN pejabat */
  signer_assignment_id: string;
  /** Dipakai kalau sumbernya Kantor Regional / Head Office */
  signer_name: string;
  signer_position: string;
}

export const EMPTY_SIGNER: SignerValues = {
  signer_source: "",
  signer_assignment_id: "",
  signer_name: "",
  signer_position: "",
};

/** Apakah penandatangan diketik (Kantor Regional / Head Office), bukan dipilih dari unit? */
export function isExternalSigner(source: string): boolean {
  return source === SIGNER_SOURCE.regional || source === SIGNER_SOURCE.headOffice;
}

/** Apakah ada isian penandatangan yang sudah diisi? */
export function hasSigner(values: SignerValues): boolean {
  return Boolean(values.signer_source || values.signer_assignment_id || values.signer_name.trim() || values.signer_position.trim());
}

/**
 * Periksa penandatangan. `required` = wajib diisi (mis. jenis dokumen SK).
 * Hasilnya pesan error per isian (kunci = nama isian), kosong kalau benar.
 *
 *   Unit            -> pejabat wajib dipilih
 *   Regional / HO   -> nama & jabatan wajib diketik
 */
export function checkSigner(values: SignerValues, required: boolean): Partial<Record<keyof SignerValues, string>> {
  if (!required && !hasSigner(values)) return {};

  if (!values.signer_source) return { signer_source: "Pilih asal Penandatangan" };
  if (!SIGNER_SOURCES.includes(values.signer_source)) return { signer_source: "Asal Penandatangan tidak dikenal" };

  if (values.signer_source === SIGNER_SOURCE.unit) {
    return values.signer_assignment_id ? {} : { signer_assignment_id: "Pilih pejabat Penandatangan" };
  }

  const errors: Partial<Record<keyof SignerValues, string>> = {};
  if (!values.signer_name.trim()) errors.signer_name = "Nama Penandatangan wajib diisi";
  if (!values.signer_position.trim()) errors.signer_position = "Jabatan Penandatangan wajib diisi";
  return errors;
}

/** Bentuk yang disimpan: isian yang tidak dipakai sumbernya dikosongkan. */
export function cleanSigner(values: SignerValues) {
  if (!hasSigner(values)) {
    return { signer_source: null, signer_assignment_id: null, signer_name: null, signer_position: null };
  }
  const isUnit = values.signer_source === SIGNER_SOURCE.unit;
  return {
    signer_source: values.signer_source,
    signer_assignment_id: isUnit ? values.signer_assignment_id : null,
    signer_name: isUnit ? null : values.signer_name.trim(),
    signer_position: isUnit ? null : values.signer_position.trim(),
  };
}

/**
 * Penandatangan untuk ditampilkan: "Nama, Jabatan — Asal".
 *   formatSigner({ name: "Ir. Budi", position_title: "Direktur SDM", source: "Head Office" })
 *   -> "Ir. Budi, Direktur SDM — Head Office"
 */
export function formatSigner(signer: { name: string; position_title: string; source: string } | null): string {
  return signer ? `${signer.name}, ${signer.position_title} — ${signer.source}` : "-";
}
